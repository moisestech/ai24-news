'use client'

import { useState, useRef, useCallback } from 'react'
import { useAtom } from 'jotai'
import { imageGenerationAtom } from '../atoms'
import { useToast } from '@/hooks/use-toast'
import { useApi } from './useApi'
import { useArtStyle } from './useArtStyle'

// Define types for API responses
interface NewsResponse {
  headline: string
  source: string
  url: string
}

interface ImageResponse {
  imageUrl: string
  style: string
}

interface NewsState {
  headline: string
  source: string
  url: string
  imageUrl?: string
  artStyle?: string
}

export function useNews(initialNews?: NewsState | null) {
  const [currentNews, setCurrentNews] = useState<NewsState | null>(initialNews || null)
  const requestCache = useRef(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [, setImageState] = useAtom(imageGenerationAtom)
  const { toast } = useToast()
  const { fetchWithCache } = useApi<NewsResponse | ImageResponse>()
  const { getRandomStyle } = useArtStyle()

  const fetchNews = useCallback(async () => {
    try {
      const newsResponse = await fetchWithCache('/api/fetch-news', undefined, {
        key: 'latest-news',
        ttl: 5 * 60 * 1000
      }) as NewsResponse

      setCurrentNews({
        headline: newsResponse.headline,
        source: newsResponse.source,
        url: newsResponse.url
      })
      
      setImageState(prev => ({ ...prev, loading: true, error: null }))

      const style = getRandomStyle()
      const imageResponse = await fetchWithCache(
        '/api/generate-image',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            headline: newsResponse.headline,
            style 
          })
        },
        {
          key: `image-${newsResponse.headline}`,
          ttl: 24 * 60 * 60 * 1000
        }
      ) as ImageResponse

      setImageState(prev => ({ ...prev, loading: false, imageUrl: imageResponse.imageUrl }))
      setCurrentNews(prev => prev ? { 
        ...prev, 
        imageUrl: imageResponse.imageUrl, 
        artStyle: imageResponse.style 
      } : null)

    } catch (err) {
      console.error('News fetch failed:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load news. Please try again."
      })
    }
  }, [fetchWithCache, getRandomStyle, setImageState, toast])

  const fetchLatestNews = useCallback(async () => {
    const cacheKey = `news-${new Date().toISOString().split('T')[0]}`
    
    if (requestCache.current.has(cacheKey)) {
      return requestCache.current.get(cacheKey)
    }

    setIsLoading(true)
    try {
      await fetchNews()
    } finally {
      setIsLoading(false)
    }
  }, [fetchNews])

  return {
    currentNews,
    isLoading,
    fetchLatestNews
  }
} 
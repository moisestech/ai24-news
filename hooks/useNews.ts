'use client'

import type { NewsResponse, ImageResponse, NewsState } from '@/types/news'
import type { ArtStyleKey } from '@/types/news'
import { NEWS_TABLE } from '@/constants/tables'

// REACT
import { useState, useCallback, useEffect } from 'react'

// HOOKS
import { useApi } from './useApi'
import { useArtStyle } from './useArtStyle'

// UTILS
import { devLog } from '@/lib/utils/log'
import { ArtStyle } from '@/types/art'
import { config } from '@/lib/config'
import { getArtStyleKey } from '@/lib/utils/art'

// SUPABASE
import { useSupabaseApp } from '@/hooks/useSupabaseApp'
import { useRateLimit } from '../hooks/useRateLimit'
import { useSession } from '../hooks/useSession'

function sanitizeForUrl(text: string): string {
  return text
    .toLowerCase()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove special characters
    .replace(/[^a-z0-9-]/g, '')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
}

export function useNews() {
  const { supabase } = useSupabaseApp()
  const { checkAndDecrementLimit, remainingLimit, isAnonymous } = useRateLimit()
  const { getSession } = useSession()
  const [state, setState] = useState<NewsState>({
    isLoading: false,
    isSaving: false,
    error: null,
    data: null,
    headline: '',
    source: '',
    url: '',
    art_style: 'Vincent Van Gogh'
  })

  const saveNewsToHistory = useCallback(async (newsData: NewsState) => {
    setState(prev => ({ ...prev, isSaving: true, error: null }))

    try {
      const session = getSession()
      
      // Save to news_history
      const { data, error: dbError } = await supabase
        .from(NEWS_TABLE)
        .insert({
          headline: newsData.headline,
          source_name: newsData.source,
          url: newsData.url,
          image_url: newsData.image_url,
          audio_url: newsData.audio_url,
          audio_alignment: newsData.audio_alignment,
          art_style: newsData.art_style,
          user_email: session?.email || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (dbError) {
        throw dbError
      }

      devLog('News saved to history', {
        prefix: 'news',
        level: 'info'
      }, { data })

      return data

    } catch (error) {
      devLog('Failed to save news to history', {
        prefix: 'news',
        level: 'error'
      }, { error })
      throw error
    } finally {
      setState(prev => ({ ...prev, isSaving: false }))
    }
  }, [supabase, getSession])

  const fetchAndSaveNews = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Check rate limit first
      const canProceed = await checkAndDecrementLimit()
      if (!canProceed) {
        throw new Error('Rate limit exceeded')
      }

      // Fetch news from API
      const response = await fetch('/api/fetch-news')
      if (!response.ok) {
        throw new Error('Failed to fetch news')
      }

      const newsData = await response.json()

      // Save to history
      const savedNews = await saveNewsToHistory(newsData)

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        data: savedNews
      }))

      devLog('News fetched and saved', {
        prefix: 'news',
        level: 'info'
      }, { 
        newsData,
        savedNews
      })

      return savedNews

    } catch (error) {
      devLog('News fetch and save failed', {
        prefix: 'news',
        level: 'error'
      }, { error })

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
        data: null
      }))

      throw error
    }
  }, [checkAndDecrementLimit, saveNewsToHistory])

  const getLatestNews = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(NEWS_TABLE)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) throw error
      return data

    } catch (error) {
      devLog('Failed to get latest news', {
        prefix: 'news',
        level: 'error'
      }, { error })
      return null
    }
  }, [supabase])

  return {
    ...state,
    fetchAndSaveNews,
    getLatestNews,
    remainingLimit,
    isAnonymous
  }
} 
import { useState, useCallback } from 'react'
import { NEWS_TABLE } from '@/constants/tables'
import { useAtom } from 'jotai'
import { userLimitAtom, newsHistoryAtom } from '../lib/atoms'
import { getSupabaseClient } from '../lib/supabase'
import { devLog } from '@/lib/utils/log'
import type { NewsItem } from '@/types/news'
import { useImageUpload } from './useImageUpload'

interface ImageState {
  url?: string
  isGenerating?: boolean
  isPending?: boolean
  error: Error | null
}

export function useImageGeneration() {
  const [imageState, setImageState] = useState<ImageState>({
    url: undefined,
    isGenerating: false,
    isPending: false,
    error: null
  })
  const [userLimit, setUserLimit] = useAtom(userLimitAtom)
  const [newsHistory, setNewsHistory] = useAtom(newsHistoryAtom)
  const { uploadImage } = useImageUpload()

  const generateImage = useCallback(async (style: string, news: NewsItem, prompt?: string) => {
    if (!news || !prompt) {
      devLog('useImageGeneration: Cannot generate image - missing news or prompt', {
        prefix: 'use-image-generation',
        level: 'error'
      }, {
        data: {
          hasNews: !!news,
          hasPrompt: !!prompt,
          newsId: news?.id,
          timestamp: new Date().toISOString()
        }
      })
      return
    }

    // Set initial state
    setImageState(prev => ({
      ...prev,
      isGenerating: true,
      isPending: false,
      error: null
    }))

    try {
      devLog('useImageGeneration: Starting image generation', {
        prefix: 'use-image-generation',
        level: 'debug'
      }, {
        data: {
          newsId: news.id,
          style,
          hasPrompt: !!prompt,
          prompt: prompt.substring(0, 100) + '...',
          timestamp: new Date().toISOString()
        }
      })

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          headline: news.headline,
          style,
          prompt,
          newsId: news.id
        }),
      })

      devLog('useImageGeneration: Received API response', {
        prefix: 'use-image-generation',
        level: 'debug'
      }, {
        data: {
          newsId: news.id,
          status: response.status,
          ok: response.ok,
          timestamp: new Date().toISOString()
        }
      })

      if (!response.ok) {
        const error = await response.json()
        devLog('useImageGeneration: API error', {
          prefix: 'use-image-generation',
          level: 'error'
        }, {
          data: {
            newsId: news.id,
            error,
            status: response.status,
            timestamp: new Date().toISOString()
          }
        })
        throw new Error(error.message || 'Failed to generate image')
      }

      const data = await response.json()
      devLog('useImageGeneration: Image generation successful', {
        prefix: 'use-image-generation',
        level: 'debug'
      }, {
        data: {
          newsId: news.id,
          hasImageData: !!data.imageData,
          timestamp: new Date().toISOString()
        }
      })

      if (!data.imageData) {
        throw new Error('No image data received from API')
      }

      // Set state for upload
      setImageState(prev => ({
        ...prev,
        isGenerating: false,
        isPending: true
      }))

      // Upload the image to storage
      const { publicUrl } = await uploadImage(data.imageData, news.headline, {
        newsId: news.id,
        bucket: 'news-images'
      })

      devLog('useImageGeneration: Image uploaded successfully', {
        prefix: 'use-image-generation',
        level: 'debug'
      }, {
        data: {
          newsId: news.id,
          publicUrl,
          timestamp: new Date().toISOString()
        }
      })

      // Update the news item with the new image URL
      const supabase = getSupabaseClient()
      if (supabase) {
        const { error } = await supabase
          .from(NEWS_TABLE)
          .update({ image_url: publicUrl })
          .eq('id', news.id)

        if (error) {
          devLog('useImageGeneration: Failed to update news with new image', {
            prefix: 'use-image-generation',
            level: 'error'
          }, {
            data: {
              newsId: news.id,
              error,
              timestamp: new Date().toISOString()
            }
          })
          throw error
        }
      }

      // Set final success state
      setImageState(prev => ({
        ...prev,
        url: publicUrl,
        isPending: false,
        error: null
      }))

    } catch (error) {
      // Set error state
      setImageState(prev => ({
        ...prev,
        isGenerating: false,
        isPending: false,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      }))

      devLog('useImageGeneration: Image generation failed', {
        prefix: 'use-image-generation',
        level: 'error'
      }, {
        data: {
          newsId: news.id,
          error,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        }
      })
      throw error
    }
  }, [uploadImage]) // Add uploadImage to dependencies

  return {
    generateImage,
    imageState,
    remainingLimit: userLimit
  }
} 
import { useState, useCallback } from 'react'
import { devLog } from '@/lib/utils/log'
import type { NewsItem } from '@/types/news'
import { mediaService } from '@/lib/services/media'
import type { ArtStyleKey } from '@/types/art'

interface ImageState {
  url?: string
  isGenerating: boolean
  isPending: boolean
  error: Error | null
  artStyle?: string
}

export function useImageGeneration() {
  const [state, setState] = useState<ImageState>({
    url: undefined,
    isGenerating: false,
    isPending: false,
    error: null
  })

  const generateImage = useCallback(async (
    newsItem: NewsItem,
    onNewsUpdated?: (news: NewsItem) => void
  ) => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }))

    try {
      devLog('Starting image generation', {
        prefix: 'useImageGeneration',
        level: 'debug'
      }, {
        data: {
          newsId: newsItem.id,
          headline: newsItem.headline,
          artStyle: newsItem.art_style,
          hasPrompt: !!newsItem.prompt
        }
      })

      const result = await mediaService.generateMedia({
        headline: newsItem.headline,
        artStyle: newsItem.art_style as ArtStyleKey,
        newsId: newsItem.id,
        onProgress: (progress) => {
          devLog('Generation progress', {
            prefix: 'useImageGeneration',
            level: 'debug'
          }, {
            data: {
              stage: progress.stage,
              progress: progress.progress,
              message: progress.message
            }
          })
        },
        onNewsUpdated: (updatedNews) => {
          devLog('News updated with new media', {
            prefix: 'useImageGeneration',
            level: 'debug'
          }, {
            data: {
              newsId: updatedNews.id,
              hasImage: !!updatedNews.image?.url,
              hasAudio: !!updatedNews.audio_url,
              hasAlignment: !!updatedNews.audio_alignment
            }
          })

          if (onNewsUpdated) {
            onNewsUpdated(updatedNews)
          }
        }
      })

      setState(prev => ({
        ...prev,
        url: result.imageUrl,
        isGenerating: false,
        isPending: false
      }))

      return result

    } catch (error) {
      devLog('Image generation failed', {
        prefix: 'useImageGeneration',
        level: 'error'
      }, { error })

      setState(prev => ({
        ...prev,
        isGenerating: false,
        isPending: false,
        error: error as Error
      }))

      throw error
    }
  }, [])

  return {
    ...state,
    generateImage
  }
} 
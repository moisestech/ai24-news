import { useState, useCallback } from 'react'
import { useAtom } from 'jotai'
import { userLimitAtom, newsHistoryAtom } from '../lib/atoms'
import { devLog } from '@/lib/utils/log'
import type { NewsItem } from '@/types/news'
import { ArtStyle } from '@/types/art'
import { saveNewsImage } from '@/lib/actions/news'

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
          timestamp: new Date().toISOString(),
          currentState: imageState
        }
      })

      // Stage 1: Generate image
      const imageRequestData = {
        headline: news.headline,
        style: ArtStyle[style as keyof typeof ArtStyle],
        prompt,
        newsId: news.id
      }

      devLog('useImageGeneration: Sending image generation request', {
        prefix: 'use-image-generation',
        level: 'debug'
      }, {
        data: {
          requestData: imageRequestData,
          timestamp: new Date().toISOString()
        }
      })

      const imageResponse = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imageRequestData)
      })

      devLog('useImageGeneration: Received image generation response', {
        prefix: 'use-image-generation',
        level: 'debug'
      }, {
        data: {
          status: imageResponse.status,
          statusText: imageResponse.statusText,
          headers: Object.fromEntries(imageResponse.headers.entries()),
          timestamp: new Date().toISOString()
        }
      })

      if (!imageResponse.ok) {
        const error = await imageResponse.json()
        throw new Error(error.message || 'Failed to generate image')
      }

      const imageResult = await imageResponse.json()

      devLog('useImageGeneration: Parsed image generation response', {
        prefix: 'use-image-generation',
        level: 'debug'
      }, {
        data: {
          hasImageData: !!imageResult.imageData,
          imageDataLength: imageResult.imageData?.length,
          hasPrompt: !!imageResult.prompt,
          hasStyle: !!imageResult.style,
          timestamp: new Date().toISOString()
        }
      })

      if (!imageResult.imageData) {
        throw new Error('No image data received from API')
      }

      // Stage 2: Upload image
      const uploadRequestData = {
        imageData: imageResult.imageData,
        headline: news.headline,
        newsId: news.id
      }

      devLog('useImageGeneration: Sending image upload request', {
        prefix: 'use-image-generation',
        level: 'debug'
      }, {
        data: {
          hasImageData: !!uploadRequestData.imageData,
          imageDataLength: uploadRequestData.imageData?.length,
          timestamp: new Date().toISOString()
        }
      })

      const uploadResponse = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uploadRequestData)
      })

      devLog('useImageGeneration: Received image upload response', {
        prefix: 'use-image-generation',
        level: 'debug'
      }, {
        data: {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          headers: Object.fromEntries(uploadResponse.headers.entries()),
          timestamp: new Date().toISOString()
        }
      })

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        throw new Error(error.message || 'Failed to upload image')
      }

      const uploadResult = await uploadResponse.json()

      devLog('useImageGeneration: Parsed image upload response', {
        prefix: 'use-image-generation',
        level: 'debug'
      }, {
        data: {
          hasImageUrl: !!uploadResult.imageUrl,
          imageUrl: uploadResult.imageUrl,
          timestamp: new Date().toISOString()
        }
      })

      if (!uploadResult.imageUrl) {
        throw new Error('No image URL received from upload API')
      }

      // Stage 3: Save image URL to database
      devLog('useImageGeneration: Saving image URL to database', {
        prefix: 'use-image-generation',
        level: 'debug'
      }, {
        data: {
          newsId: news.id,
          imageUrl: uploadResult.imageUrl,
          timestamp: new Date().toISOString()
        }
      })

      await saveNewsImage(news.id, uploadResult.imageUrl)

      // Set final success state
      setImageState(prev => ({
        ...prev,
        url: uploadResult.imageUrl,
        isGenerating: false,
        isPending: false,
        error: null
      }))

      devLog('useImageGeneration: Image generation and upload complete', {
        prefix: 'use-image-generation',
        level: 'debug'
      }, {
        data: {
          newsId: news.id,
          imageUrl: uploadResult.imageUrl,
          timestamp: new Date().toISOString(),
          finalState: {
            url: uploadResult.imageUrl,
            isPending: false,
            error: null
          }
        }
      })

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
          timestamp: new Date().toISOString(),
          finalState: {
            isGenerating: false,
            isPending: false,
            error: error instanceof Error ? error : new Error('Unknown error occurred')
          }
        }
      })
      throw error
    }
  }, [imageState])

  return {
    generateImage,
    imageState,
    remainingLimit: userLimit
  }
} 
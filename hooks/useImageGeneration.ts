import { useState } from 'react'
import { useAtom } from 'jotai'
import { userLimitAtom, newsHistoryAtom } from '../lib/atoms'
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

  const generateImage = async (style?: string, news?: NewsItem, prompt?: string) => {
    if (!news || !prompt) {
      devLog('Cannot generate image - missing news or prompt', {
        prefix: 'useImageGeneration',
        level: 'error'
      }, {
        data: {
          hasNews: !!news,
          hasPrompt: !!prompt,
          newsId: news?.id,
          artStyle: style
        }
      })
      return
    }

    try {
      setImageState(prev => ({
        ...prev,
        isGenerating: true,
        isPending: true,
        error: null
      }))

      devLog('Starting image generation', {
        prefix: 'useImageGeneration',
        level: 'debug'
      }, {
        data: {
          newsId: news.id,
          artStyle: style,
          prompt
        }
      })

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          headline: news.headline,
          style,
          prompt,
          newsId: news.id
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate image')
      }

      const data = await response.json()

      devLog('Image generation successful, uploading to storage', {
        prefix: 'useImageGeneration',
        level: 'debug'
      }, {
        data: {
          newsId: news.id,
          hasImageData: !!data.imageData
        }
      })

      // Upload the generated image to storage
      const { publicUrl } = await uploadImage(data.imageData, news.headline, {
        newsId: news.id,
        bucket: 'news-images'
      })

      devLog('Image uploaded successfully', {
        prefix: 'useImageGeneration',
        level: 'debug'
      }, {
        data: {
          newsId: news.id,
          imageUrl: publicUrl
        }
      })

      // Update the news item in the history with the new image URL
      setNewsHistory(prev => prev.map(item => 
        item.id === news.id 
          ? { ...item, image_url: publicUrl }
          : item
      ))

      // Update the image state
      setImageState({
        url: publicUrl,
        isGenerating: false,
        isPending: false,
        error: null
      })

      // Update user's remaining limit
      setUserLimit(prev => prev - 1)

    } catch (error) {
      devLog('Image generation failed', {
        prefix: 'useImageGeneration',
        level: 'error'
      }, { error })
      
      setImageState(prev => ({
        ...prev,
        isGenerating: false,
        isPending: false,
        error: error instanceof Error ? error : new Error('Failed to generate image')
      }))
      throw error
    }
  }

  return {
    generateImage,
    imageState,
    remainingLimit: userLimit
  }
} 
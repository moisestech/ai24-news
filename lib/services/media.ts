import { devLog } from '@/lib/utils/log'
import { ArtStyle, type ArtStyleKey, type ArtStyleValue } from '@/types/art'
import { promptService } from './prompt'
import { saveNewsImage } from '@/lib/actions/news'
import type { NewsItem } from '@/types/news'

interface MediaGenerationConfig {
  headline: string
  artStyle: ArtStyleKey
  newsId?: string
  onProgress?: (progress: MediaGenerationProgress) => void
  onNewsUpdated?: (news: NewsItem) => void
}

interface MediaGenerationProgress {
  stage: 'prompt' | 'image' | 'upload' | 'audio' | 'complete'
  progress: number
  message: string
  error?: string
}

interface MediaGenerationResult {
  imageUrl: string
  audioUrl: string
  prompt: string
  metadata: {
    style: ArtStyleValue
    headline: string
    timestamp: string
    model: string
    style_notes: string[]
    composition: string
    lighting: string
    color_palette: string
    negative_prompt?: string
  }
}

export class MediaService {
  async generateMedia(config: MediaGenerationConfig): Promise<MediaGenerationResult> {
    const progress = (stage: MediaGenerationProgress['stage'], progress: number, message: string, error?: string) => {
      config.onProgress?.({
        stage,
        progress,
        message,
        error
      })
    }

    try {
      // Stage 1: Generate prompt
      progress('prompt', 0.2, 'Generating artistic prompt...')
      const promptResult = await promptService.generatePrompt({
        headline: config.headline,
        artStyle: config.artStyle
      })

      // Stage 2: Generate image
      progress('image', 0.4, 'Creating artistic image...')
      const imageResponse = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: config.headline,
          style: ArtStyle[config.artStyle],
          prompt: promptResult.prompt,
          newsId: config.newsId
        })
      })

      if (!imageResponse.ok) {
        const error = await imageResponse.json()
        throw new Error(error.message || 'Failed to generate image')
      }

      const { imageData } = await imageResponse.json()

      if (!imageData) {
        throw new Error('No image data received from API')
      }

      // Stage 3: Upload image
      progress('upload', 0.6, 'Uploading generated image...')
      const uploadResponse = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData,
          headline: config.headline,
          newsId: config.newsId
        })
      })

      devLog('MediaService: Upload response', {
        prefix: 'media-service',
        level: 'debug'
      }, {
        data: {
          uploadResponse
        }
      })

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        throw new Error(error.message || 'Failed to upload image')
      }

      const { imageUrl } = await uploadResponse.json()

      // Stage 4: Generate audio through API
      progress('audio', 0.8, 'Generating audio narration...')
      const audioResponse = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: config.headline,
          newsId: config.newsId
        })
      })

      if (!audioResponse.ok) {
        const error = await audioResponse.json()
        throw new Error(error.message || 'Failed to generate audio')
      }

      const audioResult = await audioResponse.json()

      devLog('Audio generation result', {
        prefix: 'media-service',
        level: 'debug'
      }, {
        data: {
          hasAudioUrl: !!audioResult.audioUrl,
          hasAlignment: !!audioResult.alignment,
          alignmentType: audioResult.alignment ? typeof audioResult.alignment : 'undefined',
          alignmentKeys: audioResult.alignment ? Object.keys(audioResult.alignment) : []
        }
      })

      // Stage 5: Update database with all media data
      if (config.newsId) {
        progress('complete', 0.9, 'Saving media data...')
        const updatedNews = await this.updateNewsWithMedia(config.newsId, {
          imageUrl,
          audioUrl: audioResult.audioUrl,
          audioAlignment: audioResult.alignment ? {
            characters: audioResult.alignment.characters || [],
            character_start_times_seconds: audioResult.alignment.character_start_times_seconds || [],
            character_end_times_seconds: audioResult.alignment.character_end_times_seconds || []
          } : undefined,
          prompt: promptResult.prompt
        })
        
        devLog('News updated with media', {
          prefix: 'media-service',
          level: 'debug'
        }, {
          data: {
            newsId: config.newsId,
            hasImage: !!imageUrl,
            hasAudio: !!audioResult.audioUrl,
            hasAlignment: !!audioResult.alignment,
            alignmentType: audioResult.alignment ? typeof audioResult.alignment : 'undefined',
            alignmentKeys: audioResult.alignment ? Object.keys(audioResult.alignment) : []
          }
        })

        // Call the callback with the updated news item
        if (config.onNewsUpdated) {
          config.onNewsUpdated(updatedNews)
        }
      }

      // Stage 6: Complete
      progress('complete', 1, 'Media generation complete!')

      return {
        imageUrl,
        audioUrl: audioResult.audioUrl,
        prompt: promptResult.prompt,
        metadata: {
          ...promptResult.metadata,
          style: ArtStyle[config.artStyle],
          timestamp: new Date().toISOString()
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      progress('complete', 0, 'Media generation failed', errorMessage)
      throw error
    }
  }

  private async updateNewsWithMedia(
    newsId: string,
    mediaData: {
      imageUrl?: string
      audioUrl?: string
      audioAlignment?: any
      prompt?: string
    }
  ): Promise<NewsItem> {
    try {
      const response = await fetch('/api/update-news-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsId,
          ...mediaData
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update news media')
      }

      return await response.json()
    } catch (error) {
      devLog('Failed to update news media', {
        prefix: 'media-service',
        level: 'error'
      }, { error })
      throw error
    }
  }
}

// Create a singleton instance
export const mediaService = new MediaService() 
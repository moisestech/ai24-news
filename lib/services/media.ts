import { devLog } from '@/lib/utils/log'
import { ArtStyle, type ArtStyleKey } from '@/types/art'
import { promptService } from './prompt'
import { getArtStyleKey } from '@/lib/utils/art/artStyles'

interface MediaGenerationConfig {
  headline: string
  artStyle: ArtStyleKey
  newsId?: string
  onProgress?: (progress: MediaGenerationProgress) => void
}

interface MediaGenerationProgress {
  stage: 'prompt' | 'image' | 'audio' | 'complete'
  progress: number
  message: string
  error?: string
}

interface MediaGenerationResult {
  imageUrl: string
  audioUrl: string
  prompt: string
  metadata: {
    artStyle: string
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

      // Stage 2: Generate image through API
      progress('image', 0.4, 'Creating artistic image...')
      const imageResponse = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: config.headline,
          artStyle: config.artStyle,
          prompt: promptResult.prompt,
          newsId: config.newsId
        })
      })

      if (!imageResponse.ok) {
        const error = await imageResponse.json()
        throw new Error(error.message || 'Failed to generate image')
      }

      const imageResult = await imageResponse.json()

      // Stage 3: Generate audio through API
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

      // Stage 4: Complete
      progress('complete', 1, 'Media generation complete!')

      return {
        imageUrl: imageResult.imageUrl,
        audioUrl: audioResult.audioUrl,
        prompt: promptResult.prompt,
        metadata: {
          ...promptResult.metadata,
          artStyle: config.artStyle,
          timestamp: new Date().toISOString()
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      progress('complete', 0, 'Media generation failed', errorMessage)
      throw error
    }
  }
}

// Create a singleton instance
export const mediaService = new MediaService() 
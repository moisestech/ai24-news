import { devLog } from '@/lib/utils/log'
import type { AudioAlignment } from '@/types/audio'

interface AudioGenerationResponse {
  status: 'ready' | 'processing' | 'failed'
  audioUrl?: string
  alignment?: AudioAlignment
  error?: string
}

interface AudioGenerationOptions {
  headline: string
  newsId: string
  voiceId?: string
  onStatusUpdate?: (status: AudioGenerationResponse) => void
}

class AudioService {
  private static instance: AudioService
  private isGenerating: Map<string, boolean> = new Map()
  private generationAttempts: Map<string, number> = new Map()
  private readonly MAX_ATTEMPTS = 3
  private readonly POLL_INTERVAL = 3000
  private readonly MAX_POLL_ATTEMPTS = 10

  private constructor() {}

  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService()
    }
    return AudioService.instance
  }

  private isAlreadyGenerating(newsId: string): boolean {
    return this.isGenerating.get(newsId) || false
  }

  private hasExceededAttempts(newsId: string): boolean {
    return (this.generationAttempts.get(newsId) || 0) >= this.MAX_ATTEMPTS
  }

  private incrementAttempts(newsId: string): void {
    const current = this.generationAttempts.get(newsId) || 0
    this.generationAttempts.set(newsId, current + 1)
  }

  private resetGenerationState(newsId: string): void {
    this.isGenerating.delete(newsId)
    this.generationAttempts.delete(newsId)
  }

  private async pollAudioStatus(newsId: string, onStatusUpdate?: (status: AudioGenerationResponse) => void): Promise<AudioGenerationResponse> {
    let attempts = 0

    while (attempts < this.MAX_POLL_ATTEMPTS) {
      try {
        attempts++
        const response = await fetch(`/api/get-audio-status?newsId=${newsId}`)
        const data: AudioGenerationResponse = await response.json()

        if (onStatusUpdate) {
          onStatusUpdate(data)
        }

        if (data.status === 'ready' || data.status === 'failed') {
          return data
        }

        await new Promise(resolve => setTimeout(resolve, this.POLL_INTERVAL))
      } catch (error) {
        devLog('Audio status polling failed', {
          prefix: 'audio-service',
          level: 'error'
        }, { error, newsId, attempt: attempts })
        
        if (attempts >= this.MAX_POLL_ATTEMPTS) {
          return {
            status: 'failed',
            error: 'Audio generation timed out'
          }
        }
      }
    }

    return {
      status: 'failed',
      error: 'Audio generation timed out'
    }
  }

  public async generateAudio({
    headline,
    newsId,
    voiceId = '21m00Tcm4TlvDq8ikWAM',
    onStatusUpdate
  }: AudioGenerationOptions): Promise<AudioGenerationResponse> {
    // Check if already generating or exceeded attempts
    if (this.isAlreadyGenerating(newsId)) {
      devLog('Audio generation already in progress', {
        prefix: 'audio-service',
        level: 'info'
      }, { newsId })
      return { status: 'processing' }
    }

    if (this.hasExceededAttempts(newsId)) {
      devLog('Audio generation attempts exceeded', {
        prefix: 'audio-service',
        level: 'info'
      }, { newsId })
      return { status: 'failed', error: 'Maximum generation attempts exceeded' }
    }

    try {
      this.isGenerating.set(newsId, true)
      this.incrementAttempts(newsId)

      devLog('Starting audio generation', {
        prefix: 'audio-service',
        level: 'debug'
      }, { headline, newsId, voiceId })

      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline, newsId, voiceId })
      })

      const data: AudioGenerationResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate audio')
      }

      // If audio is ready immediately
      if (data.status === 'ready' && data.audioUrl) {
        this.resetGenerationState(newsId)
        return data
      }

      // Start polling for status
      const pollResult = await this.pollAudioStatus(newsId, onStatusUpdate)
      this.resetGenerationState(newsId)
      return pollResult

    } catch (error) {
      this.resetGenerationState(newsId)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate audio'
      
      devLog('Audio generation failed', {
        prefix: 'audio-service',
        level: 'error'
      }, { error, newsId })

      return {
        status: 'failed',
        error: errorMessage
      }
    }
  }
}

export const audioService = AudioService.getInstance() 
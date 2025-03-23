import { devLog } from '@/lib/utils/log'
import type { AudioAlignment } from '@/types/audio'

interface ElevenLabsResponse {
  audio_base64: string
  alignment: AudioAlignment
}

interface AudioGenerationOptions {
  text: string
  voiceId?: string
  onProgress?: (status: 'processing' | 'ready' | 'failed', data?: any) => void
}

class ElevenLabsService {
  private static instance: ElevenLabsService
  private readonly API_KEY: string | null
  private readonly BASE_URL = 'https://api.elevenlabs.io/v1'
  private readonly DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'

  private constructor() {
    // Try to get API key from environment
    this.API_KEY = process.env.ELEVEN_LABS_API_KEY || null
    
    if (!this.API_KEY) {
      devLog('ElevenLabs API key is not configured', {
        prefix: 'elevenlabs',
        level: 'warn'
      })
    }
  }

  public static getInstance(): ElevenLabsService {
    if (!ElevenLabsService.instance) {
      ElevenLabsService.instance = new ElevenLabsService()
    }
    return ElevenLabsService.instance
  }

  public async generateSpeech({
    text,
    voiceId = this.DEFAULT_VOICE_ID,
    onProgress
  }: AudioGenerationOptions): Promise<ElevenLabsResponse> {
    try {
      if (!this.API_KEY) {
        throw new Error('ElevenLabs API key is not configured. Please check your environment variables.')
      }

      onProgress?.('processing')

      devLog('Starting ElevenLabs API call', {
        prefix: 'elevenlabs',
        level: 'debug'
      }, {
        data: {
          textLength: text.length,
          voiceId,
          endpoint: `${this.BASE_URL}/text-to-speech/${voiceId}/with-timestamps`
        }
      })

      const response = await fetch(
        `${this.BASE_URL}/text-to-speech/${voiceId}/with-timestamps`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': this.API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to generate speech')
      }

      const data = await response.json()

      if (!data.audio_base64) {
        throw new Error('No audio data received')
      }

      onProgress?.('ready', data)
      return data

    } catch (error) {
      devLog('ElevenLabs API call failed', {
        prefix: 'elevenlabs',
        level: 'error'
      }, { error })

      onProgress?.('failed', error)
      throw error
    }
  }

  public async getVoices() {
    try {
      if (!this.API_KEY) {
        throw new Error('ElevenLabs API key is not configured')
      }

      const response = await fetch(`${this.BASE_URL}/voices`, {
        headers: {
          'xi-api-key': this.API_KEY
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch voices')
      }

      return await response.json()
    } catch (error) {
      devLog('Failed to fetch ElevenLabs voices', {
        prefix: 'elevenlabs',
        level: 'error'
      }, { error })
      throw error
    }
  }
}

export const elevenLabsService = ElevenLabsService.getInstance() 
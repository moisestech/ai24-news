import { devLog } from './utils/log'
import { validateElevenLabsApiKey } from './utils/validation'

interface ElevenLabsResponse {
  audio_base64: string
  alignment: {
    characters: string[]
    character_start_times_seconds: number[]
    character_end_times_seconds: number[]
  }
}

// Export the type for use in other files
export type TTSResponse = ElevenLabsResponse

class ElevenLabsApiClient {
  private baseUrl = 'https://api.elevenlabs.io/v1'
  private apiKey: string | null = null
  private isKeyValidated = false
  private keyValidationResult: { isValid: boolean; message: string } = { isValid: false, message: '' }

  constructor() {
    // Get API key from environment
    this.apiKey = process.env.ELEVEN_LABS_API_KEY || null
    
    if (!this.apiKey) {
      devLog('ElevenLabs API key is not configured', {
        prefix: 'eleven-labs',
        level: 'warn'
      }, {
        data: {
          hasApiKey: false,
          isDev: process.env.NODE_ENV === 'development',
          env: process.env.NODE_ENV
        }
      })
    } else {
      // Do basic validation
      this.validateApiKey()
    }
  }

  /**
   * Validates the API key format
   */
  private validateApiKey() {
    if (!this.isKeyValidated) {
      const validationResult = validateElevenLabsApiKey()
      this.keyValidationResult = validationResult
      this.isKeyValidated = true
      
      if (!validationResult.isValid) {
        devLog(`ElevenLabs API key validation failed: ${validationResult.message}`, {
          prefix: 'eleven-labs',
          level: 'warn'
        }, {
          data: validationResult.details
        })
      } else {
        devLog('ElevenLabs API key validation successful', {
          prefix: 'eleven-labs',
          level: 'info'
        }, {
          data: validationResult.details
        })
      }
    }
    
    return this.keyValidationResult.isValid
  }

  /**
   * Validates if the API key is properly configured
   */
  public isConfigured(): boolean {
    return this.validateApiKey()
  }

  /**
   * Gets validation details about the API key
   */
  public getValidationDetails() {
    if (!this.isKeyValidated) {
      this.validateApiKey()
    }
    return this.keyValidationResult
  }

  /**
   * Generates speech from text using ElevenLabs API
   * @param text Text to convert to speech
   * @param voiceId Voice ID to use for the speech
   * @returns Audio data and alignment information
   */
  public async generateSpeech(
    text: string,
    voiceId: string = '21m00Tcm4TlvDq8ikWAM' // Default voice ID
  ): Promise<ElevenLabsResponse> {
    try {
      // Validate API key
      if (!this.apiKey) {
        throw new Error('ElevenLabs API key is not configured')
      }
      
      if (!this.validateApiKey()) {
        throw new Error(`ElevenLabs API key validation failed: ${this.keyValidationResult.message}`)
      }

      // Log the request
      devLog('Generating speech', {
        prefix: 'eleven-labs',
        level: 'info'
      }, { textLength: text.length, voiceId })

      // Make API request
      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${voiceId}/with-timestamps`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_turbo_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.8
            },
            output_format: 'mp3'
          })
        }
      )

      // Check for errors
      if (!response.ok) {
        const errorData = await response.text().catch(() => null)
        
        devLog('Speech generation failed', {
          prefix: 'eleven-labs',
          level: 'error'
        }, { 
          status: response.status, 
          statusText: response.statusText,
          errorData 
        })
        
        // Create an error object with the response included for better error handling
        const error: any = new Error(`Speech generation failed: ${response.statusText}`)
        error.response = response
        throw error
      }

      // Parse response
      const data = await response.json()
      
      // Validate response data
      if (!data.audio_base64) {
        throw new Error('Invalid response from ElevenLabs API: Missing audio data')
      }

      return {
        audio_base64: data.audio_base64,
        alignment: data.alignment || {
          characters: [],
          character_start_times_seconds: [],
          character_end_times_seconds: []
        }
      }
    } catch (error) {
      devLog('Speech generation failed', {
        prefix: 'eleven-labs',
        level: 'error'
      }, { error })
      
      throw error
    }
  }
  
  /**
   * Get available voices
   */
  public async getVoices() {
    try {
      if (!this.apiKey) {
        throw new Error('ElevenLabs API key is not configured')
      }
      
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.voices || []
    } catch (error) {
      devLog('Failed to fetch voices', {
        prefix: 'eleven-labs',
        level: 'error'
      }, { error })
      
      // Return default voices
      return [
        { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' },
        { voice_id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi' },
        { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
        { voice_id: 'ErXwobaYiN019PkySvjV', name: 'Antoni' }
      ]
    }
  }
}

// Create a singleton instance
export const elevenLabsApi = new ElevenLabsApiClient() 
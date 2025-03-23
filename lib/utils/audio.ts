import { devLog } from './log'
import { uploadToStorage } from '@/lib/actions/storage'
import { elevenLabsService } from '@/lib/services/elevenlabs'

interface AudioGenerationResult {
  audioUrl: string
  alignment: {
    characters: Array<{
      char: string
      start: number
      end: number
    }>
  }
  metadata: {
    model: string
    timestamp: string
  }
}

export async function generateAudio(text: string, voiceId?: string): Promise<AudioGenerationResult> {
  try {
    devLog('Starting audio generation', {
      prefix: 'audio-generation',
      level: 'debug'
    }, {
      data: {
        textLength: text.length,
        voiceId,
        model: 'elevenlabs'
      }
    })

    const data = await elevenLabsService.generateSpeech({
      text,
      voiceId,
      onProgress: (status) => {
        devLog('Audio generation progress', {
          prefix: 'audio-generation',
          level: 'debug'
        }, { status })
      }
    })

    // Convert base64 to blob
    const audioBlob = await fetch(`data:audio/mpeg;base64,${data.audio_base64}`).then(r => r.blob())

    // Upload to Supabase storage
    const audioUrl = await uploadToStorage(audioBlob, `audio_${Date.now()}.mp3`, {
      bucket: 'news-audio',
      path: 'generated'
    })

    devLog('Audio generated and uploaded successfully', {
      prefix: 'audio-generation',
      level: 'debug'
    }, {
      data: {
        hasAudioUrl: !!audioUrl,
        hasAlignment: !!data.alignment,
        textLength: text.length
      }
    })

    return {
      audioUrl,
      alignment: data.alignment,
      metadata: {
        model: 'elevenlabs',
        timestamp: new Date().toISOString()
      }
    }

  } catch (error) {
    devLog('Audio generation failed', {
      prefix: 'audio-generation',
      level: 'error'
    }, { error })
    throw error
  }
} 
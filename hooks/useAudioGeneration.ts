'use client'

import { useState } from 'react'
import { useSupabaseApp } from './useSupabaseApp'
import type { AudioAlignment } from '@/types/audio'
import { devLog } from '../lib/utils/log'
import { elevenLabsService } from '@/lib/services/elevenlabs'

interface AudioGenerationState {
  isGenerating: boolean
  error: Error | null
  audioUrl: string | null
  alignment: AudioAlignment | null
}

export function useAudioGeneration() {
  const { supabase } = useSupabaseApp()
  const [state, setState] = useState<AudioGenerationState>({
    isGenerating: false,
    error: null,
    audioUrl: null,
    alignment: null
  })

  const generateAudio = async (text: string, voiceId?: string) => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }))

    try {
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
      
      // Upload to Supabase Storage
      const filename = `audio/${Date.now()}-${text.slice(0, 20)}.mp3`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('news-media')
        .upload(filename, audioBlob, {
          contentType: 'audio/mpeg',
          cacheControl: '3600'
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('news-media')
        .getPublicUrl(filename)

      setState({
        isGenerating: false,
        error: null,
        audioUrl: publicUrl,
        alignment: data.alignment
      })

      return {
        audioUrl: publicUrl,
        alignment: data.alignment
      }

    } catch (error) {
      devLog('Audio generation failed', {
        prefix: 'audio-generation',
        level: 'error'
      }, { error })

      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error as Error
      }))

      throw error
    }
  }

  return {
    ...state,
    generateAudio
  }
} 
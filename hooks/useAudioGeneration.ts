'use client'

import { useState } from 'react'
import { useSupabaseApp } from './useSupabaseApp'
import type { AudioAlignment } from '@/types/audio'
import { devLog } from '../lib/utils/log'

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

  const generateAudio = async (text: string, voiceId: string = '21m00Tcm4TlvDq8ikWAM') => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }))

    try {
      // Call ElevenLabs API
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId + '/with-timestamps', {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      })

      if (!response.ok) {
        throw new Error('Failed to generate audio')
      }

      const data = await response.json()
      
      // Convert base64 to blob
      const audioBlob = await fetch(`data:audio/mpeg;base64,${data.audio_base64}`).then(r => r.blob())
      
      // Upload to Supabase Storage
      const filename = `audio/${Date.now()}-${text.slice(0, 20)}.mp3`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('news-media')
        .upload(filename, audioBlob)

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
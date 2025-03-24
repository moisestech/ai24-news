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

  const generateAudio = async (text: string, newsId?: string) => {
    if (!supabase) {
      throw new Error('Supabase client is not initialized')
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }))

    try {
      // Call our server endpoint that uses elevenLabsService
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          headline: text,
          newsId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to generate audio')
      }

      const data = await response.json()

      setState({
        isGenerating: false,
        error: null,
        audioUrl: data.audioUrl,
        alignment: data.alignment
      })

      return {
        audioUrl: data.audioUrl,
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
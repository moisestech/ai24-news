'use client'

import { useState } from 'react'
import { useSupabaseApp } from './useSupabaseApp'
import { devLog } from '../lib/utils/log'
import type { AudioAlignment, AudioGenerationState } from '@/types/audio'
import { audioService } from '@/lib/services/audio'

export function useElevenLabs() {
  const { supabase } = useSupabaseApp()
  const [state, setState] = useState<AudioGenerationState>({
    isGenerating: false,
    error: null,
    audioUrl: null,
    alignment: null
  })

  const generateSpeech = async (text: string, voiceId?: string) => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }))

    try {
      const newsId = `news-${Date.now()}`
      const result = await audioService.generateAudio({
        headline: text,
        newsId,
        voiceId,
        onStatusUpdate: (status) => {
          if (status.status === 'ready' && status.audioUrl) {
            setState({
              isGenerating: false,
              error: null,
              audioUrl: status.audioUrl,
              alignment: status.alignment || null
            })
          } else if (status.status === 'failed') {
            setState(prev => ({
              ...prev,
              isGenerating: false,
              error: new Error(status.error || 'Failed to generate audio')
            }))
          }
        }
      })

      if (result.status === 'ready' && result.audioUrl) {
        setState({
          isGenerating: false,
          error: null,
          audioUrl: result.audioUrl,
          alignment: result.alignment || null
        })

        return {
          audioUrl: result.audioUrl,
          alignment: result.alignment
        }
      }

      throw new Error(result.error || 'Failed to generate audio')

    } catch (error) {
      devLog('Speech generation failed', {
        prefix: 'eleven-labs',
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

  const pollAudioStatus = async (newsId: string): Promise<boolean> => {
    try {
      const result = await audioService.generateAudio({
        headline: '', // Not needed for polling
        newsId,
        onStatusUpdate: (status) => {
          if (status.status === 'ready' && status.audioUrl) {
            setState({
              isGenerating: false,
              error: null,
              audioUrl: status.audioUrl,
              alignment: status.alignment || null
            })
          }
        }
      })

      return result.status === 'ready'
    } catch (error) {
      devLog('Audio status polling failed', {
        prefix: 'eleven-labs',
        level: 'error'
      }, { error })
      return false
    }
  }

  return {
    ...state,
    generateSpeech,
    pollAudioStatus
  }
} 
import { useState } from 'react'
import { useSupabaseApp } from './useSupabaseApp'
import { devLog } from '../lib/utils/log'
import { elevenLabsApi } from '../lib/elevenlabs'
import type { AudioAlignment, AudioGenerationState } from '@/types/audio'

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
      // Call ElevenLabs API
      const data = await elevenLabsApi.generateSpeech(text, voiceId)
      
      // Convert base64 to blob
      const audioBlob = await fetch(`data:audio/mpeg;base64,${data.audio_base64}`).then(r => r.blob())
      
      // Upload to Supabase Storage
      const filename = `audio/${Date.now()}-${text.slice(0, 20).replace(/[^a-z0-9]/gi, '_')}.mp3`
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
      const response = await fetch(`/api/get-audio-status?newsId=${newsId}`)
      const data = await response.json()

      if (data.status === 'ready') {
        setState({
          isGenerating: false,
          error: null,
          audioUrl: data.audioUrl,
          alignment: data.alignment
        })
        return true
      }

      return false
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
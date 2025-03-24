import type { TTSResponse } from '@/lib/elevenlabs'

export interface AudioAlignment {
  characters: string[]
  character_start_times_seconds: number[]
  character_end_times_seconds: number[]
}

export interface AudioState {
  isPlaying: boolean
  isLoading: boolean
  error: Error | null
  url: string | null
  alignment: AudioAlignment | null
  currentTime: number
}

export interface AudioPlayerProps {
  newsId: string
  headline: string
  initialAudioUrl?: string | null
  initialAlignment?: AudioAlignment | null
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  onError?: (error: Error) => void
  onTimeUpdate?: (time: number) => void
  onDuration?: (duration: number) => void
  onLoading?: (loading: boolean) => void
}

export interface AudioGenerationState {
  isGenerating: boolean
  error: Error | null
  audioUrl: string | null
  alignment: AudioAlignment | null
} 
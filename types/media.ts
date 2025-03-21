import type { AudioAlignment } from './audio'

export interface MediaState {
  isGenerating: boolean
  isPending: boolean
  error: Error | null
  url: string | null
}

export interface AudioMediaState extends MediaState {
  alignment: AudioAlignment | null
}

export interface NewsCardState {
  // Basic news info
  headline: string
  source: string
  url: string
  
  // Media states
  image: MediaState
  audio: AudioMediaState
  
  // Overall status
  status: 'initializing' | 'generating' | 'ready' | 'error'
}

export interface MediaStatus {
  image: { 
    status: 'pending' | 'ready' | 'error'
    url?: string 
  }
  audio: { 
    status: 'pending' | 'ready' | 'error'
    url?: string
    alignment?: AudioAlignment 
  }
}

export type MediaType = 'image' | 'audio'

// Cache configuration
export interface MediaCache {
  url: string
  timestamp: number
  type: MediaType
  data?: AudioAlignment // For audio alignment data
} 
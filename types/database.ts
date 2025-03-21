export interface Database {
  public: {
    Tables: {
      news_history: {
        Row: {
          id: string
          headline: string
          source: string
          url: string
          image_url: string
          audio_url: string
          audio_alignment: string
          art_style: string
          user_email: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['news_history']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['news_history']['Insert']>
      }
    }
  }
}

// Export helper type for table rows
export type TableRow<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']

// Add helper types for Insert and Update
export type TableInsert<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert']

export type TableUpdate<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update']

// 1. Types
interface TTSResponse {
  audio_base64: string
  alignment: {
    characters: string[]
    character_start_times_seconds: number[]
    character_end_times_seconds: number[]
  }
  normalized_alignment: {
    characters: string[]
    character_start_times_seconds: number[]
    character_end_times_seconds: number[]
  }
}

interface AudioState {
  isPlaying: boolean
  isLoading: boolean
  currentTime: number
  duration: number
  error: Error | null
  audioUrl: string | null
  alignment: TTSResponse['alignment'] | null
}

// 2. API Client
const elevenLabsApi = {
  generateSpeech: async (text: string) => {
    // Implementation
  }
}

// 3. Components Structure
interface AudioPlayerProps {
  headline: string
  audioUrl: string
  alignment: TTSResponse['alignment']
  onPlay?: () => void
  onPause?: () => void
}
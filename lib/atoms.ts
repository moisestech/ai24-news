import { atom } from 'jotai'
import type { SupabaseClient } from '@supabase/auth-helpers-nextjs'
import { store } from './store'

// User state
export const userEmailAtom = atom<string | null>(null)
export const supabaseClientAtom = atom<SupabaseClient | null>(null)
export const userLimitAtom = atom<number>(5) // Track remaining daily requests

// News state
export const newsLoadingAtom = atom<boolean>(false)
export const currentNewsAtom = atom<{
  headline: string,
  source: string,
  url: string
} | null>(null)

// Image generation state
export interface ImageGenerationState {
  loading: boolean
  uploading: boolean
  error: string | null
  imageUrl: string | null
  currentNewsId: string | null
  status: 'idle' | 'generating' | 'uploading' | 'success' | 'error'
}

export const imageGenerationAtom = atom<ImageGenerationState>({
  loading: false,
  uploading: false,
  error: null,
  imageUrl: null,
  currentNewsId: null,
  status: 'idle'
})

// News history
export interface NewsHistoryItem {
  id: string
  headline: string
  source_name: string
  url: string
  image_url?: string
  audio_url?: string
  audio_alignment?: {
    characters: Array<{
      char: string
      start: number
      end: number
    }>
  }
  art_style?: string
  prompt?: string
  created_at: string
}

// Derived atom for news items with image generation status
export const newsHistoryWithStatusAtom = atom((get) => {
  const newsHistory = get(newsHistoryAtom)
  const imageGeneration = get(imageGenerationAtom)

  return newsHistory.map(news => {
    const isCurrentNews = imageGeneration.currentNewsId === news.id
    return {
      ...news,
      image_url: isCurrentNews ? imageGeneration.imageUrl || news.image_url : news.image_url,
      isGenerating: isCurrentNews && imageGeneration.loading,
      isUploading: isCurrentNews && imageGeneration.uploading,
      generationError: isCurrentNews ? imageGeneration.error : null,
      status: isCurrentNews ? imageGeneration.status : 'idle'
    }
  })
})

export const newsHistoryAtom = atom<NewsHistoryItem[]>([])

// Initialize atoms with the store
store.set(userEmailAtom, null)
store.set(imageGenerationAtom, {
  loading: false,
  uploading: false,
  error: null,
  imageUrl: null,
  currentNewsId: null,
  status: 'idle'
}) 
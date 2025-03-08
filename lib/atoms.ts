import { atom } from 'jotai'
import type { SupabaseClient } from '@supabase/auth-helpers-nextjs'

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
  error: string | null
  imageUrl: string | null
  artStyle?: string
}

export const imageGenerationAtom = atom<ImageGenerationState>({
  loading: false,
  error: null,
  imageUrl: null
})

// News history
export const newsHistoryAtom = atom<Array<{
  id: string
  headline: string
  source: string
  url: string
  image_url?: string
  created_at: string
}>>([]) 
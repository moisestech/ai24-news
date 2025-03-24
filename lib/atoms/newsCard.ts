import { atom } from 'jotai'
import type { NewsItem } from '@/types/news'

export type NewsCardState = {
  isActive: boolean
  isPlaying: boolean
  isLoading: boolean
  loadingState: 'idle' | 'fetching' | 'choosing-style' | 'generating-prompt' | 'generating-audio' | 'generating-image'
}

export const activeNewsCardAtom = atom<string | null>(null)

export const newsCardStatesAtom = atom<Record<string, NewsCardState>>({})

// Helper function to update card state
export const updateNewsCardState = (
  states: Record<string, NewsCardState>,
  cardId: string,
  updates: Partial<NewsCardState>
): Record<string, NewsCardState> => {
  return {
    ...states,
    [cardId]: {
      ...states[cardId],
      ...updates
    }
  }
}

// Helper function to initialize card state
export const initializeNewsCardState = (cardId: string): NewsCardState => ({
  isActive: false,
  isPlaying: false,
  isLoading: false,
  loadingState: 'idle'
}) 
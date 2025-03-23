import { atom } from 'jotai'
import type { NewsItem } from '@/types/news'

// Atom for the current news item
export const newsAtom = atom<NewsItem | null>(null)

// Atom for news loading state
export const newsLoadingAtom = atom<boolean>(false)

// Atom for news error state
export const newsErrorAtom = atom<Error | null>(null)

// Atom for news history
export const newsHistoryAtom = atom<NewsItem[]>([])

// Atom for news generation state
export const newsGenerationAtom = atom<{
  isGenerating: boolean
  stage: 'prompt' | 'image' | 'audio' | 'complete'
  progress: number
  message: string
  error?: string
} | null>(null)

// Atom for news filters
export const newsFiltersAtom = atom<{
  source?: string
  dateRange?: {
    start: string
    end: string
  }
}>({}) 
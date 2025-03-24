import type { ArtStyleKey } from './art'
import { ArtStyle } from './art'

export interface NewsItem {
  id: string
  headline: string
  source_name: string
  source_url: string
  url: string
  published_at: string
  audio_url?: string
  audio_alignment?: {
    characters: string[]
    character_start_times_seconds: number[]
    character_end_times_seconds: number[]
  } | null
  art_style: ArtStyleKey
  prompt?: string
  metadata?: Record<string, any>
  image: {
    url?: string
    isGenerating: boolean
    isPending: boolean
    error: Error | null
  }
  trending?: boolean
  error?: string
  engagement?: {
    shares: number
    saves: number
    views: number
  }
  sourceInfo?: {
    isTrusted: boolean
    coverage: string
    description: string
  }
  created_at?: string
  user_email?: string | null
  source: NewsSource
  category?: NewsCategory
  language?: NewsLanguage
  country?: NewsCountry
}

export interface DBError {
  code: string
  message: string
  details?: string
}

export interface NewsResponse {
  success: boolean
  error?: string
  news: Array<{
    headline: string
    source: string
    url: string
  }>
}

export interface ImageResponse {
  imageUrl: string
  prompt: string
  style: string
  metadata?: {
    style_notes?: string[]
    composition?: string
    lighting?: string
    color_palette?: string
    negative_prompt?: string
  }
}

export interface NewsData {
  headline: string
  source: string
  url: string
  art_style: ArtStyleKey
  image_url?: string
}

export interface NewsState {
  isLoading: boolean
  isSaving: boolean
  error: Error | null
  data: NewsItem | null
}

export interface NewsAPIResponse {
  data: Array<{
    title: string
    source: string
    url: string
    published_at: string
  }>
}

export interface DevLogOptions {
  prefix: string
  level: 'debug' | 'info' | 'warn' | 'error'
  data?: any
}

export interface NewsCardProps {
  headline: string
  source: string
  url: string
  imageUrl?: string
  artStyle?: keyof typeof ArtStyle | null
  createdAt: string
  engagement?: {
    shares: number
    saves: number
    views: number
  }
  trending?: boolean
  remainingLimit?: number
  onShare?: () => void
  onSave?: () => void
  sourceInfo?: {
    isTrusted: boolean
    coverage: string
    description: string
  }
  error?: string
  isLoading?: boolean
  onImageLoad?: () => void
  onImageError?: (error: Error) => void
  children?: React.ReactNode
  entry?: IntersectionObserverEntry | null
  showAuthPrompt?: boolean
  onImageGenerated?: (imageUrl: string) => void
  imageState?: {
    url?: string
    isGenerating?: boolean
    isPending?: boolean
    error?: Error | null
  }
  onGenerateImage?: () => Promise<void>
}

export interface NewsHistoryItem extends NewsItem {
  id: string
  audio_url?: string
  audio_alignment?: {
    characters: string[]
    character_start_times_seconds: number[]
    character_end_times_seconds: number[]
  }
  prompt?: string
  created_at: string
  user_email?: string | null
}

export function convertToNewsData(item: NewsItem): NewsData {
  return {
    headline: item.headline,
    source: item.source_name,
    url: item.url,
    art_style: item.art_style as ArtStyleKey,
    image_url: item.image?.url,
  }
}

export function convertNewsDataToState(data: NewsData | null): NewsState | null {
  if (!data) return null
  
  const newsItem: NewsItem = {
    id: Date.now().toString(), // Generate a temporary ID
    headline: data.headline,
    source_name: data.source,
    source_url: '',
    url: data.url,
    published_at: new Date().toISOString(),
    art_style: data.art_style,
    image: {
      url: data.image_url,
      isGenerating: false,
      isPending: false,
      error: null
    },
    source: {
      id: data.source,
      name: data.source,
      url: data.url,
      type: 'api'
    }
  }
  
  return {
    data: newsItem,
    isLoading: false,
    isSaving: false,
    error: null
  }
}

export interface GenerateImageResponse {
  imageUrl: string
  style: string
  success: boolean
}

export type NewsCategory = 
  | 'general'
  | 'business'
  | 'entertainment'
  | 'health'
  | 'science'
  | 'sports'
  | 'technology'

export type NewsLanguage = 
  | 'en'  // English
  | 'es'  // Spanish
  | 'fr'  // French
  | 'de'  // German
  | 'it'  // Italian
  | 'pt'  // Portuguese
  | 'nl'  // Dutch
  | 'no'  // Norwegian
  | 'se'  // Swedish
  | 'ru'  // Russian
  | 'ar'  // Arabic
  | 'he'  // Hebrew
  | 'zh'  // Chinese

export type NewsCountry = 
  | 'us'  // United States
  | 'gb'  // United Kingdom
  | 'au'  // Australia
  | 'ca'  // Canada
  | 'nz'  // New Zealand
  | 'ie'  // Ireland
  | 'in'  // India
  | 'sg'  // Singapore

export interface NewsSource {
  id: string
  name: string
  url: string
  type: 'rss' | 'api'
  lastFetched?: string
}

export interface NewsSourceFilter {
  categories?: NewsCategory[]
  countries?: NewsCountry[]
  languages?: NewsLanguage[]
  search?: string
  limit?: number
  offset?: number
}

export interface NewsSourceResponse {
  pagination: {
    limit: number
    offset: number
    count: number
    total: number
  }
  data: NewsSource[]
}

export interface MediaGenerationResult {
  imageUrl: string
  audioUrl?: string
  prompt: string
  metadata?: Record<string, any>
}

export interface ImageState {
  url?: string
  isGenerating: boolean
  isPending: boolean
  error: Error | null
  artStyle?: string
}

export interface AudioState {
  url?: string
  alignment: any | null
  isGenerating: boolean
  isPending: boolean
  error: Error | null
}

export interface NewsSourceConfig {
  id: string
  name: string
  url: string
  type: 'rss' | 'api'
  lastFetched?: string
}
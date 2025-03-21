import { ArtStyle } from '@/types/art'

export type ArtStyleKey = keyof typeof ArtStyle

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  image_url?: string;
  art_style?: string;
  image_name?: string;
  created_at: string;
  user_id?: string;
}

export interface DBError {
  code: string;
  message: string;
  details?: string;
}

export interface NewsResponse {
  headline: string
  source: string
  url: string
}

export interface ImageResponse {
  imageUrl: string
  style: string
  imageName: string
  imageData: Blob | Buffer
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
  data: NewsData | null
  headline: string
  source: string
  url: string
  art_style: ArtStyleKey
  image_url?: string
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

export interface ImageState {
  isGenerating: boolean
  isPending: boolean
  error: Error | null
  url: string | null
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
  imageState?: ImageState
  onGenerateImage?: () => Promise<void>
}

export interface NewsHistoryItem {
  headline: string
  source: string
  url: string
  image_url: string
  art_style: ArtStyleKey
  created_at: string
  user_email?: string | null
}

export function convertToNewsData(item: NewsItem): NewsData {
  return {
    headline: item.title,
    source: item.source,
    url: item.url,
    art_style: item.art_style as ArtStyleKey,
    image_url: item.image_url,
  }
}

export function convertNewsDataToState(data: NewsData | null): NewsState | null {
  if (!data) return null
  
  return {
    headline: data.headline,
    source: data.source,
    url: data.url,
    art_style: data.art_style || 'VanGogh',
    image_url: data.image_url,
    isLoading: false,
    isSaving: false,
    error: null,
    data: data
  }
}

export interface GenerateImageResponse {
  imageUrl: string
  style: string
  success: boolean
}
import { ArtStyle } from '@/types/art'
import type { ArtStyleKey } from '@/types/news'

// Type guard to check if a string is a valid enum key
export function isArtStyleKey(value: any): value is ArtStyleKey {
  return typeof value === 'string' && value in ArtStyle
}

// Type guard to check if a string is a valid display value
export function isArtStyleValue(value: unknown): value is string {
  return typeof value === 'string' && Object.values(ArtStyle).includes(value as any)
}

// Get the key from a display value
export function getArtStyleKey(displayValue: string): ArtStyleKey {
  const entry = Object.entries(ArtStyle)
    .find(([_, value]) => value === displayValue)
  return (entry?.[0] as ArtStyleKey) || 'VanGogh'
}

// Get the display value from a key
export function getArtStyleDisplay(style: ArtStyleKey): string {
  return ArtStyle[style]
}

// Server-side validation helper
export function ensureArtStyle(style: ArtStyleKey | undefined): ArtStyleKey {
  if (!style || !isArtStyleKey(style)) {
    return 'VanGogh'
  }
  return style
}

// Validate art style string
export function isValidArtStyle(style: string): boolean {
  return isArtStyleKey(style) || isArtStyleValue(style)
}

// Normalize art style to key format
export function normalizeArtStyle(style: string): ArtStyleKey {
  if (isArtStyleKey(style)) {
    return style
  }
  return getArtStyleKey(style)
} 
'use client'

import { ArtStyle } from '@/types/art'
import type { ArtStyleKey } from '@/types/news'
import { devLog } from '@/lib/utils/log'

// Art style validation helpers
export function ensureArtStyle(style: ArtStyleKey | undefined): ArtStyleKey {
  if (!style || !isArtStyleKey(style)) {
    return 'VanGogh'
  }
  return style
}

// Type guard to check if a string is a valid enum key
export function isArtStyleKey(value: any): value is ArtStyleKey {
  return typeof value === 'string' && value in ArtStyle
}

// Type guard to check if a string is a valid display value
export function isArtStyleValue(value: unknown): value is ArtStyle {
  return typeof value === 'string' && Object.values(ArtStyle).includes(value as ArtStyle)
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

// Debug helper
export function debugArtStyle(value: unknown) {
  return {
    value,
    type: typeof value,
    isKey: isArtStyleKey(value),
    asKey: isArtStyleKey(value) ? value : getArtStyleKey(value as string),
    asDisplay: isArtStyleKey(value) ? ArtStyle[value] : value,
    validKeys: Object.keys(ArtStyle),
    validValues: Object.values(ArtStyle),
    validation: {
      isString: typeof value === 'string',
      exists: !!value,
      isValidKey: isArtStyleKey(value),
      isValidValue: isArtStyleValue(value)
    }
  }
}

// Convert any art style format to display value
export function getArtStyleValue(style: ArtStyle | string): string {
  devLog('Converting art style', {
    prefix: 'art-style',
    level: 'debug'
  }, {
    data: {
      input: style,
      type: typeof style,
      isEnumKey: style in ArtStyle,
      isDisplayValue: Object.values(ArtStyle).includes(style as ArtStyle)
    }
  })

  if (typeof style === 'string') {
    if (Object.values(ArtStyle).includes(style as ArtStyle)) {
      return style
    }
    if (style in ArtStyle) {
      return ArtStyle[style as keyof typeof ArtStyle]
    }
    return ArtStyle.VanGogh
  }

  return ArtStyle[style] || ArtStyle.VanGogh
}

// Validate art style string
export function isValidArtStyle(style: string): boolean {
  return isArtStyleKey(style) || isArtStyleValue(style)
} 
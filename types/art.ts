import { devLog } from '@/lib/utils/log'

export enum ArtStyle {
  VanGogh = 'Vincent Van Gogh',
  Picasso = 'Pablo Picasso',
  DaVinci = 'Leonardo da Vinci',
  Monet = 'Claude Monet',
  Rembrandt = 'Rembrandt',
  Dali = 'Salvador Dali'
}

export type ArtStyleKey = keyof typeof ArtStyle
export type ArtStyleValue = typeof ArtStyle[ArtStyleKey]

// Keep art-related interfaces
export interface AnonymousSession {
  id: string
  lastGeneration?: string
  generationsToday: number
  lastResetDate: string
}

// Type guard to check if a string is a valid enum key
export function isArtStyleKey(value: any): value is ArtStyleKey {
  return typeof value === 'string' && value in ArtStyle
}

// Type guard to check if a string is a valid display value
export function isArtStyleValue(value: unknown): value is ArtStyleValue {
  return typeof value === 'string' && Object.values(ArtStyle).includes(value as ArtStyle)
}

export function getArtStyleKey(displayValue: string): ArtStyleKey {
  const entry = Object.entries(ArtStyle)
    .find(([_, value]) => value === displayValue)
  return (entry?.[0] as ArtStyleKey) || 'VanGogh'
}

export function getArtStyleDisplay(style: ArtStyleKey): string {
  return ArtStyle[style]
}

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

// Helper to check if a string is a valid display value
export function isValidArtStyle(style: string): boolean {
  // Check if it's a valid display value
  const validDisplayValues = Object.values(ArtStyle)
  if (validDisplayValues.includes(style as ArtStyle)) {
    return true
  }
  
  // Check if it's a valid enum key
  const validKeys = Object.keys(ArtStyle)
  return validKeys.includes(style)
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
    // If it's already a display value, return it
    if (Object.values(ArtStyle).includes(style as ArtStyle)) {
      return style
    }
    // If it's an enum key, get the display value
    if (style in ArtStyle) {
      return ArtStyle[style as keyof typeof ArtStyle]
    }
    // Default to VanGogh if invalid
    return ArtStyle.VanGogh
  }

  // If it's an enum value, get its display value
  return ArtStyle[style] || ArtStyle.VanGogh
}

// Art style validation helpers
export function ensureArtStyle(style: ArtStyleKey | undefined): ArtStyleKey {
  if (!style || !isArtStyleKey(style)) {
    return 'VanGogh'
  }
  return style
}
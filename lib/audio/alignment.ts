import { devLog } from '@/lib/utils/log'

// Raw alignment data from ElevenLabs
export interface RawAudioAlignment {
  characters: Array<{
    char: string
    start: number
    end: number
  }>
}

// Normalized alignment data used by the app
export interface NormalizedAudioAlignment {
  characters: string[]
  character_start_times_seconds: number[]
  character_end_times_seconds: number[]
}

// Database format (matches what we store in Supabase)
export interface DBAudioAlignment extends RawAudioAlignment {}

/**
 * Normalizes raw audio alignment data into the format expected by the app
 */
export function normalizeAudioAlignment(raw: RawAudioAlignment | NormalizedAudioAlignment | null | undefined): NormalizedAudioAlignment | undefined {
  if (!raw) {
    devLog('No valid audio alignment data to normalize', {
      prefix: 'audio-alignment',
      level: 'debug'
    })
    return undefined
  }

  try {
    // If the data is already in normalized format, validate and return it
    if ('character_start_times_seconds' in raw) {
      const normalized = raw as NormalizedAudioAlignment
      if (isValidNormalizedAlignment(normalized)) {
        return normalized
      }
    }

    // Otherwise, normalize from raw format
    if (!raw.characters?.length) {
      devLog('No valid audio alignment data to normalize', {
        prefix: 'audio-alignment',
        level: 'debug'
      })
      return undefined
    }

    const rawChars = raw.characters as Array<{ char: string; start: number; end: number }>
    const normalized: NormalizedAudioAlignment = {
      characters: rawChars.map(c => c.char),
      character_start_times_seconds: rawChars.map(c => c.start),
      character_end_times_seconds: rawChars.map(c => c.end)
    }

    // Validate the normalized data
    if (!isValidNormalizedAlignment(normalized)) {
      devLog('Invalid normalized alignment data', {
        prefix: 'audio-alignment',
        level: 'error'
      }, { normalized })
      return undefined
    }

    return normalized
  } catch (error) {
    devLog('Failed to normalize audio alignment', {
      prefix: 'audio-alignment',
      level: 'error'
    }, { error, raw })
    return undefined
  }
}

/**
 * Validates normalized alignment data
 */
function isValidNormalizedAlignment(alignment: NormalizedAudioAlignment): boolean {
  const { characters, character_start_times_seconds, character_end_times_seconds } = alignment

  // Check array lengths match
  if (characters.length !== character_start_times_seconds.length || 
      characters.length !== character_end_times_seconds.length) {
    return false
  }

  // Check for invalid values
  return characters.every((char, i) => {
    const start = character_start_times_seconds[i]
    const end = character_end_times_seconds[i]
    return (
      typeof char === 'string' &&
      typeof start === 'number' &&
      typeof end === 'number' &&
      start >= 0 &&
      end >= start
    )
  })
}

/**
 * Converts normalized alignment back to raw format (useful for saving to DB)
 */
export function denormalizeAudioAlignment(normalized: NormalizedAudioAlignment | null | undefined): DBAudioAlignment | undefined {
  if (!normalized?.characters?.length) {
    return undefined
  }

  try {
    return {
      characters: normalized.characters.map((char, i) => ({
        char,
        start: normalized.character_start_times_seconds[i],
        end: normalized.character_end_times_seconds[i]
      }))
    }
  } catch (error) {
    devLog('Failed to denormalize audio alignment', {
      prefix: 'audio-alignment',
      level: 'error'
    }, { error, normalized })
    return undefined
  }
} 
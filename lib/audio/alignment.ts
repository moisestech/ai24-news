import { devLog } from '@/lib/utils/log'
import type { AudioAlignment } from '@/types/audio'

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
export function normalizeAudioAlignment(alignment: any): AudioAlignment | null {
  if (!alignment) {
    devLog('No alignment data provided', {
      prefix: 'audio-alignment',
      level: 'debug'
    })
    return null
  }

  // Log the input alignment structure
  devLog('Normalizing audio alignment', {
    prefix: 'audio-alignment',
    level: 'debug'
  }, {
    data: {
      hasAlignment: !!alignment,
      alignmentType: typeof alignment,
      alignmentKeys: Object.keys(alignment),
      hasCharacters: !!alignment.characters,
      charactersType: alignment.characters ? typeof alignment.characters : 'undefined',
      hasStartTimes: !!alignment.character_start_times_seconds,
      hasEndTimes: !!alignment.character_end_times_seconds
    }
  })

  // If it's already in the correct format (matches database format)
  if (
    Array.isArray(alignment.characters) &&
    Array.isArray(alignment.character_start_times_seconds) &&
    Array.isArray(alignment.character_end_times_seconds)
  ) {
    devLog('Alignment already in correct format', {
      prefix: 'audio-alignment',
      level: 'debug'
    }, {
      data: {
        charactersLength: alignment.characters.length,
        startTimesLength: alignment.character_start_times_seconds.length,
        endTimesLength: alignment.character_end_times_seconds.length,
        sampleCharacters: alignment.characters.slice(0, 5),
        sampleStartTimes: alignment.character_start_times_seconds.slice(0, 5),
        sampleEndTimes: alignment.character_end_times_seconds.slice(0, 5)
      }
    })
    return alignment
  }

  // If it's in the raw format (array of objects with char, start, end)
  if (Array.isArray(alignment.characters) && alignment.characters[0]?.char) {
    devLog('Converting raw alignment format', {
      prefix: 'audio-alignment',
      level: 'debug'
    }, {
      data: {
        charactersLength: alignment.characters.length,
        sampleRaw: alignment.characters.slice(0, 5)
      }
    })

    const normalized = {
      characters: alignment.characters.map(c => c.char),
      character_start_times_seconds: alignment.characters.map(c => c.start),
      character_end_times_seconds: alignment.characters.map(c => c.end)
    }

    devLog('Converted alignment format', {
      prefix: 'audio-alignment',
      level: 'debug'
    }, {
      data: {
        charactersLength: normalized.characters.length,
        startTimesLength: normalized.character_start_times_seconds.length,
        endTimesLength: normalized.character_end_times_seconds.length,
        sampleCharacters: normalized.characters.slice(0, 5),
        sampleStartTimes: normalized.character_start_times_seconds.slice(0, 5),
        sampleEndTimes: normalized.character_end_times_seconds.slice(0, 5)
      }
    })

    return normalized
  }

  devLog('Invalid alignment format', {
    prefix: 'audio-alignment',
    level: 'error'
  }, {
    data: {
      alignment,
      alignmentType: typeof alignment,
      alignmentKeys: Object.keys(alignment)
    }
  })

  return null
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
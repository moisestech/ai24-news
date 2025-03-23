import { z } from 'zod'
import { ArtStyle } from '@/types/art'
import type { ArtStyleKey } from '@/types/news'

// Create a union of valid art styles
const artStyleEnum = z.enum(Object.keys(ArtStyle) as [ArtStyleKey, ...ArtStyleKey[]])

// Audio alignment type
const audioAlignmentSchema = z.object({
  characters: z.array(z.object({
    char: z.string(),
    start: z.number(),
    end: z.number()
  }))
})

// Database schema
export const NewsHistorySchema = z.object({
  headline: z.string().min(1, 'Headline is required').max(500),
  source: z.string().min(1, 'Source is required'),
  url: z.string().url('Must be a valid URL'),
  image_url: z.string().url('Must be a valid image URL'),
  audio_url: z.string().url('Must be a valid audio URL').optional(),
  audio_alignment: audioAlignmentSchema.optional(),
  art_style: artStyleEnum,
  user_email: z.string().email().nullable().optional(),
  created_at: z.string().datetime()
})

export type NewsHistoryRecord = z.infer<typeof NewsHistorySchema> 
'use client'

import { ArtStyle } from '@/types/art'
import type { ArtStyleKey } from '@/types/news'
import { getArtStyleValue } from '@/lib/utils/art'

interface ArtStyleConfig {
  id: string
  name: string
  prompt: string
  description: string
  image?: string
}

const artStyles: ArtStyleConfig[] = [
  {
    id: 'style-van-gogh',
    name: 'Vincent Van Gogh',
    prompt: 'in the style of Vincent Van Gogh, with bold brushstrokes, vibrant colors, and swirling patterns',
    description: 'Post-impressionist style with bold colors and expressive brushstrokes'
  },
  {
    id: 'style-monet',
    name: 'Claude Monet',
    prompt: 'in the style of Claude Monet, with soft impressionist brushstrokes, natural light, and atmospheric effects',
    description: 'Impressionist style focusing on light and atmosphere'
  },
  {
    id: 'style-dali',
    name: 'Salvador Dalí',
    prompt: 'in the style of Salvador Dalí, with surreal elements, dreamlike qualities, and melting forms',
    description: 'Surrealist style with dreamlike and bizarre elements'
  },
  {
    id: 'style-picasso',
    name: 'Pablo Picasso',
    prompt: 'in the style of Pablo Picasso, with cubist forms, geometric shapes, and multiple perspectives',
    description: 'Cubist style with fragmented geometric forms'
  }
]

export function useArtStyle() {
  const getRandomStyle = (): ArtStyleKey => {
    const styles = Object.keys(ArtStyle) as ArtStyleKey[]
    const randomIndex = Math.floor(Math.random() * styles.length)
    return styles[randomIndex]
  }

  return {
    getRandomStyle,
    getArtStyleValue
  }
} 
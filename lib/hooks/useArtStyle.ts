'use client'

interface ArtStyle {
  id: string
  name: string
  prompt: string
  description: string
  image?: string
}

const artStyles: ArtStyle[] = [
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
  const getRandomStyle = () => {
    const randomIndex = Math.floor(Math.random() * artStyles.length)
    return artStyles[randomIndex]
  }

  return {
    artStyles,
    getRandomStyle
  }
} 
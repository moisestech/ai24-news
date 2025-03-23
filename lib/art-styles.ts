import { ArtStyle } from '@/types/art'

export interface ArtStyleDescription {
  name: string
  description: string
  keywords: string[]
  negativePrompt?: string
  composition?: string
  lighting?: string
  colorPalette?: string
}

export const artStyleDescriptions: Record<keyof typeof ArtStyle, ArtStyleDescription> = {
  VanGogh: {
    name: 'Vincent Van Gogh',
    description: 'Post-impressionist style characterized by bold, expressive brushstrokes, vibrant colors, and emotional intensity. Features swirling patterns, thick impasto technique, and dramatic use of color to convey emotion and movement.',
    keywords: ['swirling', 'bold', 'expressive', 'vibrant', 'impasto', 'emotional', 'dramatic', 'movement', 'textured', 'intense'],
    negativePrompt: 'blurry, flat, dull, oversaturated, cartoonish, artificial, digital, smooth, perfect, clean',
    composition: 'dynamic composition with strong diagonal lines and swirling patterns',
    lighting: 'dramatic lighting with strong contrasts and emotional impact',
    colorPalette: 'vibrant, pure colors with emphasis on yellows, blues, and greens'
  },
  Picasso: {
    name: 'Pablo Picasso',
    description: 'Cubist style featuring geometric shapes, multiple viewpoints, and abstracted forms. Characterized by fragmented objects, bold lines, and a revolutionary approach to perspective and representation.',
    keywords: ['geometric', 'abstract', 'fragmented', 'bold', 'revolutionary', 'multi-perspective', 'cubist', 'structured', 'innovative', 'deconstructed'],
    negativePrompt: 'realistic, smooth, natural, organic, traditional, photographic, perfect, clean, simple, flat',
    composition: 'fragmented composition with multiple viewpoints and geometric shapes',
    lighting: 'flat lighting with emphasis on form over light and shadow',
    colorPalette: 'monochromatic or limited color palette with emphasis on form'
  },
  DaVinci: {
    name: 'Leonardo da Vinci',
    description: 'Renaissance master style known for sfumato technique, anatomical precision, and scientific observation. Features soft transitions, detailed realism, and perfect balance of light and shadow.',
    keywords: ['realistic', 'detailed', 'sfumato', 'balanced', 'precise', 'anatomical', 'scientific', 'harmonious', 'masterful', 'refined'],
    negativePrompt: 'cartoonish, exaggerated, artificial, digital, modern, harsh, oversaturated, flat, rough, imperfect',
    composition: 'balanced composition with perfect proportions and golden ratio',
    lighting: 'soft, natural lighting with subtle sfumato transitions',
    colorPalette: 'natural, muted colors with emphasis on earth tones'
  },
  Monet: {
    name: 'Claude Monet',
    description: 'Impressionist style capturing light and atmosphere through loose brushwork and pure colors. Characterized by outdoor scenes, emphasis on light effects, and visible brushstrokes that create movement.',
    keywords: ['impressionist', 'atmospheric', 'light', 'outdoor', 'movement', 'colorful', 'natural', 'spontaneous', 'luminous', 'ethereal'],
    negativePrompt: 'dark, gloomy, artificial, digital, harsh, oversaturated, flat, static, perfect, clean',
    composition: 'natural composition with emphasis on light and atmosphere',
    lighting: 'natural outdoor lighting with emphasis on light effects and reflections',
    colorPalette: 'pure, bright colors with emphasis on light and atmosphere'
  },
  Rembrandt: {
    name: 'Rembrandt',
    description: 'Baroque master style known for dramatic lighting, rich textures, and psychological depth. Features chiaroscuro technique, emotional intensity, and masterful use of dark and light contrasts.',
    keywords: ['dramatic', 'chiaroscuro', 'textured', 'psychological', 'rich', 'contrasting', 'emotional', 'masterful', 'deep', 'atmospheric'],
    negativePrompt: 'bright, flat, artificial, digital, oversaturated, cartoonish, perfect, clean, simple, modern',
    composition: 'dramatic composition with strong chiaroscuro effects',
    lighting: 'dramatic lighting with strong contrasts and deep shadows',
    colorPalette: 'rich, deep colors with emphasis on dark tones and dramatic lighting'
  },
  Dali: {
    name: 'Salvador Dali',
    description: 'Surrealist style characterized by dreamlike imagery, melting forms, and bizarre juxtapositions. Features precise rendering of impossible scenes, symbolic elements, and exploration of the subconscious.',
    keywords: ['surreal', 'dreamlike', 'melting', 'symbolic', 'precise', 'bizarre', 'subconscious', 'impossible', 'fantastical', 'mysterious'],
    negativePrompt: 'realistic, natural, traditional, simple, clean, perfect, modern, digital, artificial, flat',
    composition: 'surreal composition with impossible perspectives and dreamlike elements',
    lighting: 'dramatic lighting with emphasis on surreal atmosphere',
    colorPalette: 'vibrant, surreal colors with emphasis on dreamlike atmosphere'
  },
  Pollock: {
    name: 'Jackson Pollock',
    description: 'Abstract Expressionist style known for drip painting technique, dynamic energy, and rhythmic patterns. Features layered drips, splatters, and poured paint creating complex webs of color and movement.',
    keywords: ['drip', 'dynamic', 'rhythmic', 'energetic', 'layered', 'splattered', 'poured', 'abstract', 'expressive', 'movement'],
    negativePrompt: 'representational, figurative, controlled, geometric, structured, clean, perfect, digital, artificial, flat',
    composition: 'dynamic, all-over composition with emphasis on movement and rhythm',
    lighting: 'natural lighting emphasizing the texture and depth of layered paint',
    colorPalette: 'bold, contrasting colors with emphasis on primary colors and black'
  }
}

// Helper function to randomly select elements from an array
function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function getArtStylePrompt(style: keyof typeof ArtStyle, headline: string): string {
  const description = artStyleDescriptions[style]
  
  // Randomly select 5 keywords for variety
  const selectedKeywords = getRandomElements(description.keywords, 5)
  
  // Create the prompt with all necessary elements
  const promptParts = [
    // Main subject
    headline,
    
    // Artist style introduction
    `Create an image in the distinctive style of ${description.name},`,
    
    // Style characteristics
    `characterized by ${description.description}`,
    
    // Technical elements
    `featuring ${description.composition}`,
    `with ${description.lighting}`,
    `using ${description.colorPalette}`,
    
    // Key elements
    `incorporating ${selectedKeywords.join(', ')}`,
    
    // Negative prompt
    description.negativePrompt ? `avoiding ${description.negativePrompt}` : ''
  ]

  // Filter out empty strings and join with newlines
  return promptParts.filter(Boolean).join('\n')
} 


  // // Create variations of the prompt structure
  // const promptVariations = [
  //   // Variation 1: Traditional structure
  //   [
  //     headline,
  //     `Create an image in the style of ${description.name}.`,
  //     `Style characteristics: ${description.description}`,
  //     `Composition: ${description.composition}`,
  //     `Lighting: ${description.lighting}`,
  //     `Color palette: ${description.colorPalette}`,
  //     `Key elements to include: ${selectedKeywords.join(', ')}`,
  //     description.negativePrompt ? `Avoid: ${description.negativePrompt}` : ''
  //   ],
  //   // Variation 2: More concise structure
  //   [
  //     headline,
  //     `Inspired by ${description.name}'s iconic style:`,
  //     `${description.description}`,
  //     `Featuring ${description.composition} and ${description.lighting}`,
  //     `Using ${description.colorPalette}`,
  //     `Key elements: ${selectedKeywords.join(', ')}`,
  //     description.negativePrompt ? `Avoid: ${description.negativePrompt}` : ''
  //   ],
  //   // Variation 3: Artistic focus structure
  //   [
  //     headline,
  //     `An artistic interpretation in ${description.name}'s distinctive style:`,
  //     `${description.description}`,
  //     `With ${description.composition}`,
  //     `Emphasizing ${description.lighting}`,
  //     `Colors: ${description.colorPalette}`,
  //     `Incorporating ${selectedKeywords.join(', ')}`,
  //     description.negativePrompt ? `Avoid: ${description.negativePrompt}` : ''
  //   ]
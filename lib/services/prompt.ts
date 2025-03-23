import { devLog } from '@/lib/utils/log'
import { ArtStyle } from '@/types/art'
import { z } from 'zod'

// Define the schema for the prompt response
const PromptSchema = z.object({
  prompt: z.string().describe("The detailed artistic prompt for image generation"),
  style_notes: z.array(z.string()).describe("Key style characteristics to incorporate"),
  composition: z.string().describe("Composition guidelines"),
  lighting: z.string().describe("Lighting instructions"),
  color_palette: z.string().describe("Color palette description"),
  negative_prompt: z.string().optional().describe("Elements to avoid in the generation")
})

type PromptSchema = z.infer<typeof PromptSchema>

interface PromptGenerationConfig {
  headline: string
  artStyle: typeof ArtStyle[keyof typeof ArtStyle]
  maxTokens?: number
  temperature?: number
}

interface PromptResponse {
  prompt: string
  metadata: {
    style: string
    headline: string
    timestamp: string
    model: string
    style_notes: string[]
    composition: string
    lighting: string
    color_palette: string
    negative_prompt?: string
  }
}

export class PromptService {
  async generatePrompt(config: PromptGenerationConfig): Promise<PromptResponse> {
    try {
      devLog('Generating prompt', {
        prefix: 'prompt-service',
        level: 'debug'
      }, {
        data: {
          headline: config.headline,
          style: config.artStyle
        }
      })

      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          headline: config.headline,
          artStyle: config.artStyle
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate prompt')
      }

      const data = await response.json()

      devLog('Prompt generated successfully', {
        prefix: 'prompt-service',
        level: 'debug'
      }, {
        data: {
          prompt: data.prompt,
          style_notes: data.metadata.style_notes
        }
      })

      return data

    } catch (error) {
      devLog('Prompt generation failed', {
        prefix: 'prompt-service',
        level: 'error'
      }, { error })
      throw error
    }
  }
}

// Create a singleton instance
export const promptService = new PromptService() 
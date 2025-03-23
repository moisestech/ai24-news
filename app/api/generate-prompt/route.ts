import { NextResponse } from 'next/server'
import { devLog } from '@/lib/utils/log'
import { ArtStyle } from '@/types/art'
import { z } from 'zod'
import Together from 'together-ai'

// Define the schema for the prompt response
const PromptSchema = z.object({
  prompt: z.string().describe("The detailed artistic prompt for image generation"),
  style_notes: z.array(z.string()).describe("Key style characteristics to incorporate"),
  composition: z.string().describe("Composition guidelines"),
  lighting: z.string().describe("Lighting instructions"),
  color_palette: z.string().describe("Color palette description"),
  negative_prompt: z.string().optional().describe("Elements to avoid in the generation")
})

const PROMPT_TEMPLATE = `You are an expert art director and prompt engineer. Create a detailed, artistic prompt for generating an image that captures the essence of this news headline in the style of the specified artist.

Headline: {headline}
Artist Style: {artStyle}

Guidelines:
1. Focus on visual elements and composition
2. Include specific artistic techniques and characteristics of the artist
3. Maintain journalistic integrity while adding artistic flair
4. Keep the prompt concise but detailed
5. Use descriptive language that evokes the artist's style

Generate a prompt that will create a powerful, visually striking image that combines news with artistic expression.`

interface TogetherError extends Error {
  status?: number
  headers?: Record<string, string>
  response?: {
    data?: any
  }
}

async function generatePromptWithRetry(
  together: Together,
  promptTemplate: string,
  headline: string,
  artStyle: string,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<any> {
  let lastError: TogetherError | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      devLog(`Attempting prompt generation (attempt ${attempt}/${maxRetries})`, {
        prefix: 'generate-prompt',
        level: 'debug'
      })

      const prompt = promptTemplate
        .replace('{headline}', headline)
        .replace('{artStyle}', artStyle)

      const response = await together.chat.completions.create({
        model: "mistralai/Mistral-7B-Instruct-v0.2",
        messages: [
          {
            role: 'system',
            content: `You are an expert art director and prompt engineer specializing in creating detailed, artistic prompts for AI image generation. You MUST respond with a valid JSON object that EXACTLY matches this structure:

{
  "prompt": "string - The detailed artistic prompt for image generation",
  "style_notes": ["string", "string", ...] - Array of key style characteristics",
  "composition": "string - Composition guidelines",
  "lighting": "string - Lighting instructions",
  "color_palette": "string - Color palette description",
  "negative_prompt": "string - Elements to avoid in the generation (optional)"
}

Do not include any additional fields or text outside the JSON object.`
          },
          {
            role: 'user',
            content: prompt
          }
        ] as const,
        max_tokens: 500,
        temperature: 0.7
      })

      if (!response.choices?.[0]?.message?.content) {
        throw new Error('No response content received from Together AI')
      }

      // Try to parse the response to validate it's valid JSON
      try {
        const parsedContent = JSON.parse(response.choices[0].message.content)
        // Validate against our schema
        PromptSchema.parse(parsedContent)
        return response
      } catch (parseError) {
        devLog('Invalid JSON response from Together AI', {
          prefix: 'generate-prompt',
          level: 'error'
        }, {
          content: response.choices[0].message.content,
          error: parseError
        })
        throw new Error('Invalid JSON response from Together AI')
      }

    } catch (error) {
      lastError = error as TogetherError
      
      // Log the error details for debugging
      devLog('Together AI API error', {
        prefix: 'generate-prompt',
        level: 'error'
      }, {
        error,
        attempt,
        maxRetries,
        errorType: error?.constructor?.name,
        errorStatus: lastError.status,
        errorHeaders: lastError.headers,
        errorMessage: lastError.message,
        errorResponse: lastError.response?.data
      })

      // Check if we should retry based on the error
      const shouldRetry = lastError.status === 500 || 
                         lastError.status === 429 || 
                         lastError.headers?.['retry-after']
      
      if (!shouldRetry || attempt === maxRetries) {
        break
      }

      // Calculate delay with exponential backoff
      const delay = initialDelay * Math.pow(2, attempt - 1)
      const retryAfter = lastError.headers?.['retry-after']
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delay

      devLog(`Retrying after ${waitTime}ms (attempt ${attempt}/${maxRetries})`, {
        prefix: 'generate-prompt',
        level: 'info'
      })

      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  throw lastError
}

export async function POST(request: Request) {
  try {
    let body;
    const contentType = request.headers.get('content-type');
    
    devLog('Received request', {
      prefix: 'generate-prompt',
      level: 'debug'
    }, {
      headers: Object.fromEntries(request.headers.entries()),
      contentType
    });
    
    if (contentType?.includes('application/json')) {
      body = await request.json();
    } else {
      // If not JSON, try to parse the raw text
      const text = await request.text();
      devLog('Received raw text', {
        prefix: 'generate-prompt',
        level: 'debug'
      }, { text });
      
      try {
        body = JSON.parse(text);
      } catch (e) {
        devLog('Failed to parse request body', {
          prefix: 'generate-prompt',
          level: 'error'
        }, { error: e, text });
        
        return NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        );
      }
    }

    devLog('Parsed request body', {
      prefix: 'generate-prompt',
      level: 'debug'
    }, { body });

    const { headline, artStyle } = body;

    if (!headline || !artStyle) {
      devLog('Missing required fields', {
        prefix: 'generate-prompt',
        level: 'error'
      }, {
        receivedBody: body,
        hasHeadline: !!headline,
        hasArtStyle: !!artStyle,
        headline,
        artStyle
      });
      
      return NextResponse.json(
        { 
          error: 'Missing required fields: headline and artStyle',
          received: {
            hasHeadline: !!headline,
            hasArtStyle: !!artStyle,
            body
          }
        },
        { status: 400 }
      );
    }

    if (!process.env.TOGETHER_API_KEY) {
      devLog('Together API key not configured', {
        prefix: 'generate-prompt',
        level: 'error'
      });
      return NextResponse.json(
        { error: 'Together API key not configured' },
        { status: 500 }
      );
    }

    const together = new Together({
      apiKey: process.env.TOGETHER_API_KEY,
      baseURL: 'https://api.together.xyz/v1'
    });

    const response = await generatePromptWithRetry(together, PROMPT_TEMPLATE, headline, artStyle);
    const content = response.choices[0].message.content;
    
    // Parse and validate the JSON response
    const parsedContent = JSON.parse(content);
    const validatedContent = PromptSchema.parse(parsedContent);

    devLog('Prompt generated successfully', {
      prefix: 'generate-prompt',
      level: 'debug'
    }, {
      data: {
        prompt: validatedContent.prompt,
        style_notes: validatedContent.style_notes
      }
    });

    return NextResponse.json({
      prompt: validatedContent.prompt,
      metadata: {
        artStyle,
        headline,
        timestamp: new Date().toISOString(),
        model: 'mistralai/Mistral-7B-Instruct-v0.2',
        style_notes: validatedContent.style_notes,
        composition: validatedContent.composition,
        lighting: validatedContent.lighting,
        color_palette: validatedContent.color_palette,
        negative_prompt: validatedContent.negative_prompt
      }
    });

  } catch (error) {
    devLog('Prompt generation failed', {
      prefix: 'generate-prompt',
      level: 'error'
    }, { error });
    
    // Return more detailed error information
    return NextResponse.json(
      { 
        error: 'Failed to generate prompt',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : typeof error,
        status: (error as any)?.status,
        headers: (error as any)?.headers,
        response: (error as any)?.response?.data
      },
      { status: 500 }
    );
  }
} 
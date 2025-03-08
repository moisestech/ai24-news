import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { headline, style } = await request.json()
    
    // Create a safe filename from headline
    const safeHeadline = headline
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50) // Limit length

    // Create image name with all components
    const imageName = `ai24live_${safeHeadline}_${style.name.toLowerCase()}_${Date.now()}`
    
    // Combine headline with style prompt
    const prompt = `${headline} ${style.prompt}`
    
    const response = await fetch('https://api.together.xyz/inference', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'stabilityai/stable-diffusion-xl-base-1.0',
        prompt,
        // Add filename to metadata
        metadata: {
          filename: imageName
        }
      })
    })

    if (!response.ok) throw new Error('Failed to generate image')
    
    const data = await response.json()

    // Store with the new image name
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.from('image_generations').insert({
      prompt,
      style_name: style.name,
      style_id: style.id,
      image_url: data.output.image,
      image_name: imageName
    })

    return Response.json({ 
      imageUrl: data.output.image,
      style: style.name,
      imageName
    })
  } catch (err) {
    console.error('Image generation failed:', err)
    return Response.json({ error: 'Failed to generate image' }, { status: 500 })
  }
} 
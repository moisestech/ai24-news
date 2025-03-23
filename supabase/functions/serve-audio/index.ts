import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { audioUrl } = await req.json()
    
    if (!audioUrl) {
      return new Response(
        JSON.stringify({ error: 'Audio URL is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Fetch the audio file
    const response = await fetch(audioUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.statusText}`)
    }

    // Get the audio data and headers
    const audioData = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'audio/mpeg'
    const contentLength = response.headers.get('content-length')
    const acceptRanges = response.headers.get('accept-ranges')

    // Create response with CORS headers
    return new Response(audioData, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Length': contentLength || '',
        'Accept-Ranges': acceptRanges || 'bytes'
      }
    })

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
}) 
import { NextRequest, NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range, accept-ranges',
  'Access-Control-Expose-Headers': 'content-length, content-range, accept-ranges, content-type',
  'Access-Control-Max-Age': '3600'
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  
  if (!url) {
    return new NextResponse('Missing URL parameter', { 
      status: 400,
      headers: corsHeaders
    })
  }

  try {
    // Forward the range header if present
    const range = request.headers.get('range')
    const headers: Record<string, string> = {
      'Accept': request.headers.get('accept') || '*/*'
    }
    
    if (range) {
      headers['Range'] = range
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.statusText}`)
    }

    // Get the response headers
    const contentType = response.headers.get('content-type') || 'audio/mpeg'
    const contentLength = response.headers.get('content-length')
    const contentRange = response.headers.get('content-range')
    const acceptRanges = response.headers.get('accept-ranges')

    // If it's a range request, return the partial content
    if (range) {
      const audioBuffer = await response.arrayBuffer()
      return new NextResponse(audioBuffer, {
        status: 206,
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Content-Length': contentLength || audioBuffer.byteLength.toString(),
          'Content-Range': contentRange || '',
          'Accept-Ranges': acceptRanges || 'bytes'
        }
      })
    }

    // For full file requests
    const audioBuffer = await response.arrayBuffer()
    return new NextResponse(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Length': contentLength || audioBuffer.byteLength.toString(),
        'Accept-Ranges': acceptRanges || 'bytes'
      }
    })
  } catch (error) {
    console.error('Error serving audio:', error)
    return new NextResponse('Failed to serve audio', { 
      status: 500,
      headers: corsHeaders
    })
  }
} 
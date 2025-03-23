import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  
  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 })
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/serve-audio?url=${encodeURIComponent(url)}`, {
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.statusText}`)
    }

    const audioBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'audio/mpeg'

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range',
        'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Content-Type'
      }
    })
  } catch (error) {
    console.error('Error serving audio:', error)
    return new NextResponse('Failed to serve audio', { status: 500 })
  }
} 
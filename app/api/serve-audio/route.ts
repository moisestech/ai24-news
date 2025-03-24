import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  
  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 })
  }

  try {
    // Directly fetch the audio file
    const response = await fetch(url, {
      headers: {
        'Range': request.headers.get('range') || 'bytes=0-'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.statusText}`)
    }

    const audioBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'audio/mpeg'
    const contentLength = response.headers.get('content-length')
    const contentRange = response.headers.get('content-range')

    const headers = {
      'Content-Type': contentType,
      'Content-Length': contentLength || audioBuffer.byteLength.toString(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range',
      'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Content-Type'
    }

    // Add Content-Range header if it exists in the response
    if (contentRange) {
      headers['Content-Range'] = contentRange
    }

    return new NextResponse(audioBuffer, { headers })
  } catch (error) {
    console.error('Error serving audio:', error)
    return new NextResponse('Failed to serve audio', { status: 500 })
  }
} 
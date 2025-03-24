import { NextResponse } from 'next/server'
import { devLog } from '@/lib/utils/log'
import { uploadImageToStorage } from '@/lib/actions/storage'

export async function POST(request: Request) {
  try {
    const { imageData, headline, newsId } = await request.json()

    devLog('Starting image upload', {
      prefix: 'api:upload-image',
      level: 'debug'
    }, {
      data: {
        headline,
        hasImageData: !!imageData,
        imageDataLength: imageData?.length,
        imageDataPreview: imageData?.substring(0, 50) + '...',
        newsId,
        timestamp: new Date().toISOString()
      }
    })

    if (!imageData) {
      devLog('No image data provided', {
        prefix: 'api:upload-image',
        level: 'error'
      }, {
        data: {
          headline,
          newsId,
          timestamp: new Date().toISOString()
        }
      })
      throw new Error('No image data provided')
    }

    if (!headline) {
      devLog('No headline provided', {
        prefix: 'api:upload-image',
        level: 'error'
      }, {
        data: {
          hasImageData: !!imageData,
          imageDataLength: imageData?.length,
          newsId,
          timestamp: new Date().toISOString()
        }
      })
      throw new Error('No headline provided')
    }

    devLog('Calling uploadImageToStorage', {
      prefix: 'api:upload-image',
      level: 'debug'
    }, {
      data: {
        headline,
        imageDataLength: imageData.length,
        newsId,
        timestamp: new Date().toISOString()
      }
    })

    const imageUrl = await uploadImageToStorage(
      imageData,
      headline,
      {
        newsId,
        bucket: 'news-images'
      }
    )

    devLog('Image upload complete', {
      prefix: 'api:upload-image',
      level: 'debug'
    }, {
      data: {
        newsId,
        imageUrl,
        timestamp: new Date().toISOString()
      }
    })

    if (!imageUrl) {
      devLog('No image URL returned from uploadImageToStorage', {
        prefix: 'api:upload-image',
        level: 'error'
      }, {
        data: {
          newsId,
          timestamp: new Date().toISOString()
        }
      })
      throw new Error('Failed to get image URL')
    }

    return NextResponse.json({ imageUrl })

  } catch (error) {
    devLog('Image upload failed', {
      prefix: 'api:upload-image',
      level: 'error'
    }, {
      error,
      data: {
        timestamp: new Date().toISOString()
      }
    })

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload image' },
      { status: 500 }
    )
  }
} 
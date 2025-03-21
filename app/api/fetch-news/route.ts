import { devLog } from '@/lib/utils/log'
import { fetchLatestNews } from '@/lib/news'

export async function GET() {
  try {
    devLog('Starting news fetch from API', {
      prefix: 'api:fetch-news',
      level: 'info',
      timestamp: true
    })

    devLog({
      env: {
        MEDIASTACK_API_KEY: process.env.MEDIASTACK_API_KEY ? 'Set' : 'Not set',
        NODE_ENV: process.env.NODE_ENV,
      }
    }, {
      prefix: 'api:fetch-news',
      level: 'debug'
    })

    const news = await fetchLatestNews()

    devLog('News fetch successful', {
      prefix: 'api:fetch-news',
      level: 'info',
      timestamp: true
    })

    devLog({ news }, {
      prefix: 'api:fetch-news',
      level: 'debug'
    })

    return Response.json(news)
  } catch (error) {
    devLog('News fetch failed', {
      prefix: 'api:fetch-news',
      level: 'error',
      timestamp: true
    })

    devLog({
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      env: {
        MEDIASTACK_API_KEY: process.env.MEDIASTACK_API_KEY ? 'Set' : 'Not set',
        NODE_ENV: process.env.NODE_ENV,
      }
    }, {
      prefix: 'api:fetch-news',
      level: 'error'
    })

    return Response.json(
      {
        error: 'Failed to fetch news',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 
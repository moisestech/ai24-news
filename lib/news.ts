import { devLog } from '@/lib/utils/log'
import type { NewsResponse, NewsAPIResponse } from '@/types/news'

interface MediastackResponse {
  data: Array<{
    title: string
    source: string
    url: string
    published_at: string
  }>
}

export async function fetchLatestNews(): Promise<NewsResponse> {
  const source = 'mediastack'
  
  try {
    devLog('Fetching news from Mediastack', {
      prefix: 'news-service',
      level: 'info'
    })

    // Build URL with query parameters
    const baseUrl = 'http://api.mediastack.com/v1/news'
    const params = new URLSearchParams({
      access_key: process.env.MEDIASTACK_API_KEY || '',
      categories: 'general',
      languages: 'en',
      limit: '1',
      sort: 'published_desc'
    })

    const url = `${baseUrl}?${params.toString()}`

    // Log request details (safely)
    devLog({
      url: baseUrl,
      params: {
        categories: 'general',
        languages: 'en',
        limit: '1',
        sort: 'published_desc',
        access_key: '[REDACTED]'
      }
    }, {
      prefix: 'news-service',
      level: 'debug'
    })

    const response = await fetch(url)

    // Log response details
    devLog({
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    }, {
      prefix: 'news-service',
      level: 'debug'
    })

    if (!response.ok) {
      devLog('Mediastack API error response', {
        prefix: 'news-service',
        level: 'error'
      })

      devLog({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      }, {
        prefix: 'news-service',
        level: 'error'
      })

      throw new Error(`Failed to fetch from ${source}: ${response.statusText}`)
    }

    const data = await response.json() as MediastackResponse
    
    // Log response data shape
    devLog({
      hasData: !!data.data,
      articleCount: data.data?.length || 0,
      responseShape: Object.keys(data)
    }, {
      prefix: 'news-service',
      level: 'debug'
    })

    if (!data.data?.[0]) {
      throw new Error('No news articles found')
    }

    const article = data.data[0]

    return {
      headline: article.title,
      source: article.source,
      url: article.url
    }

  } catch (error) {
    devLog(`Error fetching news from ${source}`, {
      prefix: 'news-service',
      level: 'error'
    })

    devLog({
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, {
      prefix: 'news-service',
      level: 'error'
    })

    throw error
  }
}

export async function fetchNewsBySource(source: string): Promise<NewsResponse> {
  try {
    const response = await fetch(`http://api.mediastack.com/v1/news?sources=${source}`, {
      headers: {
        'access_key': process.env.MEDIASTACK_API_KEY || '',
      },
      next: { revalidate: 300 }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch from Mediastack')
    }

    const data = await response.json() as MediastackResponse

    if (!data.data || !data.data.length) {
      throw new Error(`No news articles found for ${source}`)
    }

    const article = data.data[0]

    return {
      headline: article.title,
      source: article.source,
      url: article.url
    }
  } catch (error) {
    console.error(`Error fetching news from ${source}:`, error)
    throw error
  }
} 
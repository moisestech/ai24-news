import { devLog } from '@/lib/utils/log'
import type { NewsSource, NewsSourceFilter, NewsSourceResponse } from '@/types/news'
import { NEWS_API_CONFIG } from '@/lib/config/news-sources'
import { DEFAULT_SOURCES } from '@/lib/config/news-sources'

interface NewsServiceConfig {
  apiKey: string
  isSubscribed?: boolean
}

export class NewsService {
  private apiKey: string
  private isSubscribed: boolean

  constructor(config: NewsServiceConfig) {
    this.apiKey = config.apiKey
    this.isSubscribed = config.isSubscribed || false
  }

  private async fetchSources(filter: NewsSourceFilter = {}): Promise<NewsSourceResponse> {
    const params = new URLSearchParams({
      access_key: this.apiKey,
      ...filter
    })

    const response = await fetch(`${NEWS_API_CONFIG.baseUrl}/sources?${params}`)
    if (!response.ok) {
      throw new Error('Failed to fetch news sources')
    }

    return response.json()
  }

  private async fetchNews(filter: NewsSourceFilter = {}): Promise<any> {
    const params = new URLSearchParams({
      access_key: this.apiKey,
      languages: NEWS_API_CONFIG.defaultLanguage,
      countries: NEWS_API_CONFIG.defaultCountries.join(','),
      categories: NEWS_API_CONFIG.defaultCategories.join(','),
      ...filter
    })

    const response = await fetch(`${NEWS_API_CONFIG.baseUrl}/news?${params}`)
    if (!response.ok) {
      throw new Error('Failed to fetch news')
    }

    return response.json()
  }

  async getAvailableSources(): Promise<NewsSource[]> {
    try {
      const response = await this.fetchSources()
      return response.data
    } catch (error) {
      devLog('Failed to fetch available sources', {
        prefix: 'news-service',
        level: 'error'
      }, { error })
      return []
    }
  }

  async getNews(filter: NewsSourceFilter = {}): Promise<any> {
    try {
      // If user is not subscribed, only use free sources
      if (!this.isSubscribed) {
        filter.sources = DEFAULT_SOURCES.join(',')
      }

      devLog('Fetching news', {
        prefix: 'news-service',
        level: 'debug'
      }, {
        data: {
          filter,
          isSubscribed: this.isSubscribed
        }
      })

      const response = await this.fetchNews(filter)
      return response
    } catch (error) {
      devLog('Failed to fetch news', {
        prefix: 'news-service',
        level: 'error'
      }, { error })
      throw error
    }
  }

  async searchNews(query: string, filter: NewsSourceFilter = {}): Promise<any> {
    try {
      const searchFilter = {
        ...filter,
        keywords: query
      }

      return await this.getNews(searchFilter)
    } catch (error) {
      devLog('Failed to search news', {
        prefix: 'news-service',
        level: 'error'
      }, { error })
      throw error
    }
  }

  async getNewsByCategory(category: string, filter: NewsSourceFilter = {}): Promise<any> {
    try {
      const categoryFilter = {
        ...filter,
        categories: category
      }

      return await this.getNews(categoryFilter)
    } catch (error) {
      devLog('Failed to fetch news by category', {
        prefix: 'news-service',
        level: 'error'
      }, { error })
      throw error
    }
  }
}

// Create a singleton instance
export const newsService = new NewsService({
  apiKey: process.env.NEXT_PUBLIC_MEDIASTACK_API_KEY || '',
  isSubscribed: false // This should be updated based on user's subscription status
}) 
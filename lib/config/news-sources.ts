import type { NewsSource, NewsCategory, NewsCountry, NewsLanguage } from '@/types/news'

// Premium news sources (available to subscribed users)
export const PREMIUM_SOURCES: NewsSource[] = [
  {
    id: 'cnn',
    name: 'CNN',
    category: 'general',
    country: 'us',
    language: 'en',
    url: 'https://www.cnn.com',
    isPremium: true,
    isActive: true
  },
  {
    id: 'bbc',
    name: 'BBC News',
    category: 'general',
    country: 'gb',
    language: 'en',
    url: 'https://www.bbc.com/news',
    isPremium: true,
    isActive: true
  },
  {
    id: 'reuters',
    name: 'Reuters',
    category: 'general',
    country: 'gb',
    language: 'en',
    url: 'https://www.reuters.com',
    isPremium: true,
    isActive: true
  },
  {
    id: 'ap',
    name: 'Associated Press',
    category: 'general',
    country: 'us',
    language: 'en',
    url: 'https://apnews.com',
    isPremium: true,
    isActive: true
  }
]

// Free news sources (available to all users)
export const FREE_SOURCES: NewsSource[] = [
  {
    id: 'abc-news',
    name: 'ABC News',
    category: 'general',
    country: 'us',
    language: 'en',
    url: 'https://abcnews.go.com',
    isActive: true
  },
  {
    id: 'cbs-news',
    name: 'CBS News',
    category: 'general',
    country: 'us',
    language: 'en',
    url: 'https://www.cbsnews.com',
    isActive: true
  },
  {
    id: 'nbc-news',
    name: 'NBC News',
    category: 'general',
    country: 'us',
    language: 'en',
    url: 'https://www.nbcnews.com',
    isActive: true
  },
  {
    id: 'fox-news',
    name: 'Fox News',
    category: 'general',
    country: 'us',
    language: 'en',
    url: 'https://www.foxnews.com',
    isActive: true
  }
]

// All available news sources
export const ALL_SOURCES: NewsSource[] = [...PREMIUM_SOURCES, ...FREE_SOURCES]

// Default sources for anonymous users
export const DEFAULT_SOURCES = FREE_SOURCES.map(source => source.id)

// Helper functions
export function getSourceById(id: string): NewsSource | undefined {
  return ALL_SOURCES.find(source => source.id === id)
}

export function getSourcesByCategory(category: NewsCategory): NewsSource[] {
  return ALL_SOURCES.filter(source => source.category === category)
}

export function getSourcesByCountry(country: NewsCountry): NewsSource[] {
  return ALL_SOURCES.filter(source => source.country === country)
}

export function getSourcesByLanguage(language: NewsLanguage): NewsSource[] {
  return ALL_SOURCES.filter(source => source.language === language)
}

export function getPremiumSources(): NewsSource[] {
  return ALL_SOURCES.filter(source => source.isPremium)
}

export function getFreeSources(): NewsSource[] {
  return ALL_SOURCES.filter(source => !source.isPremium)
}

export function getActiveSources(): NewsSource[] {
  return ALL_SOURCES.filter(source => source.isActive)
}

// API configuration
export const NEWS_API_CONFIG = {
  baseUrl: 'https://api.mediastack.com/v1',
  defaultLimit: 25,
  maxLimit: 100,
  defaultLanguage: 'en' as NewsLanguage,
  defaultCountries: ['us', 'gb'] as NewsCountry[],
  defaultCategories: ['general'] as NewsCategory[]
} 
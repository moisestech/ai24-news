import { useState, useEffect, useMemo } from 'react'
import { devLog } from '@/lib/utils/log'
import type { NewsItem, NewsSource } from '@/types/news'
import type { NewsHistoryItem } from '@/lib/atoms'
import type { ArtStyleKey } from '@/types/art'
import { normalizeAudioAlignment } from '@/lib/audio/alignment'

interface UseNewsItemProps {
  initialData: NewsHistoryItem | null
  onUpdate?: (news: NewsItem) => void
}

export function useNewsItem({ initialData, onUpdate }: UseNewsItemProps) {
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null)

  // Log the initial data when it changes
  useEffect(() => {
    devLog('useNewsItem: Initial data received', {
      prefix: 'use-news-item',
      level: 'debug'
    }, {
      data: {
        hasInitialData: !!initialData,
        initialData,
        imageUrl: initialData?.image_url,
        source_name: initialData?.source_name,
        url: initialData?.url
      }
    })
  }, [initialData])

  // Memoize the transformation to prevent unnecessary recalculations
  const transformedData = useMemo(() => {
    if (!initialData) return null

    devLog('useNewsItem: Starting transformation', {
      prefix: 'use-news-item',
      level: 'debug'
    }, {
      data: {
        initialData,
        imageUrl: initialData.image_url,
        source_name: initialData.source_name,
        url: initialData.url
      }
    })

    const transformed: NewsItem = {
      id: initialData.id,
      headline: initialData.headline,
      source_name: initialData.source_name,
      source_url: initialData.url,
      url: initialData.url,
      published_at: initialData.created_at,
      image: {
        url: initialData.image_url,
        isGenerating: false,
        isPending: false,
        error: null
      },
      audio_url: initialData.audio_url,
      audio_alignment: normalizeAudioAlignment(initialData.audio_alignment),
      art_style: (initialData.art_style || 'VanGogh') as ArtStyleKey,
      prompt: initialData.prompt,
      source: {
        id: initialData.source_name,
        name: initialData.source_name,
        url: initialData.url,
        type: 'api'
      }
    }

    devLog('useNewsItem: Transformation complete', {
      prefix: 'use-news-item',
      level: 'debug'
    }, {
      data: {
        transformed,
        hasImage: !!transformed.image.url,
        imageUrl: transformed.image.url,
        source: transformed.source,
        url: transformed.url,
        hasAudioAlignment: !!transformed.audio_alignment,
        audioAlignment: transformed.audio_alignment ? {
          charactersLength: transformed.audio_alignment.characters.length,
          startTimesLength: transformed.audio_alignment.character_start_times_seconds.length,
          endTimesLength: transformed.audio_alignment.character_end_times_seconds.length,
          sampleCharacters: transformed.audio_alignment.characters.slice(0, 5),
          sampleStartTimes: transformed.audio_alignment.character_start_times_seconds.slice(0, 5),
          sampleEndTimes: transformed.audio_alignment.character_end_times_seconds.slice(0, 5)
        } : null
      }
    })

    return transformed
  }, [initialData])

  // Only update state and call onUpdate when transformedData changes
  useEffect(() => {
    if (transformedData !== newsItem) {
      devLog('useNewsItem: Updating state', {
        prefix: 'use-news-item',
        level: 'debug'
      }, {
        data: {
          previousItem: newsItem,
          newItem: transformedData,
          hasImage: !!transformedData?.image.url,
          imageUrl: transformedData?.image.url
        }
      })

      setNewsItem(transformedData)
      if (transformedData && onUpdate) {
        onUpdate(transformedData)
      }
    }
  }, [transformedData, newsItem, onUpdate])

  return newsItem
} 
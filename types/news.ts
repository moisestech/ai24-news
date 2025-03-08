export interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  image_url?: string;
  art_style?: string;
  created_at: string;
}

export interface DBError {
  code: string;
  message: string;
  details?: string;
}

export interface NewsData {
  headline: string
  source: string
  url: string
  artStyle?: string
  imageUrl?: string
}

export function convertToNewsData(item: NewsItem): NewsData {
  return {
    headline: item.title,
    source: item.source,
    url: item.url,
    artStyle: item.art_style,
    imageUrl: item.image_url
  }
} 
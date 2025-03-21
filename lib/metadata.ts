import { Metadata } from 'next'
import { siteConfig } from './config/metadata'

interface SEOProps {
  title: string
  description: string
  imageUrl?: string
  type?: 'website' | 'article'
}

export function generateSEO({
  title,
  description,
  imageUrl,
  type = 'website'
}: SEOProps): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: siteConfig.url,
      siteName: siteConfig.name,
      images: imageUrl ? [imageUrl] : undefined,
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  }
} 
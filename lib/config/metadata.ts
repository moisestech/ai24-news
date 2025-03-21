import { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai24.live'

export const siteConfig = {
  name: 'AI24 Live',
  description: 'Experience news through AI-generated visualizations',
  url: siteUrl,
  keywords: ['AI news', 'news visualization', 'AI art', 'news images', 'AI journalism'] as string[],
  authors: [{ name: 'AI24 Live Team' }] as Array<{ name: string }>,
  creator: 'AI24 Live',
  publisher: 'AI24 Live'
} as const

export const baseMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteConfig.name} - AI News Visualization`,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [...siteConfig.authors],
  creator: siteConfig.creator,
  publisher: siteConfig.publisher,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png' }
    ]
  }
} 
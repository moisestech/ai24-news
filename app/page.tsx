import { Metadata } from 'next'
import { generateSEO } from '@/lib/metadata'
import { HomePage } from '@/components/HomePage'

export async function generateMetadata(): Promise<Metadata> {
  return generateSEO({
    title: 'AI24 Live News - AI-Generated News Visualizations',
    description: 'Experience news stories brought to life through AI-generated visualizations. Get real-time news updates with unique artistic interpretations.',
    type: 'website'
  })
}

export default function Page() {
  return <HomePage />
}

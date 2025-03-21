import { Metadata } from 'next'
import { generateSEO } from '@/lib/metadata'
import { DynamicNewsWrapper } from '@/components/DynamicNewsWrapper'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export async function generateMetadata(): Promise<Metadata> {
  return generateSEO({
    title: 'AI24 Live News - AI-Generated News Visualizations',
    description: 'Experience news stories brought to life through AI-generated visualizations. Get real-time news updates with unique artistic interpretations.',
    type: 'website'
  })
}

export default function HomePage() {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-screen">
      <header className="p-4 sm:p-6 border-b">
        <h1 className="text-2xl font-bold font-fk-raster">AI24 Live News</h1>
      </header>
      
      <main className="p-4 sm:p-6 md:p-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <ErrorBoundary>
            <DynamicNewsWrapper />
          </ErrorBoundary>
        </div>
      </main>

      <footer className="p-4 sm:p-6 border-t">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} AI24 Live. All rights reserved.
        </p>
      </footer>
    </div>
  )
}

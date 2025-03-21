import type { Metadata } from 'next'
import { Inter as FontSans } from 'next/font/google'
import '../styles/globals.css'
import { cn } from '@/lib/utils'
import { Toaster } from '@/components/ui/Toaster'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'AI24 News',
  description: 'News generator powered by AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        fontSans.variable
      )}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}

// public/fonts/FKRasterGrotesk-Blended.woff
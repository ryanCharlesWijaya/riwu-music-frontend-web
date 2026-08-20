import type { Metadata } from 'next'
import { Syne, Figtree } from 'next/font/google'
import './globals.css'

const display = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700', '800'],
})

const body = Figtree({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'riwu-music — Stream Player & Admin',
  description:
    'Modular music streaming platform with YouTube, Google Drive, and local media sources. Web player and administrative control center.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}

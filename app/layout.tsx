import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'MARV App',
  description: 'Created with MARV',
  generator: 'MARV.app',
  icons: {
    icon: [
      {
        url: '/packmaker/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/packmaker/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/packmaker/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/packmaker/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

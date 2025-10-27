import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from './context/AuthContext'
import { SessionProvider } from './context/SessionContext'
import { TradeProvider } from './context/TradeContext'
import { ToastProvider } from './components/Toast'
import { ThemeProvider } from './context/ThemeContext'
import { AppWrapper } from './components/AppWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BBT Trades - Trading Performance Tracker',
  description: 'Professional crypto trading performance tracker and calculator',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', type: 'image/png' }
    ],
    shortcut: '/favicon.svg',
    apple: '/icon.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <SessionProvider>
              <TradeProvider>
                <ToastProvider>
                  <AppWrapper>
                    {children}
                  </AppWrapper>
                </ToastProvider>
              </TradeProvider>
            </SessionProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
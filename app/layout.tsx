import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from './context/AuthContext'
import { SessionProvider } from './context/SessionContext'
import { TradeProvider } from './context/TradeContext'
import { ToastProvider } from './components/Toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BBT Trades - Trading Performance Tracker',
  description: 'Professional crypto trading performance tracker and calculator',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <SessionProvider>
            <TradeProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </TradeProvider>
          </SessionProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
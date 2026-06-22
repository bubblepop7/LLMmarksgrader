import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Answer Sheet Evaluator',
  description: 'Automated evaluation of handwritten student answer sheets',
}

import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-surface-50 min-h-screen text-surface-900 font-sans antialiased flex">
        <Sidebar />
        <div className="flex-1 ml-64 flex flex-col min-h-screen">
          <TopBar />
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

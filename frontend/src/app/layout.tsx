import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Answer Sheet Evaluator',
  description: 'Automated evaluation of handwritten student answer sheets',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen text-slate-900 font-sans antialiased">
        {children}
      </body>
    </html>
  )
}

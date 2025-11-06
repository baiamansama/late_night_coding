import type { Metadata } from 'next'
import { Lexend, Open_Sans, Poppins } from 'next/font/google'
import './globals.css'

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
  display: 'swap',
})

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  display: 'swap',
})

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Kids Reading App',
  description: 'A fun reading recognition app for kids aged 11-13',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${lexend.variable} ${openSans.variable} ${poppins.variable}`}>
      <body className="bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen font-sans">
        {children}
      </body>
    </html>
  )
}

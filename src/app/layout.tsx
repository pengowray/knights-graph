import type { Metadata } from 'next'
//import '@/styles/globals.css'

export const metadata: Metadata = {
  title: "Knight's Graph",
  description: 'Visualization of possible knight moves on a chess board',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-background">{children}</body>
    </html>
  )
}
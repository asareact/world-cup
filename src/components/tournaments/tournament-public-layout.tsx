"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export interface TournamentAnchorLink {
  href: string
  label: string
}

export function TournamentPublicLayout({
  children,
  anchors = [],
}: {
  children: React.ReactNode
  anchors?: TournamentAnchorLink[]
}) {
  const pathname = usePathname()
  const tournamentId = pathname.split('/')[2] // Extract tournament ID from path

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="sticky top-0 z-50 border-b border-gray-900/80 bg-gray-950/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 text-white font-semibold">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-green-600 text-lg font-bold">FT</span>
              <span className="hidden sm:block text-sm uppercase tracking-widest text-gray-300">FutsalPro</span>
            </Link>
          </div>
          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 text-sm font-medium text-gray-300 md:flex">
            {Array.isArray(anchors) && anchors.map(anchor => (
              <a 
                key={anchor.href} 
                href={anchor.href} 
                className="transition-colors hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-900"
              >
                {anchor.label}
              </a>
            ))}
          </nav>
          <Link
            href="/"
            className="inline-flex items-center rounded-lg border border-gray-800 px-2.5 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-gray-700 hover:text-white"
          >
            Inicio
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  )
}

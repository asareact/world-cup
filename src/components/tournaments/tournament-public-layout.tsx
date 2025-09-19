"use client"

import Link from "next/link"

export interface TournamentAnchorLink {
  href: string
  label: string
}

export function TournamentPublicLayout({
  children,
  anchors,
}: {
  children: React.ReactNode
  anchors: TournamentAnchorLink[]
}) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="sticky top-0 z-50 border-b border-gray-900/80 bg-gray-950/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-white font-semibold">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-lg font-bold">FT</span>
              <span className="hidden sm:block text-sm uppercase tracking-widest text-gray-300">FutsalPro</span>
            </Link>
          </div>
          <nav className="hidden items-center gap-4 text-sm font-medium text-gray-300 md:flex">
            {anchors.map(anchor => (
              <a key={anchor.href} href={anchor.href} className="transition-colors hover:text-white">
                {anchor.label}
              </a>
            ))}
          </nav>
          <Link
            href="/"
            className="inline-flex items-center rounded-lg border border-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-gray-700 hover:text-white"
          >
            Ir al Inicio
          </Link>
        </div>
        <nav className="flex items-center justify-start gap-3 overflow-x-auto border-t border-gray-900/70 bg-gray-900/40 px-4 py-3 text-xs text-gray-400 md:hidden">
          {anchors.map(anchor => (
            <a key={anchor.href} href={anchor.href} className="rounded-full border border-gray-800 px-3 py-1 transition-colors hover:border-gray-600 hover:text-white">
              {anchor.label}
            </a>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  )
}

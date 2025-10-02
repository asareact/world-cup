// Context provider for potential suspensions
'use client'

import { createContext, useContext, ReactNode } from 'react'
import { usePotentialSuspensions } from '@/lib/hooks/use-potential-suspensions'

interface PotentialSuspensionsContextType {
  suspensions: ReturnType<typeof usePotentialSuspensions>
}

const PotentialSuspensionsContext = createContext<PotentialSuspensionsContextType | undefined>(undefined)

interface PotentialSuspensionsProviderProps {
  children: ReactNode
  tournamentId: string
  matchId?: string
  date?: Date
  allUpcoming?: boolean
}

export function PotentialSuspensionsProvider({
  children,
  tournamentId,
  matchId
}: PotentialSuspensionsProviderProps) {
  const suspensions = usePotentialSuspensions(tournamentId, {
    matchId
  })

  return (
    <PotentialSuspensionsContext.Provider value={{ suspensions }}>
      {children}
    </PotentialSuspensionsContext.Provider>
  )
}

export function usePotentialSuspensionsContext() {
  const context = useContext(PotentialSuspensionsContext)
  if (context === undefined) {
    throw new Error('usePotentialSuspensionsContext must be used within a PotentialSuspensionsProvider')
  }
  return context.suspensions
}
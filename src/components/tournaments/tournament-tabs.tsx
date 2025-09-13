'use client'

import { useState } from 'react'

const tabs = [
  { id: 'overview', label: 'Resumen' },
  { id: 'matches', label: 'Partidos' },
  { id: 'standings', label: 'Tabla' },
  { id: 'teams', label: 'Equipos' },
  { id: 'stats', label: 'Estadísticas' },
  { id: 'rules', label: 'Reglas' },
]

export function TournamentTabs({ active, onChange }: { active?: string, onChange: (id: string) => void }) {
  const [current, setCurrent] = useState(active || 'overview')
  const change = (id: string) => { setCurrent(id); onChange(id) }
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => change(t.id)}
          className={`px-4 py-2 rounded-xl border transition ${current === t.id ? 'bg-green-600 text-white border-green-600' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}


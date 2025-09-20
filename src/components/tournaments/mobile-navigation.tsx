'use client'

import { Trophy, Users, Calendar, Target, Award, Shuffle } from 'lucide-react'

interface MobileNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function MobileNavigation({ 
  activeSection,
  onSectionChange 
}: MobileNavigationProps) {
  const sections = [
    { id: 'overview', label: 'Inicio', icon: Trophy },
    { id: 'standings', label: 'Tabla', icon: Users },
    { id: 'groups', label: 'Grupos', icon: Calendar },
    { id: 'repechage', label: 'Repechaje', icon: Shuffle },
    { id: 'top-scorers', label: 'Goleadores', icon: Target },
    { id: 'ideal-5', label: 'Ideal 5', icon: Award },
  ]

  const handleSectionChange = (sectionId: string) => {
    // Update URL hash
    window.location.hash = sectionId
    // Call parent handler
    onSectionChange(sectionId)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-40 md:hidden">
      <div className="flex overflow-x-auto py-2 px-2 hide-scrollbar">
        {sections.map((section) => {
          const Icon = section.icon
          const isActive = activeSection === section.id
          
          return (
            <button
              key={section.id}
              onClick={() => handleSectionChange(section.id)}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg flex-shrink-0 min-w-[70px] transition-colors ${
                isActive
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{section.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
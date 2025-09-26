'use client';

import { useState } from 'react';
import { Calendar, Trophy, Users, Shuffle, Target, Award, BarChart3 } from 'lucide-react';

interface Anchor {
  href: string;
  label: string;
}

interface MobileNavigationProps {
  anchors: Anchor[];
  activeSection: string;
  onSectionChange: (href: string) => void;
}

export function MobileNavigation({ 
  anchors = [],
  activeSection,
  onSectionChange 
}: MobileNavigationProps) {
  // Map anchors to sections with icons
  const sections = Array.isArray(anchors) ? anchors.map(anchor => {
    // Extract section from href for active state comparison
    const section = anchor.href.includes('?section=') 
      ? anchor.href.split('?section=')[1] 
      : anchor.href.includes('/calendar') 
        ? 'calendar' 
        : ''
    
    // Determine icon based on label
    let Icon = Trophy
    if (anchor.label === 'Tabla') Icon = Users
    else if (anchor.label === 'Grupos') Icon = Calendar
    else if (anchor.label === 'Repechaje') Icon = Shuffle
    else if (anchor.label === 'Goleadores') Icon = Target
    else if (anchor.label === 'Ideal 5') Icon = Award
    else if (anchor.label === 'Estadísticas') Icon = BarChart3
    
    return {
      href: anchor.href,
      label: anchor.label,
      icon: Icon,
      section
    }
  }) : []

  const handleAnchorClick = (href: string, section: string) => {
    // Call parent handler with full href
    onSectionChange(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-40 md:hidden">
      <div className="flex overflow-x-auto py-2 px-2 hide-scrollbar">
        {Array.isArray(sections) && sections.map((section) => {
          const Icon = section.icon
          const isActive = activeSection === section.section
          
          return (
            <button
              key={section.href}
              onClick={() => handleAnchorClick(section.href, section.section)}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg flex-shrink-0 min-w-[70px] transition-colors ${
                isActive
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
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
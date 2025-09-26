'use client';

import { useState } from 'react';
import { ChevronDown, Trophy, FileText, Users, Calendar, Target } from 'lucide-react';

interface TournamentRulesSectionProps {
  rules: string; // The rules string from the tournament
}

interface RuleSection {
  id: string;
  title: string;
  content: string;
  icon: React.ComponentType<any>;
}

export function TournamentRulesSection({ rules }: TournamentRulesSectionProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'overview': true // Overview section expanded by default
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Parse the rules string and create sections
  // For now, I'll use a predefined list similar to the existing reglamento
  // but in a real implementation, we could parse the actual rules string
  const ruleSections: RuleSection[] = [
    {
      id: 'overview',
      title: 'Resumen del Torneo',
      content: `Este torneo de futsal se rige por las reglas estándar de fútbol sala.
                - Formato: Liga con posibilidad de fase eliminatoria
                - Duración: 50 minutos cronometrados (2x25)
                - Equipos: 5 jugadores en cancha (máximo 14 inscritos por equipo)`,
      icon: Trophy
    },
    {
      id: 'field',
      title: 'Campo de Juego',
      content: `Dimensiones: Longitud mínima 25m, máxima 42m. Anchura mínima 15m, máxima 25m.
                Porterías: 3m de ancho por 2m de alto.
                Área de penalti: marcada a 10 metros`,
      icon: FileText
    },
    {
      id: 'players',
      title: 'Jugadores y Equipación',
      content: `- Cada equipo: 5 jugadores en cancha (1 guardameta)
                - Sustituciones: Ilimitadas y en cualquier momento
                - Mínimo: 4 jugadores para iniciar un partido
                - El equipo estará compuesto por máximo 14 jugadores`,
      icon: Users
    },
    {
      id: 'duration',
      title: 'Duración del Partido',
      content: `- Tiempo total: 50 minutos cronometrados
                - Dos tiempos de 25 minutos cada uno
                - Descanso de 5 minutos entre tiempos
                - Tiempo se detiene solo en casos especiales`,
      icon: Calendar
    },
    {
      id: 'fouls',
      title: 'Faltas y Sanciones',
      content: `- A partir de la 5ta falta: penales desde 12 metros
                - Tarjeta Amarilla: conducta antideportiva
                - Tarjeta Roja: juego brusco, conducta violenta
                - Expulsión temporal: 2 minutos o hasta gol recibido`,
      icon: Target
    },
    {
      id: 'conduct',
      title: 'Conducta y Disciplina',
      content: `- Puntualidad: 10 minutos de tolerancia para inicio
                - Solo capitanes pueden reclamar a árbitros
                - Respeto obligatorio a árbitros y rivales
                - Sanciones por acumulación de tarjetas`,
      icon: FileText
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900/70 to-gray-900/90 border border-gray-800 rounded-2xl p-6 md:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Reglas del Torneo
          </h2>
        </div>
        <p className="text-gray-300">
          Información importante sobre las reglas y normas del torneo
        </p>
      </div>

      <div className="space-y-4">
        {ruleSections.map((section) => {
          const IconComponent = section.icon;
          return (
            <div 
              key={section.id} 
              className="border border-gray-700/50 rounded-xl overflow-hidden bg-gray-800/30"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="flex items-center justify-between w-full text-left p-5 hover:bg-gray-700/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-700 rounded-lg">
                    <IconComponent className="h-5 w-5 text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                </div>
                <ChevronDown 
                  className={`h-5 w-5 text-gray-400 transform transition-transform ${
                    expandedSections[section.id] ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              
              {expandedSections[section.id] && (
                <div className="px-5 pb-5 text-gray-300 border-t border-gray-700/50 pt-4">
                  <div className="whitespace-pre-line space-y-2">
                    {section.content.split('\n').map((line, idx) => (
                      <p key={idx}>{line.trim()}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-blue-900/20 border border-blue-800/50 rounded-xl">
        <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Recordatorio Importante
        </h4>
        <p className="text-blue-200 text-sm">
          Todos los participantes deben conocer y respetar estas reglas. 
          Cualquier duda o situación no contemplada será resuelta por el comité organizador.
        </p>
      </div>
    </div>
  );
}
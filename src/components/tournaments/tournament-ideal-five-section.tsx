'use client';

import { BarChart3, Target, Shield, Trophy, Activity, Square, RotateCcw, Users } from 'lucide-react';

export function TournamentIdealFiveSection() {
  return (
    <div className="bg-gradient-to-br from-gray-900/70 to-gray-900/90 border border-gray-800 rounded-2xl p-6 md:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Equipo Ideal 5
          </h2>
        </div>
        <p className="text-gray-300 text-lg">
          Aquí se mostrarán los mejores jugadores por jornada teniendo en cuenta 
          <span className="text-green-400 font-semibold"> múltiples estadísticas y métricas avanzadas</span>
        </p>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-5 w-5 text-green-400" />
            <h3 className="text-xl font-bold text-white">Sistema de Puntuación</h3>
          </div>
          <p className="text-gray-300 mb-4">
            Cada jugador acumula puntos basados en su desempeño en diferentes aspectos del juego:
          </p>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-400" />
                <span className="text-white">Goles</span>
              </div>
              <span className="text-yellow-400 font-bold">+5 pts</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-400" />
                <span className="text-white">Asistencias</span>
              </div>
              <span className="text-yellow-400 font-bold">+4 pts</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-400" />
                <span className="text-white">Paradas (Porteros)</span>
              </div>
              <span className="text-yellow-400 font-bold">+0.5 pts</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-400" />
                <span className="text-white">Robos</span>
              </div>
              <span className="text-yellow-400 font-bold">+1.5 pts</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-orange-400" />
                <span className="text-white">Tiros Bloqueados</span>
              </div>
              <span className="text-yellow-400 font-bold">+2 pts</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Square className="h-4 w-4 text-yellow-500" />
                <span className="text-white">Tarjeta Amarilla</span>
              </div>
              <span className="text-red-400 font-bold">-1 pts</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Square className="h-4 w-4 text-red-500" />
                <span className="text-white">Tarjeta Roja</span>
              </div>
              <span className="text-red-400 font-bold">-3 pts</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Categorías de Líderes</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg border border-green-800/50">
              <h4 className="font-semibold text-green-400 mb-2">Goleadores</h4>
              <p className="text-gray-300 text-sm">Ranking de máximos anotadores del torneo</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-lg border border-blue-800/50">
              <h4 className="font-semibold text-blue-400 mb-2">Asistidores</h4>
              <p className="text-gray-300 text-sm">Jugadores que más ayudan a sus compañeros a marcar</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-red-900/30 to-orange-900/30 rounded-lg border border-red-800/50">
              <h4 className="font-semibold text-red-400 mb-2">Porteros Destacados</h4>
              <p className="text-gray-300 text-sm">Basados en efectividad: (Paradas / (Paradas + Goles Encajados)) × 100</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-800/50">
              <h4 className="font-semibold text-purple-400 mb-2">Defensas</h4>
              <p className="text-gray-300 text-sm">Puntos Defensivos: (Robos × 1.5) + (Tiros Bloqueados × 2)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Formula Explanation */}
      <div className="bg-gradient-to-r from-gray-800/60 to-gray-900/60 rounded-xl p-6 border border-gray-700/50 mb-8">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          Fórmula Matemática para Puntuación General
        </h3>
        <div className="bg-black/30 rounded-lg p-4 mb-4">
          <code className="text-green-400 text-lg font-mono block text-center">
            Puntos = (Goles × 5) + (Asistencias × 4) + (Paradas × 0.5) + (Robos × 1.5) + (Tiros Bloqueados × 2) - (Amarillas × 1) - (Rojas × 3)
          </code>
        </div>
        <p className="text-gray-300 text-center text-sm">
          Esta fórmula permite un ranking multifacético de "jugadores más influyentes" considerando todos los aspectos del juego
        </p>
      </div>

      {/* Example Calculation */}
      <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 rounded-xl p-6 border border-blue-800/50">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-400" />
          Ejemplo de Cálculo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-3">Jugador: Carlos López (Portero)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Paradas:</span>
                <span className="text-white">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Tiros Bloqueados:</span>
                <span className="text-white">2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Robos:</span>
                <span className="text-white">1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Goles Encajados:</span>
                <span className="text-white">0</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-3">Cálculo de Puntos:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Paradas (8 × 0.5):</span>
                <span className="text-green-400">4 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Tiros Bloqueados (2 × 2):</span>
                <span className="text-green-400">4 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Robos (1 × 1.5):</span>
                <span className="text-green-400">1.5 pts</span>
              </div>
              <div className="border-t border-gray-700 pt-2 mt-2">
                <div className="flex justify-between font-bold">
                  <span className="text-white">Total:</span>
                  <span className="text-yellow-400 text-lg">9.5 pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/20 border border-green-800/50 rounded-full">
          <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-400 font-medium">Sistema en desarrollo - Próximamente disponible</span>
        </div>
        <p className="text-gray-400 mt-3 text-sm">
          Las estadísticas se irán actualizando en tiempo real durante el torneo
        </p>
      </div>
    </div>
  );
}
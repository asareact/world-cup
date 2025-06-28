'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Users, 
  Mail, 
  Phone, 
  FileText,
  Plus,
  Save,
  Loader2
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTeams } from '@/lib/hooks/use-teams'
import { usePlayers } from '@/lib/hooks/use-players'
import { PlayerForm } from './player-form'
import { PlayerCard } from './player-card'

interface TeamFormData {
  name: string
  description: string
  contact_email: string
  contact_phone: string
}

export function CreateTeamForm() {
  const router = useRouter()
  const { createTeam } = useTeams()
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null)
  const { players, captain, activePlayers, createPlayer, setCaptain, deletePlayer } = usePlayers(currentTeamId)
  
  const [loading, setLoading] = useState(false)
  const [showPlayerForm, setShowPlayerForm] = useState(false)
  const [teamCreated, setTeamCreated] = useState(false)
  
  const [teamData, setTeamData] = useState<TeamFormData>({
    name: '',
    description: '',
    contact_email: '',
    contact_phone: ''
  })

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!teamData.name.trim()) {
      alert('El nombre del equipo es obligatorio')
      return
    }

    try {
      setLoading(true)
      const newTeam = await createTeam({
        name: teamData.name.trim(),
        description: teamData.description.trim() || null,
        logo_url: null,
        captain_id: null,
        contact_email: teamData.contact_email.trim() || null,
        contact_phone: teamData.contact_phone.trim() || null
      })
      
      setCurrentTeamId(newTeam.id)
      setTeamCreated(true)
    } catch (err) {
      alert('Error al crear el equipo')
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = () => {
    router.push('/dashboard/teams')
  }

  const handleChange = (field: keyof TeamFormData, value: string) => {
    setTeamData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePlayerCreated = () => {
    setShowPlayerForm(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {teamCreated ? `Configurar ${teamData.name}` : 'Crear Nuevo Equipo'}
          </h1>
          <p className="text-gray-400">
            {teamCreated 
              ? 'Agrega jugadores a tu equipo (máximo 12 jugadores)'
              : 'Completa la información básica del equipo de futsal'
            }
          </p>
        </div>
      </div>

      {!teamCreated ? (
        /* Team Creation Form */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-2xl p-6 border border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Información del Equipo</h3>
              <p className="text-sm text-gray-400">Datos básicos del equipo</p>
            </div>
          </div>

          <form onSubmit={handleTeamSubmit} className="space-y-4">
            {/* Team Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nombre del Equipo *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={teamData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ej: Los Tigres FC"
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descripción
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  value={teamData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Descripción opcional del equipo..."
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email de Contacto
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={teamData.contact_email}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                  placeholder="contacto@equipo.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Teléfono de Contacto
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  value={teamData.contact_phone}
                  onChange={(e) => handleChange('contact_phone', e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !teamData.name.trim()}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Creando equipo...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Crear Equipo y Continuar</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      ) : (
        /* Player Management */
        <div className="space-y-6">
          {/* Team Info Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{teamData.name}</h2>
                <p className="text-blue-100">
                  {activePlayers.length}/12 jugadores • {captain ? `Capitán: ${captain.name}` : 'Sin capitán asignado'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{activePlayers.length}</div>
                <div className="text-sm text-blue-100">Jugadores</div>
              </div>
            </div>
          </motion.div>

          {/* Add Player Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <button
              onClick={() => setShowPlayerForm(true)}
              disabled={activePlayers.length >= 12}
              className="w-full flex items-center justify-center space-x-3 p-4 border-2 border-dashed border-gray-600 rounded-xl hover:border-blue-500 hover:bg-blue-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-6 w-6 text-gray-400" />
              <span className="text-gray-400 font-medium">
                {activePlayers.length >= 12 ? 'Equipo completo (12/12)' : 'Agregar Jugador'}
              </span>
            </button>
          </motion.div>

          {/* Players Grid */}
          {activePlayers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {activePlayers.map((player, index) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onSetCaptain={async () => await setCaptain(player.id)}
                  onDelete={async () => await deletePlayer(player.id)}
                  index={index}
                />
              ))}
            </motion.div>
          )}

          {/* Player Form Modal */}
          {showPlayerForm && (
            <PlayerForm
              teamId={currentTeamId!}
              onClose={() => setShowPlayerForm(false)}
              onPlayerCreated={handlePlayerCreated}
            />
          )}

          {/* Finish Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-between items-center"
          >
            <div className="text-gray-400 text-sm">
              {activePlayers.length < 7 ? (
                <span className="text-yellow-400">
                  ⚠️ Mínimo 7 jugadores requeridos ({activePlayers.length}/7)
                </span>
              ) : (
                <span className="text-green-400">
                  ✓ Equipo listo ({activePlayers.length} jugadores)
                </span>
              )}
            </div>
            
            <div className="flex space-x-3">
              {activePlayers.length < 7 && (
                <button
                  onClick={handleFinish}
                  className="flex items-center space-x-2 border border-gray-600 text-gray-300 px-6 py-3 rounded-xl hover:bg-gray-700 transition-all"
                >
                  <Save className="h-5 w-5" />
                  <span>Guardar y Continuar Luego</span>
                </button>
              )}
              
              <button
                onClick={handleFinish}
                disabled={activePlayers.length < 7}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-5 w-5" />
                <span>{activePlayers.length >= 7 ? 'Finalizar Equipo' : 'Completar Equipo (7 min.)'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
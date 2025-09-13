'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Users, 
  Mail, 
  Phone, 
  FileText,
  Plus,
  Save,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTeams } from '@/lib/hooks/use-teams'
import { usePlayers } from '@/lib/hooks/use-players'
import { PlayerForm } from './player-form'
import { PlayerCard } from './player-card'
import { db } from '@/lib/database'

interface EditTeamFormProps {
  teamId: string
}

interface TeamFormData {
  name: string
  description: string
  contact_email: string
  contact_phone: string
}

export function EditTeamForm({ teamId }: EditTeamFormProps) {
  const router = useRouter()
  const { updateTeam } = useTeams()
  const { captain, activePlayers, setCaptain, deletePlayer } = usePlayers(teamId)
  
  const [loading, setLoading] = useState(false)
  const [loadingTeam, setLoadingTeam] = useState(true)
  const [showPlayerForm, setShowPlayerForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [teamData, setTeamData] = useState<TeamFormData>({
    name: '',
    description: '',
    contact_email: '',
    contact_phone: ''
  })

  // Cargar datos del equipo
  useEffect(() => {
    const loadTeam = async () => {
      try {
        setLoadingTeam(true)
        const team = await db.getTeam(teamId)
        if (team) {
          setTeamData({
            name: team.name,
            description: team.description || '',
            contact_email: team.contact_email || '',
            contact_phone: team.contact_phone || ''
          })
        }
      } catch (err) {
        console.error('Error loading team:', err)
        setError('Error al cargar el equipo')
      } finally {
        setLoadingTeam(false)
      }
    }

    loadTeam()
  }, [teamId])

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!teamData.name.trim()) {
      alert('El nombre del equipo es obligatorio')
      return
    }

    try {
      setLoading(true)
      await updateTeam(teamId, {
        name: teamData.name.trim(),
        description: teamData.description.trim() || null,
        contact_email: teamData.contact_email.trim() || null,
        contact_phone: teamData.contact_phone.trim() || null
      })
      
      alert('Equipo actualizado exitosamente')
    } catch {
      alert('Error al actualizar el equipo')
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

  if (loadingTeam) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-3 text-white">Cargando equipo...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Error al cargar el equipo</h3>
        <p className="text-gray-400 mb-6">{error}</p>
        <button 
          onClick={() => router.back()} 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Volver
        </button>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-white">Editar {teamData.name}</h1>
          <p className="text-gray-400">
            Modifica la información del equipo y gestiona jugadores
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Information Form */}
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

            {/* Update Button */}
            <button
              type="submit"
              disabled={loading || !teamData.name.trim()}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Actualizando...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Actualizar Información</span>
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Player Management */}
        <div className="space-y-6">
          {/* Team Stats Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Plantilla del Equipo</h2>
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
            transition={{ delay: 0.2 }}
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
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 gap-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar"
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

          {/* Team Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800 rounded-xl p-4 border border-gray-700"
          >
            <div className="text-center">
              {activePlayers.length < 7 ? (
                <div className="text-yellow-400">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-medium">Equipo incompleto</p>
                  <p className="text-sm">Necesitas al menos 7 jugadores para competir</p>
                </div>
              ) : (
                <div className="text-green-400">
                  <Users className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-medium">Equipo listo para competir</p>
                  <p className="text-sm">{activePlayers.length} jugadores registrados</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Player Form Modal */}
      {showPlayerForm && (
        <PlayerForm
          teamId={teamId}
          onClose={() => setShowPlayerForm(false)}
          onPlayerCreated={handlePlayerCreated}
        />
      )}

      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex justify-end"
      >
        <button
          onClick={handleFinish}
          className="flex items-center space-x-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Volver a Equipos</span>
        </button>
      </motion.div>
    </div>
  )
}

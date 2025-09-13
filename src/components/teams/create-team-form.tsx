'use client'

import { useMemo, useState } from 'react'
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
  Image as ImageIcon,
  Upload,
  X
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTeams } from '@/lib/hooks/use-teams'
import { usePlayers } from '@/lib/hooks/use-players'
import { supabase } from '@/lib/supabase'
import { db } from '@/lib/database'
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
  const { captain, activePlayers, setCaptain, deletePlayer, refetch } = usePlayers(currentTeamId)
  
  const [loading, setLoading] = useState(false)
  const [showPlayerForm, setShowPlayerForm] = useState(false)
  const [teamCreated, setTeamCreated] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  
  const [teamData, setTeamData] = useState<TeamFormData>({
    name: '',
    description: '',
    contact_email: '',
    contact_phone: ''
  })
  const [logoError, setLogoError] = useState('')
  const [toast, setToast] = useState<{ message: string, type: 'success'|'error' } | null>(null)

  const emailError = useMemo(() => {
    if (!teamData.contact_email) return ''
    const re = /.+@.+\..+/
    return re.test(teamData.contact_email) ? '' : 'Email inválido'
  }, [teamData.contact_email])

  const phoneError = useMemo(() => {
    if (!teamData.contact_phone) return ''
    const re = /^[+\d][\d\s().-]{6,}$/
    return re.test(teamData.contact_phone) ? '' : 'Teléfono inválido'
  }, [teamData.contact_phone])

  const uploadLogo = async (file: File, teamId: string) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    // Deterministic path to enable overwrite and instant refresh
    const path = `teams/${teamId}/logo.${ext}`
    // Try primary 'team-logos' bucket, then fallback to 'player-photos'
    try {
      const { error: upErr } = await supabase
        .storage
        .from('team-logos')
        .upload(path, file, { upsert: true, contentType: file.type || 'image/*' })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('team-logos').getPublicUrl(path)
      return `${data.publicUrl}?t=${Date.now()}`
    } catch (e) {
      console.warn('team-logos upload failed, trying fallback bucket:', e)
      const { error: fallbackErr } = await supabase
        .storage
        .from('player-photos')
        .upload(path, file, { upsert: true, contentType: file.type || 'image/*' })
      if (fallbackErr) throw fallbackErr
      const { data } = supabase.storage.from('player-photos').getPublicUrl(path)
      return `${data.publicUrl}?t=${Date.now()}`
  }
  }

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!teamData.name.trim()) {
      alert('El nombre del equipo es obligatorio')
      return
    }
    if (emailError || phoneError) return

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
      
      // Upload logo if provided
      if (logoFile) {
        try {
          const url = await uploadLogo(logoFile, newTeam.id)
          // Persist without cache-busting query
          await db.updateTeam(newTeam.id, { logo_url: url.split('?')[0] })
          // Update preview immediately with cache-busted URL
          setLogoPreview(url)
        } catch (e) {
          console.warn('No se pudo subir el logo', e)
          setToast({ message: 'Logo no subido (permisos). Equipo guardado.', type: 'error' })
          setTimeout(() => setToast(null), 2500)
        }
      }

      setCurrentTeamId(newTeam.id)
      setTeamCreated(true)
      setToast({ message: 'Equipo creado', type: 'success' })
      setTimeout(() => setToast(null), 2000)
    } catch {
      setToast({ message: 'Error al crear el equipo', type: 'error' })
      setTimeout(() => setToast(null), 2000)
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

  const handleLogoChange = (file: File | null) => {
    setLogoError('')
    if (file) {
      const max = 2 * 1024 * 1024
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
      if (!allowed.includes(file.type)) {
        setLogoError('Formato inválido. Usa JPG, PNG, WEBP o SVG')
        return
      }
      if (file.size > max) {
        setLogoError('El archivo supera 2MB')
        return
      }
    }
    setLogoFile(file)
    setLogoPreview(file ? URL.createObjectURL(file) : null)
  }

  const handlePlayerCreated = async () => {
    // Close modal immediately, refresh in background and show toast
    setShowPlayerForm(false)
    setToast({ message: 'Jugador agregado', type: 'success' })
    setTimeout(() => setToast(null), 2000)
    refetch().catch(() => {})
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.message}
        </div>
      )}
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

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Logo (opcional)</label>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-700 rounded-xl overflow-hidden flex items-center justify-center border border-gray-600">
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <label className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${logoError ? 'border-red-500 text-red-300' : 'border-gray-600 text-gray-200'} hover:bg-gray-700 cursor-pointer`}>
                    <Upload className="h-4 w-4" />
                    <span>Subir imagen</span>
                    <input className="hidden" type="file" accept="image/*" onChange={(e) => handleLogoChange(e.target.files?.[0] || null)} disabled={loading} />
                  </label>
                  {logoPreview && (
                    <button type="button" className="ml-2 inline-flex items-center space-x-1 text-xs text-gray-300 hover:text-white" onClick={() => handleLogoChange(null)}>
                      <X className="h-3 w-3" />
                      <span>Quitar</span>
                    </button>
                  )}
                  <div className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP o SVG • máx. 2MB</div>
                  {logoError && <div className="text-xs text-red-400 mt-1">{logoError}</div>}
                </div>
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
                <div className="text-xs text-gray-400 mt-1 text-right">{teamData.description.length}/280</div>
              </div>
            </div>

            {/* Contacto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${emailError ? 'border-red-500' : 'border-gray-600'}`}
                    disabled={loading}
                  />
                  {emailError && <p className="mt-1 text-xs text-red-400">{emailError}</p>}
                </div>
              </div>
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
                  className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${phoneError ? 'border-red-500' : 'border-gray-600'}`}
                    disabled={loading}
                  />
                  {phoneError && <p className="mt-1 text-xs text-red-400">{phoneError}</p>}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !teamData.name.trim() || !!emailError || !!phoneError}
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

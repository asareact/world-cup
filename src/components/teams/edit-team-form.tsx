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
  AlertCircle,
  Image as ImageIcon,
  Upload,
  X
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTeams } from '@/lib/hooks/use-teams'
import { usePlayers, FUTSAL_POSITIONS, FutsalPosition } from '@/lib/hooks/use-players'
import { PlayerForm } from './player-form'
import { db } from '@/lib/database'
import { supabase } from '@/lib/supabase'

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
  const { captain, activePlayers, setCaptain, deletePlayer, refetch, updatePlayer } = usePlayers(teamId)
  
  const [loading, setLoading] = useState(false)
  const [loadingTeam, setLoadingTeam] = useState(true)
  const [showPlayerForm, setShowPlayerForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoError, setLogoError] = useState('')
  const [toast, setToast] = useState<{ message: string, type: 'success'|'error' } | null>(null)
  const [showTeamInfoModal, setShowTeamInfoModal] = useState(false)
  const [showTeamInfoTip, setShowTeamInfoTip] = useState(false)
  // Players table UX state
  const [playerSearch, setPlayerSearch] = useState('')
  const [sortBy, setSortBy] = useState<'number'|'name'|'position'>('name')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')
  const [editRowId, setEditRowId] = useState<string | null>(null)
  const [savingRowId, setSavingRowId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ jersey_number: number | '' , position: keyof typeof FUTSAL_POSITIONS | ''}>({ jersey_number: '', position: '' })
  
  const [teamData, setTeamData] = useState<TeamFormData>({
    name: '',
    description: '',
    contact_email: '',
    contact_phone: ''
  })
  const [emailError, setEmailError] = useState('')
  const [phoneError, setPhoneError] = useState('')

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
          if (team.logo_url) setLogoPreview(team.logo_url)
        }
      } catch (err) {
        console.error('Error loading team:', err)
        setError('Error al cargar el equipo')
      } finally {
        setLoadingTeam(false)
      }
    }

    loadTeam()
    // Restore modal open state
    if (typeof window !== 'undefined') {
      const persisted = sessionStorage.getItem(`teamInfoModalOpen:${teamId}`)
      setShowTeamInfoModal(persisted === '1')
      const tipDismissed = localStorage.getItem(`teamInfoTipDismissed:${teamId}`)
      setShowTeamInfoTip(!tipDismissed)
    }
  }, [teamId])

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!teamData.name.trim()) {
      alert('El nombre del equipo es obligatorio')
      return
    }
    if (emailError || phoneError) return

    try {
      setLoading(true)
      let logoUrl: string | null = null
      if (logoFile) {
        const ext = logoFile.name.split('.').pop()?.toLowerCase() || 'png'
        // Deterministic path to enable overwrite and instant refresh
        const path = `teams/${teamId}/logo.${ext}`
        // Try primary bucket 'team-logos' first, then fallback to 'player-photos'
        try {
          const { error: upErr } = await supabase
            .storage
            .from('team-logos')
            .upload(path, logoFile, { upsert: true, contentType: logoFile.type || 'image/*' })
          if (upErr) throw upErr
          const { data } = supabase.storage.from('team-logos').getPublicUrl(path)
          logoUrl = data.publicUrl
        } catch (e) {
          console.warn('team-logos upload failed, trying fallback bucket:', e)
          try {
            const { error: fallbackErr } = await supabase
              .storage
              .from('player-photos')
              .upload(path, logoFile, { upsert: true, contentType: logoFile.type || 'image/*' })
            if (fallbackErr) throw fallbackErr
            const { data } = supabase.storage.from('player-photos').getPublicUrl(path)
            logoUrl = data.publicUrl
          } catch (fallback) {
            console.error('Fallback upload failed:', fallback)
            setToast({ message: 'Logo no subido (permisos). Datos guardados.', type: 'error' })
            setTimeout(() => setToast(null), 2500)
            // Proceed without logo
          }
        }
      }
      await updateTeam(teamId, {
        name: teamData.name.trim(),
        description: teamData.description.trim() || null,
        contact_email: teamData.contact_email.trim() || null,
        contact_phone: teamData.contact_phone.trim() || null,
        ...(logoUrl ? { logo_url: logoUrl } : {})
      })
      // If we uploaded a new logo, update local preview to the public URL (cache-busted)
      if (logoUrl) {
        const cacheBusted = `${logoUrl}?t=${Date.now()}`
        setLogoPreview(cacheBusted)
      }
      // Close modal first, then show toast
      setShowTeamInfoModal(false)
      setToast({ message: 'Equipo actualizado', type: 'success' })
      setTimeout(() => setToast(null), 2000)
    } catch {
      setToast({ message: 'Error al actualizar el equipo', type: 'error' })
      setTimeout(() => setToast(null), 2000)
    } finally {
      setLoading(false)
    }
  }

  // Persist modal open state across navigations (same session)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`teamInfoModalOpen:${teamId}`, showTeamInfoModal ? '1' : '0')
    }
  }, [showTeamInfoModal, teamId])

  const handleFinish = () => {
    router.push('/dashboard/teams')
  }

  const handleChange = (field: keyof TeamFormData, value: string) => {
    setTeamData(prev => ({
      ...prev,
      [field]: value
    }))
    if (field === 'contact_email') {
      const re = /.+@.+\..+/
      setEmailError(value && !re.test(value) ? 'Email inválido' : '')
    }
    if (field === 'contact_phone') {
      const re = /^[+\d][\d\s().-]{6,}$/
      setPhoneError(value && !re.test(value) ? 'Teléfono inválido' : '')
    }
  }

  const onLogoInput = (file: File | null) => {
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
    setLogoPreview(file ? URL.createObjectURL(file) : logoPreview)
  }

  const handlePlayerCreated = async () => {
    // Close modal immediately, then refresh list in background and show toast
    setShowPlayerForm(false)
    setToast({ message: 'Jugador agregado', type: 'success' })
    setTimeout(() => setToast(null), 2000)
    refetch().catch(() => {})
  }

  const filteredSortedPlayers = () => {
    let rows = activePlayers
    if (playerSearch.trim()) {
      const q = playerSearch.toLowerCase()
      rows = rows.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.jersey_number ? String(p.jersey_number).includes(q) : false) ||
        (p.position ? FUTSAL_POSITIONS[p.position].toLowerCase().includes(q) : false)
      )
    }
    rows = [...rows].sort((a, b) => {
      let va: string | number | null = null
      let vb: string | number | null = null
      if (sortBy === 'number') { va = a.jersey_number || 0; vb = b.jersey_number || 0 }
      if (sortBy === 'name') { va = a.name.toLowerCase(); vb = b.name.toLowerCase() }
      if (sortBy === 'position') { va = a.position ? FUTSAL_POSITIONS[a.position] : ''; vb = b.position ? FUTSAL_POSITIONS[b.position] : '' }
      if (va! < vb!) return sortDir === 'asc' ? -1 : 1
      if (va! > vb!) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return rows
  }

  const handleSort = (key: 'number'|'name'|'position') => {
    if (sortBy === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortDir('asc')
    }
  }

  const startEditRow = (playerId: string, initial: { jersey_number: number | null, position: keyof typeof FUTSAL_POSITIONS | null }) => {
    setEditRowId(playerId)
    setEditValues({ jersey_number: initial.jersey_number || '', position: initial.position || '' })
  }

  const cancelEditRow = () => {
    setEditRowId(null)
    setEditValues({ jersey_number: '', position: '' })
  }

  const isDuplicateNumber = (num: number, playerId: string) => {
    return activePlayers.some(p => p.id !== playerId && p.is_active && p.jersey_number === num)
  }

  const saveEditRow = async (playerId: string) => {
    const jersey = editValues.jersey_number === '' ? null : Number(editValues.jersey_number)
    if (jersey !== null) {
      if (jersey < 1 || jersey > 99) {
        setToast({ message: 'Número debe ser entre 1 y 99', type: 'error' })
        setTimeout(() => setToast(null), 2000)
        return
      }
      if (isDuplicateNumber(jersey, playerId)) {
        setToast({ message: 'Número de camiseta duplicado', type: 'error' })
        setTimeout(() => setToast(null), 2000)
        return
      }
    }
    try {
      setSavingRowId(playerId)
      await updatePlayer(playerId, {
        jersey_number: jersey as number | null,
        position: (editValues.position || null) as FutsalPosition | null
      })
      setToast({ message: 'Jugador actualizado', type: 'success' })
      setTimeout(() => setToast(null), 1500)
      cancelEditRow()
    } catch {
      setToast({ message: 'Error al actualizar', type: 'error' })
      setTimeout(() => setToast(null), 2000)
    } finally {
      setSavingRowId(null)
    }
  }

  // Photo change with automatic square crop
  const handlePhotoChange = async (playerId: string, file: File | null, playerName: string) => {
    if (!file) return
    try {
      const cropped = await cropToSquare(file, 256)
      // Deterministic path for player photo to allow overwrite and cache-busting
      const path = `teams/${teamId}/players/${playerId}.jpg`
      const { error: upErr } = await supabase.storage.from('player-photos').upload(path, cropped, { contentType: 'image/jpeg', upsert: true })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('player-photos').getPublicUrl(path)
      // Persist URL without cache-busting
      await updatePlayer(playerId, { photo_url: data.publicUrl as string })
      // Ask list to refresh so UI can pick up ?t=updated_at
      try { await refetch() } catch {}
      setToast({ message: `Foto actualizada (${playerName})`, type: 'success' })
      setTimeout(() => setToast(null), 1500)
    } catch (e) {
      console.error(e)
      setToast({ message: 'No se pudo actualizar la foto', type: 'error' })
      setTimeout(() => setToast(null), 2000)
    }
  }

  const cropToSquare = (file: File, size = 256): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const s = Math.min(img.width, img.height)
        const sx = (img.width - s) / 2
        const sy = (img.height - s) / 2
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas no soportado'))
        ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size)
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('No se pudo generar imagen'))
          resolve(blob)
        }, 'image/jpeg', 0.9)
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
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
          <h1 className="text-2xl font-bold text-white">Editar {teamData.name}</h1>
          <p className="text-gray-400">
            Modifica la información del equipo y gestiona jugadores
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Summary Card with Edit Button */}
        {/* Tip banner (first time) */}
        {showTeamInfoTip && (
          <div className="bg-blue-900/30 border border-blue-700 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm text-blue-100">
                Consejo: ahora puedes editar la información del equipo desde el botón “Editar información”, así mantienes la vista enfocada en tus jugadores.
              </div>
              <button
                className="px-3 py-1.5 rounded-lg bg-blue-700 text-white hover:bg-blue-600 text-xs"
                onClick={() => {
                  setShowTeamInfoTip(false)
                  if (typeof window !== 'undefined') localStorage.setItem(`teamInfoTipDismissed:${teamId}`, '1')
                }}
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-2xl p-6 border border-gray-700"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gray-700 rounded-xl overflow-hidden flex items-center justify-center border border-gray-600">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
              ) : (
                <Users className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white truncate">{teamData.name || 'Equipo'}</h3>
                <button
                  onClick={() => setShowTeamInfoModal(true)}
                  className="px-3 py-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 text-sm"
                >
                  Editar información
                </button>
              </div>
              <div className="text-sm text-gray-300 line-clamp-2 mt-1">{teamData.description || 'Sin descripción'}</div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mt-3">
                {teamData.contact_email && (
                  <div className="flex items-center gap-1"><Mail className="h-4 w-4" /><span>{teamData.contact_email}</span></div>
                )}
                {teamData.contact_phone && (
                  <div className="flex items-center gap-1"><Phone className="h-4 w-4" /><span>{teamData.contact_phone}</span></div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Player Management (sidebar info) */}
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

      {/* Full-width Players Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-semibold text-white">Jugadores</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                placeholder="Buscar nombre, # o posición..."
                className="w-56 md:w-72 px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowPlayerForm(true)}
              disabled={activePlayers.length >= 12}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              <span>{activePlayers.length >= 12 ? 'Equipo completo (12/12)' : 'Agregar Jugador'}</span>
            </button>
          </div>
        </div>

        {activePlayers.length > 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-800 text-gray-300 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left">Foto</th>
                    <th
                      className="px-4 py-3 text-left hidden sm:table-cell cursor-pointer select-none"
                      onClick={() => handleSort('number')}
                    >
                      # {sortBy === 'number' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th
                      className="px-4 py-3 text-left cursor-pointer select-none"
                      onClick={() => handleSort('name')}
                    >
                      Nombre {sortBy === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th
                      className="px-4 py-3 text-left hidden md:table-cell cursor-pointer select-none"
                      onClick={() => handleSort('position')}
                    >
                      Posición {sortBy === 'position' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Capitán</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredSortedPlayers().map((player) => (
                    <tr key={player.id} className="hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-700 overflow-hidden flex items-center justify-center">
                            {player.photo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
                            ) : (
                              <Users className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <label className="text-xs text-blue-300 hover:text-white cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handlePhotoChange(player.id, e.target.files?.[0] || null, player.name)}
                            />
                            Cambiar
                          </label>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-200 hidden sm:table-cell">
                        {editRowId === player.id ? (
                          <input
                            type="number"
                            min={1}
                            max={99}
                            value={editValues.jersey_number}
                            onChange={(e) => setEditValues(v => ({ ...v, jersey_number: e.target.value === '' ? '' : Number(e.target.value) }))}
                            className="w-20 px-2 py-1 rounded-lg bg-gray-800 border border-gray-600 text-gray-200"
                          />
                        ) : (
                          <button className="text-gray-200 hover:text-white" onClick={() => startEditRow(player.id, { jersey_number: player.jersey_number, position: player.position })}>
                            {player.jersey_number || '-'}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-white font-medium">
                        <div>{player.name}</div>
                        <div className="md:hidden text-xs text-gray-400 mt-1">
                          <span className="mr-2">#{player.jersey_number || '-'}</span>
                          <span>{player.position ? FUTSAL_POSITIONS[player.position] : '—'}</span>
                          {player.is_captain && <span className="ml-2 text-yellow-300">• Capitán</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300 hidden md:table-cell">
                        {editRowId === player.id ? (
                          <select
                            value={editValues.position}
                            onChange={(e) => setEditValues(v => ({ ...v, position: e.target.value as keyof typeof FUTSAL_POSITIONS | '' }))}
                            className="px-2 py-1 rounded-lg bg-gray-800 border border-gray-600 text-gray-200"
                          >
                            <option value="">—</option>
                            {Object.entries(FUTSAL_POSITIONS).map(([k, label]) => (
                              <option key={k} value={k}>{label}</option>
                            ))}
                          </select>
                        ) : (
                          <button className="text-gray-300 hover:text-white" onClick={() => startEditRow(player.id, { jersey_number: player.jersey_number, position: player.position })}>
                            {player.position ? FUTSAL_POSITIONS[player.position] : '—'}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {player.is_captain ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-900/40 text-yellow-300 border border-yellow-700/40">Capitán</span>
                        ) : (
                          <button
                            onClick={async () => {
                              try {
                                await setCaptain(player.id)
                                setToast({ message: 'Capitán actualizado', type: 'success' })
                                setTimeout(() => setToast(null), 2000)
                              } catch {
                                setToast({ message: 'Error al designar capitán', type: 'error' })
                                setTimeout(() => setToast(null), 2000)
                              }
                            }}
                            className="px-2 py-1 rounded-lg text-xs bg-yellow-600 text-white hover:bg-yellow-700"
                          >
                            Nombrar
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {editRowId === player.id ? (
                          <>
                            <button
                              disabled={savingRowId === player.id}
                              onClick={() => saveEditRow(player.id)}
                              className="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 text-xs"
                            >
                              {savingRowId === player.id ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button
                              onClick={cancelEditRow}
                              className="px-3 py-1.5 rounded-lg bg-gray-700 text-white hover:bg-gray-600 text-xs"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : null}
                        <button
                          onClick={async () => {
                            if (!confirm(`¿Eliminar a ${player.name}?`)) return
                            try {
                              await deletePlayer(player.id)
                              setToast({ message: 'Jugador eliminado', type: 'success' })
                              setTimeout(() => setToast(null), 2000)
                            } catch {
                              setToast({ message: 'Error al eliminar jugador', type: 'error' })
                              setTimeout(() => setToast(null), 2000)
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-xs"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-gray-400 text-sm">Aún no hay jugadores en el equipo.</div>
        )}
      </div>

      {/* Player Form Modal */}
      {showPlayerForm && (
        <PlayerForm
          teamId={teamId}
          onClose={() => setShowPlayerForm(false)}
          onPlayerCreated={handlePlayerCreated}
        />
      )}

      {/* Team Info Modal */}
      {showTeamInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowTeamInfoModal(false)} />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl p-6 mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Editar información del equipo</h3>
                  <p className="text-sm text-gray-400">Actualiza los datos del equipo</p>
                </div>
              </div>
              <button className="p-2 text-gray-400 hover:text-white" onClick={() => setShowTeamInfoModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleTeamSubmit} className="space-y-4">
              {/* Team Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nombre del Equipo *</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={teamData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Ej: Los Tigres FC"
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Descripción</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <textarea
                    value={teamData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Descripción opcional del equipo..."
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    disabled={loading}
                  />
                  <div className="text-xs text-gray-400 mt-1 text-right">{teamData.description.length}/280</div>
                </div>
              </div>

              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Logo</label>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center border border-gray-700">
                    {logoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <label className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${logoError ? 'border-red-500 text-red-300' : 'border-gray-700 text-gray-200'} hover:bg-gray-800 cursor-pointer`}>
                      <Upload className="h-4 w-4" />
                      <span>Subir imagen</span>
                      <input className="hidden" type="file" accept="image/*" onChange={(e) => onLogoInput(e.target.files?.[0] || null)} disabled={loading} />
                    </label>
                    {logoPreview && (
                      <button type="button" className="ml-2 inline-flex items-center space-x-1 text-xs text-gray-300 hover:text-white" onClick={() => onLogoInput(null)}>
                        <X className="h-3 w-3" />
                        <span>Quitar</span>
                      </button>
                    )}
                    <div className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP o SVG • máx. 2MB</div>
                    {logoError && <div className="text-xs text-red-400 mt-1">{logoError}</div>}
                  </div>
                </div>
              </div>

              {/* Contact Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email de Contacto</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={teamData.contact_email}
                    onChange={(e) => handleChange('contact_email', e.target.value)}
                    placeholder="contacto@equipo.com"
                    className={`w-full pl-10 pr-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${emailError ? 'border-red-500' : 'border-gray-700'}`}
                    disabled={loading}
                  />
                  {emailError && <p className="mt-1 text-xs text-red-400">{emailError}</p>}
                </div>
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Teléfono de Contacto</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={teamData.contact_phone}
                    onChange={(e) => handleChange('contact_phone', e.target.value)}
                    placeholder="+1 234 567 8900"
                    className={`w-full pl-10 pr-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${phoneError ? 'border-red-500' : 'border-gray-700'}`}
                    disabled={loading}
                  />
                  {phoneError && <p className="mt-1 text-xs text-red-400">{phoneError}</p>}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTeamInfoModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-gray-200 hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !teamData.name.trim() || !!emailError || !!phoneError}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Actualizando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Guardar cambios</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
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

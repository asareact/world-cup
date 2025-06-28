'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  User, 
  Hash, 
  Camera, 
  Upload,
  Loader2,
  Crown
} from 'lucide-react'
import { usePlayers, FUTSAL_POSITIONS, FutsalPosition } from '@/lib/hooks/use-players'

interface PlayerFormProps {
  teamId: string
  onClose: () => void
  onPlayerCreated: () => void
}

interface PlayerFormData {
  name: string
  position: FutsalPosition | ''
  jersey_number: number | ''
  is_captain: boolean
  photo_url: string | null
}

export function PlayerForm({ teamId, onClose, onPlayerCreated }: PlayerFormProps) {
  const { createPlayer, availableNumbers, activePlayers, captain } = usePlayers(teamId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  
  const [formData, setFormData] = useState<PlayerFormData>({
    name: '',
    position: '',
    jersey_number: '',
    is_captain: false,
    photo_url: null
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('El nombre del jugador es obligatorio')
      return
    }

    if (!formData.position) {
      alert('La posición es obligatoria')
      return
    }

    // Verificar si ya existe un capitán y se está intentando crear otro
    if (formData.is_captain && captain) {
      const confirmReplace = confirm(`${captain.name} ya es capitán. ¿Quieres reemplazarlo con ${formData.name}?`)
      if (!confirmReplace) {
        return
      }
    }

    try {
      setLoading(true)
      console.log('Creating player with data:', {
        team_id: teamId,
        name: formData.name.trim(),
        position: formData.position,
        jersey_number: formData.jersey_number || null,
        is_captain: formData.is_captain,
        photo_url: formData.photo_url,
        birth_date: null,
        is_active: true
      })
      
      const newPlayer = await createPlayer({
        team_id: teamId,
        name: formData.name.trim(),
        position: formData.position,
        jersey_number: formData.jersey_number || null,
        is_captain: formData.is_captain,
        photo_url: formData.photo_url,
        birth_date: null,
        is_active: true
      })
      
      console.log('Player created successfully:', newPlayer)
      
      // Reset form
      setFormData({
        name: '',
        position: '',
        jersey_number: '',
        is_captain: false,
        photo_url: null
      })
      
      onPlayerCreated()
    } catch (err) {
      console.error('Error creating player:', err)
      if (err instanceof Error) {
        alert(err.message)
      } else {
        alert('Error al crear el jugador')
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida')
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen debe ser menor a 5MB')
      return
    }

    try {
      setUploadingPhoto(true)
      
      // Convertir imagen a base64 para demostración
      // En producción, aquí subirías a Supabase Storage
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string
        setFormData(prev => ({
          ...prev,
          photo_url: imageUrl
        }))
        setUploadingPhoto(false)
      }
      reader.onerror = () => {
        alert('Error al procesar la imagen')
        setUploadingPhoto(false)
      }
      reader.readAsDataURL(file)
      
    } catch (err) {
      console.error('Error uploading photo:', err)
      alert('Error al subir la imagen')
      setUploadingPhoto(false)
    }
  }

  const handleChange = (field: keyof PlayerFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNumberChange = (value: string) => {
    const num = parseInt(value)
    if (value === '' || (num >= 1 && num <= 99)) {
      handleChange('jersey_number', value === '' ? '' : num)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Agregar Jugador</h3>
                <p className="text-sm text-gray-400">Nuevo jugador al equipo</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Photo Upload */}
            <div className="text-center">
              <div className="relative inline-block">
                {formData.photo_url ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-green-500">
                    <img 
                      src={formData.photo_url} 
                      alt="Foto del jugador" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center border-2 border-dashed border-gray-600">
                    <Camera className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute -bottom-2 -right-2 p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              
              <p className="text-xs text-gray-400 mt-2">
                Foto opcional (máximo 5MB)
              </p>
            </div>

            {/* Player Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nombre del Jugador *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Nombre completo"
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Posición *
              </label>
              <select
                value={formData.position}
                onChange={(e) => handleChange('position', e.target.value as FutsalPosition)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
                disabled={loading}
              >
                <option value="">Seleccionar posición</option>
                {Object.entries(FUTSAL_POSITIONS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Jersey Number */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Número de Camiseta
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={formData.jersey_number}
                  onChange={(e) => handleNumberChange(e.target.value)}
                  placeholder="Opcional (1-99)"
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
              {formData.jersey_number && !availableNumbers.includes(formData.jersey_number as number) && (
                <p className="text-red-400 text-sm mt-1">Este número ya está en uso</p>
              )}
              <p className="text-gray-400 text-xs mt-1">
                Números disponibles: {availableNumbers.slice(0, 10).join(', ')}
                {availableNumbers.length > 10 && '...'}
              </p>
            </div>

            {/* Captain Checkbox */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="is-captain"
                checked={formData.is_captain}
                onChange={(e) => handleChange('is_captain', e.target.checked)}
                className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                disabled={loading}
              />
              <label htmlFor="is-captain" className="flex items-center space-x-2 text-sm text-gray-300">
                <Crown className="h-4 w-4 text-yellow-500" />
                <span>Designar como capitán</span>
              </label>
            </div>
            {captain && formData.is_captain && (
              <p className="text-yellow-400 text-sm">
                ⚠️ {captain.name} actualmente es capitán y será reemplazado
              </p>
            )}

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name.trim() || !formData.position || (formData.jersey_number && !availableNumbers.includes(formData.jersey_number as number))}
                className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Agregando...</span>
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4" />
                    <span>Agregar Jugador</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
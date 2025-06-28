'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Mail, Phone, User, Loader2 } from 'lucide-react'
import { useTeams } from '@/lib/hooks/use-teams'

interface AddTeamModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddTeamModal({ isOpen, onClose }: AddTeamModalProps) {
  const { createTeam } = useTeams()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contact_email: '',
    contact_phone: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('El nombre del equipo es obligatorio')
      return
    }

    try {
      setLoading(true)
      await createTeam({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        logo_url: null,
        captain_id: null,
        contact_email: formData.contact_email.trim() || null,
        contact_phone: formData.contact_phone.trim() || null
      })
      
      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        contact_email: '',
        contact_phone: ''
      })
      onClose()
    } catch (err) {
      alert('Error al crear el equipo')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="relative w-full max-w-md bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Crear Nuevo Equipo</h3>
                  <p className="text-sm text-gray-400">Agrega un equipo de futsal</p>
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
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Team Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre del Equipo *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
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
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Descripción opcional del equipo..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={loading}
                />
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
                    value={formData.contact_email}
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
                    value={formData.contact_phone}
                    onChange={(e) => handleChange('contact_phone', e.target.value)}
                    placeholder="+1 234 567 8900"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>
              </div>

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
                  disabled={loading || !formData.name.trim()}
                  className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creando...</span>
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4" />
                      <span>Crear Equipo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
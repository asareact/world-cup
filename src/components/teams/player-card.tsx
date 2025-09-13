'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Crown, 
  User,
  MoreHorizontal,
  Trash2,
  Edit,
  Loader2,
  Star,
  Shield,
  Zap
} from 'lucide-react'
import { Player } from '@/lib/database'
import { FUTSAL_POSITIONS } from '@/lib/hooks/use-players'

interface PlayerCardProps {
  player: Player
  onSetCaptain: () => void
  onDelete: () => void
  index: number
  onFeedback?: (message: string, type: 'success'|'error') => void
}

export function PlayerCard({ player, onSetCaptain, onDelete, index, onFeedback }: PlayerCardProps) {
  const [loadingCaptain, setLoadingCaptain] = useState(false)
  const [loadingDelete, setLoadingDelete] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  const positionConfig = {
    portero: { 
      gradient: 'from-yellow-500 to-yellow-600',
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-400',
      icon: Shield
    },
    cierre: { 
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      icon: Shield
    },
    ala: { 
      gradient: 'from-green-500 to-green-600',
      bg: 'bg-green-500/10',
      text: 'text-green-400',
      icon: Zap
    },
    pivote: { 
      gradient: 'from-red-500 to-red-600',
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      icon: Star
    }
  }

  const handleDelete = async () => {
    if (confirm(`¿Estás seguro de que quieres eliminar a ${player.name}?`)) {
      try {
        setLoadingDelete(true)
        await onDelete()
        onFeedback?.('Jugador eliminado', 'success')
      } catch (err) {
        console.error('Error deleting player:', err)
        onFeedback?.('Error al eliminar jugador', 'error')
      } finally {
        setLoadingDelete(false)
      }
    }
  }

  const handleSetCaptain = async () => {
    if (!player.is_captain) {
      if (confirm(`¿Quieres designar a ${player.name} como capitán del equipo?`)) {
        try {
          setLoadingCaptain(true)
          await onSetCaptain()
          onFeedback?.('Capitán actualizado', 'success')
        } catch (err) {
          console.error('Error setting captain:', err)
          onFeedback?.('Error al designar capitán', 'error')
        } finally {
          setLoadingCaptain(false)
        }
      }
    }
  }

  const currentPosition = player.position ? positionConfig[player.position] : null
  const PositionIcon = currentPosition?.icon || User

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`
        relative group cursor-pointer
        bg-gradient-to-br from-gray-800 to-gray-850 
        rounded-xl p-3 border-2 transition-all duration-300
        ${player.is_captain 
          ? 'border-yellow-500/60 shadow-md shadow-yellow-500/10' 
          : isHovered 
            ? 'border-blue-500/60 shadow-md shadow-blue-500/10' 
            : 'border-gray-700 hover:border-gray-600'
        }
        ${isHovered ? 'scale-[1.01] -translate-y-0.5' : ''}
      `}
    >
      {/* Captain Crown - Floating Animation */}
      <AnimatePresence>
        {player.is_captain && (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ 
              scale: 1, 
              rotate: 0,
              y: [0, -5, 0],
            }}
            exit={{ scale: 0, rotate: 45 }}
            transition={{ 
              duration: 0.5,
              y: { repeat: Infinity, duration: 2, ease: "easeInOut" }
            }}
            className="absolute -top-3 -right-3 z-10"
          >
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/30">
                <Crown className="h-4 w-4 text-white" />
              </div>
              <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-20"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="flex items-start justify-between mb-4">
        {/* Player Avatar */}
        <div className="relative">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="relative"
          >
            {player.photo_url ? (
              <img 
                src={player.photo_url} 
                alt={player.name}
                className={`
                  w-16 h-16 rounded-2xl object-cover 
                  border-3 transition-all duration-300
                  ${player.is_captain 
                    ? 'border-yellow-400 shadow-lg shadow-yellow-500/20' 
                    : 'border-gray-600 group-hover:border-blue-400'
                  }
                `}
              />
            ) : (
              <div className={`
                w-16 h-16 rounded-2xl flex items-center justify-center
                border-3 transition-all duration-300
                ${player.is_captain 
                  ? 'bg-yellow-500/20 border-yellow-400' 
                  : 'bg-gray-700 border-gray-600 group-hover:border-blue-400'
                }
              `}>
                <User className="h-8 w-8 text-gray-400" />
              </div>
            )}
            
            {/* Jersey Number Badge */}
            {player.jersey_number && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className="absolute -bottom-2 -right-2 w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg"
              >
                {player.jersey_number}
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowActions(!showActions)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all"
          >
            <MoreHorizontal className="h-5 w-5" />
          </motion.button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="absolute top-full right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-20 min-w-[140px]"
              >
                <button 
                  onClick={() => {
                    setShowActions(false)
                    // Edit functionality
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  <span>Editar</span>
                </button>
                <button 
                  onClick={() => {
                    setShowActions(false)
                    handleDelete()
                  }}
                  disabled={loadingDelete}
                  className="w-full flex items-center space-x-2 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                  {loadingDelete ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span>{loadingDelete ? 'Eliminando...' : 'Eliminar'}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Player Info */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1 truncate">
            {player.name}
          </h3>
          {player.is_captain && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <Crown className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-400">Capitán del Equipo</span>
            </motion.div>
          )}
        </div>

        {/* Position Badge */}
        {player.position && currentPosition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 + 0.3 }}
            className={`
              inline-flex items-center space-x-2 px-3 py-2 rounded-xl
              ${currentPosition.bg} ${currentPosition.text}
              border border-current/20
            `}
          >
            <PositionIcon className="h-4 w-4" />
            <span className="font-medium text-sm">{FUTSAL_POSITIONS[player.position]}</span>
          </motion.div>
        )}
      </div>

      {/* Captain Action - The Star Feature */}
      {!player.is_captain && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 + 0.4 }}
          className="mt-4"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSetCaptain}
            disabled={loadingCaptain}
            className={`
              w-full relative overflow-hidden
              bg-gradient-to-r from-yellow-500 to-yellow-600
              hover:from-yellow-400 hover:to-yellow-500
              text-white font-semibold py-3 px-4 rounded-xl
              transition-all duration-300 transform
              shadow-lg hover:shadow-yellow-500/25
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isHovered ? 'shadow-xl shadow-yellow-500/30' : ''}
            `}
          >
            {/* Background Animation */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
              initial={{ x: '-100%' }}
              animate={isHovered ? { x: '100%' } : { x: '-100%' }}
              transition={{ duration: 0.6 }}
            />
            
            <div className="relative flex items-center justify-center space-x-2">
              {loadingCaptain ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Asignando...</span>
                </>
              ) : (
                <>
                  <Crown className="h-5 w-5" />
                  <span>Nombrar Capitán</span>
                </>
              )}
            </div>
          </motion.button>
        </motion.div>
      )}

      {/* Click outside to close dropdown */}
      {showActions && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setShowActions(false)}
        />
      )}
    </motion.div>
  )
}

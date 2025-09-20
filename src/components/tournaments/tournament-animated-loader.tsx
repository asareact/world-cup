'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Users, Calendar, Target, Zap, Star, Award, Sparkles } from 'lucide-react'

const floatingIcons = [
  { icon: Trophy, color: 'text-yellow-400', delay: 0, size: 'h-12 w-12' },
  { icon: Users, color: 'text-blue-400', delay: 0.3, size: 'h-10 w-10' },
  { icon: Calendar, color: 'text-green-400', delay: 0.6, size: 'h-8 w-8' },
  { icon: Target, color: 'text-purple-400', delay: 0.9, size: 'h-9 w-9' },
  { icon: Award, color: 'text-red-400', delay: 1.2, size: 'h-7 w-7' },
  { icon: Star, color: 'text-pink-400', delay: 1.5, size: 'h-6 w-6' },
]

// Firework particle component
const FireworkParticle = ({ 
  x, 
  y, 
  delay = 0,
  color = 'text-yellow-400'
}: { 
  x: number; 
  y: number; 
  delay?: number;
  color?: string;
}) => (
  <motion.div
    className={`absolute ${color}`}
    initial={{ 
      x: `${x}vw`, 
      y: `${y}vh`,
      opacity: 0,
      scale: 0
    }}
    animate={{ 
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      y: [`${y}vh`, `${y - 10}vh`, `${y - 20}vh`]
    }}
    transition={{ 
      duration: 1.5,
      delay,
      repeat: Infinity,
      repeatDelay: 4 + Math.random() * 3
    }}
  >
    <Sparkles className="h-4 w-4" />
  </motion.div>
)

export function TournamentAnimatedLoader({ 
  tournamentName,
  onComplete
}: { 
  tournamentName: string
  onComplete: () => void
}) {
  const [isVisible, setIsVisible] = useState(true)
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number}>>([])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, 500)
    }, 3500)

    // Generate random particles for background effect
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100
    }))
    setParticles(newParticles)

    return () => clearTimeout(timer)
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-950 to-black overflow-hidden">
      {/* Fireworks in corners */}
      <FireworkParticle x={5} y={5} delay={0} color="text-yellow-400" />
      <FireworkParticle x={95} y={5} delay={0.5} color="text-blue-400" />
      <FireworkParticle x={5} y={95} delay={1} color="text-green-400" />
      <FireworkParticle x={95} y={95} delay={1.5} color="text-purple-400" />
      <FireworkParticle x={20} y={10} delay={2} color="text-pink-400" />
      <FireworkParticle x={80} y={10} delay={2.5} color="text-red-400" />
      <FireworkParticle x={20} y={90} delay={3} color="text-cyan-400" />
      <FireworkParticle x={80} y={90} delay={3.5} color="text-orange-400" />

      {/* Animated background particles */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-white rounded-full opacity-20"
            initial={{ 
              x: `${particle.x}vw`, 
              y: `${particle.y}vh`,
              scale: 0
            }}
            animate={{ 
              y: [`${particle.y}vh`, `${particle.y - 20}vh`, `${particle.y}vh`],
              scale: [0, 1, 0],
              opacity: [0, 0.7, 0]
            }}
            transition={{ 
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      <div className="text-center max-w-2xl px-4 relative z-10">
        {/* Pulsing ring effect */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0, 0.3, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-64 h-64 rounded-full bg-gradient-to-r from-green-500 to-blue-500 opacity-20 blur-xl" />
        </motion.div>

        {/* Floating Icons Animation with better effects */}
        <div className="relative h-40 mb-8 flex items-center justify-center">
          {floatingIcons.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={index}
                className={`absolute ${item.color}`}
                initial={{ 
                  y: 50, 
                  opacity: 0,
                  rotate: 0
                }}
                animate={{ 
                  y: [50, -30, 50],
                  opacity: [0, 1, 0],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 3,
                  delay: item.delay,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              >
                <Icon className={item.size} />
              </motion.div>
            )
          })}
          
          {/* Central zap effect */}
          <motion.div
            className="absolute"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.2, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0.5
            }}
          >
            <Zap className="h-8 w-8 text-yellow-400" />
          </motion.div>
        </div>

        {/* Tournament Name with staggered letter animation - larger and more prominent */}
        <div className="mb-6">
          <motion.h1 
            className="text-5xl md:text-6xl font-bold text-white mb-4"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.05
                }
              }
            }}
          >
            {(tournamentName).split('').map((char, index) => (
              <motion.span
                key={index}
                className="inline-block"
                variants={{
                  hidden: { opacity: 0, y: 50, rotate: -5 },
                  visible: { 
                    opacity: 1, 
                    y: 0, 
                    rotate: 0,
                    transition: { 
                      type: "spring", 
                      damping: 15, 
                      stiffness: 300 
                    }
                  }
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            ))}
          </motion.h1>
        </div>

        {/* Welcome Text with fade in */}
        <motion.p 
          className="text-2xl md:text-3xl text-gray-300 mb-8 font-medium"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          Bienvenido al torneo
        </motion.p>

        {/* Enhanced Animated Progress Bar */}
        <motion.div 
          className="w-full max-w-md mx-auto bg-gray-800 rounded-full h-4 mb-8 overflow-hidden shadow-lg"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '100%', opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <motion.div 
            className="h-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ 
              duration: 2, 
              delay: 1.5,
              ease: "easeInOut"
            }}
          >
            {/* Glowing effect on progress bar */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" 
                 style={{ 
                   background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                   transform: 'translateX(-100%)',
                   animation: 'shimmer 2s infinite'
                 }} 
            />
          </motion.div>
        </motion.div>

        {/* Enhanced Loading Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 2.5 }}
        >
          <div className="text-gray-400 flex items-center justify-center text-lg">
            <span className="mr-2">Preparando experiencia del torneo</span>
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-3 w-3 bg-green-500 rounded-full"
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 1.5,
                    delay: 2.7 + i * 0.2,
                    repeat: Infinity 
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { db } from './database'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, userData?: Record<string, string>) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  updateProfile: (updates: { full_name?: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Clean up implicit OAuth hash to avoid exposing tokens in URL
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
    }
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        // After sign-in, if we had an implicit hash, ensure the URL is clean
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const getBaseUrl = () => {
    // If running in browser, detect host; force localhost for local/private IPs
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1'
      const isPrivateIP = /^10\./.test(hostname) || /^192\.168\./.test(hostname) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
      if (isLocalHost || isPrivateIP) return 'http://localhost:3000'
    }
    // Production or SSR: prefer env/site vars
    const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
    const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
    const browserOrigin = typeof window !== 'undefined' ? window.location.origin : undefined
    return envUrl || vercelUrl || browserOrigin || 'https://world-cup-weld.vercel.app'
  }

  const signUp = async (email: string, password: string, userData?: Record<string, string>) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: `${getBaseUrl()}/auth/callback`
      }
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const signInWithGoogle = async () => {
    const next = typeof window !== 'undefined' ? window.location.pathname : '/'
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${getBaseUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
        queryParams: { prompt: 'select_account' }
      }
    })
    return { error }
  }

  const updateProfile = async (updates: { full_name?: string }) => {
    if (!user) return

    try {
      // Actualizar el perfil en la base de datos
      const profileData = await db.updateProfile(user.id, updates)
      
      // También actualizar los metadatos del usuario en Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          ...(updates.full_name !== undefined && { full_name: updates.full_name })
        }
      })
      
      if (authError) {
        console.error('Error updating auth metadata:', authError)
        // No lanzamos error aquí porque la actualización del perfil ya tuvo éxito
        // Solo registramos el error en la consola
      }
      
      // Actualizar el estado local del usuario
      setUser(prevUser => {
        if (!prevUser) return null
        return {
          ...prevUser,
          user_metadata: {
            ...prevUser.user_metadata,
            ...(updates.full_name !== undefined && { full_name: updates.full_name })
          }
        }
      })
      
      return profileData
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

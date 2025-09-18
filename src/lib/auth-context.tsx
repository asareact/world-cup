'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { createClient } from './supabase/client'
import { apiClient } from './api'


type UserRole = 'superAdmin' | 'capitan' | 'invitado'

function normalizeRole(value: unknown): UserRole {
  if (typeof value !== 'string') return 'invitado'
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, '')

  if (normalized === 'superadmin') return 'superAdmin'
  if (normalized === 'capitan') return 'capitan'
  return 'invitado'
}

function deriveRole(profileRole?: unknown, metadataRole?: unknown): UserRole {
  const profileDerived = normalizeRole(profileRole)
  if (profileDerived !== 'invitado') {
    return profileDerived
  }
  return normalizeRole(metadataRole)
}

const supabase = createClient()

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  role: UserRole
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
  const [role, setRole] = useState<UserRole>('invitado')

  const loadUserRole = async (currentUser: User | null) => {
    if (!currentUser) {
      setRole('invitado')
      return
    }

    try {
      const profile = await apiClient.getProfile()
      setRole(deriveRole(profile?.role, currentUser.user_metadata?.role))
    } catch (error) {
      console.error('[Auth] failed to load profile via API:', error)
      setRole(deriveRole(undefined, currentUser.user_metadata?.role))
    }
  }

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
      await loadUserRole(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        await loadUserRole(session?.user ?? null)
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
      await apiClient.updateProfile(updates)
      
      // TambiÃ©n actualizar los metadatos del usuario en Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          ...(updates.full_name !== undefined && { full_name: updates.full_name })
        }
      })
      
      if (authError) {
        console.error('Error updating auth metadata:', authError)
        // No lanzamos error aquÃ­ porque la actualizaciÃ³n del perfil ya tuvo Ã©xito
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
      
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  const value = {
    user,
    session,
    loading,
    role,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    updateProfile
  }

  // Debug: log user role in development
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Auth] user role:', role, 'user:', user?.id)
    }
  }, [role, user])

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




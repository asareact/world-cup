'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState('Procesando inicio de sesión...')

  useEffect(() => {
    const handleAuth = async () => {
      const code = searchParams.get('code')
      const next = searchParams.get('next') || '/'
      const error = searchParams.get('error') || searchParams.get('error_description')

      if (error) {
        router.replace('/auth/auth-code-error')
        return
      }

      // Listen for implicit flow sign-in event
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN') {
          router.replace(next)
        }
      })

      if (code) {
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) throw exchangeError
          router.replace(next)
        } catch (e) {
          console.error('OAuth exchange error:', e)
          setMessage('No se pudo completar el inicio de sesión. Redirigiendo...')
          router.replace('/auth/auth-code-error')
        }
      } else {
        // Fallback: if no code, check if a session is already present (implicit flow)
        const { data: { session } } = await supabase.auth.getSession()
        if (session) router.replace(next)
      }

      return () => subscription.unsubscribe()
    }

    handleAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-800 border border-gray-700 rounded-2xl p-6 text-center">
        <p className="text-white">{message}</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-800 border border-gray-700 rounded-2xl p-6 text-center">
          <p className="text-white">Procesando inicio de sesión...</p>
        </div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}

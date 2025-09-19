// src/app/test-profile/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type ProfileTestResult = {
  success: boolean
  data?: unknown
  status?: number
  error?: string
}

export default function TestProfilePage() {
  const [result, setResult] = useState<ProfileTestResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const testProfileAPI = async () => {
      try {
        const response = await fetch('/api/profile')
        const data = await response.json()
        setResult({ success: response.ok, data, status: response.status })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setResult({ success: false, error: message })
      } finally {
        setLoading(false)
      }
    }

    testProfileAPI()
  }, [])

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Profile API Test</h1>
      
      {result?.data && typeof result.data === 'object' && 'error' in (result.data as Record<string, unknown>) && (result.data as Record<string, unknown>).error === 'Unauthorized' ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Authentication Required</h2>
          <p className="text-yellow-700 mb-3">
            You need to be signed in to access the profile API. Please sign in first and then try again.
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Homepage to Sign In
          </Link>
        </div>
      ) : null}
      
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  )
}


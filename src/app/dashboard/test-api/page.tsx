// src/app/dashboard/test-api/page.tsx
'use client'

import { useEffect, useState } from 'react'

type ProfileResult = {
  success: boolean
  data: unknown
  status: number
  statusText: string
  headers: Record<string, string>
}

export default function TestApiPage() {
  const [result, setResult] = useState<ProfileResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)

        console.log('Making request to /api/profile')

        const response = await fetch('/api/profile')
        const data = await response.json()

        setResult({
          success: response.ok,
          data,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message || 'Error fetching profile')
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  if (loading) {
    return <div className="p-4">Loading profile...</div>
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Profile API Test - Error</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Profile API Test - Result</h1>
      <div className="bg-gray-100 border border-gray-400 text-gray-700 px-4 py-3 rounded">
        <pre className="whitespace-pre-wrap text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  )
}


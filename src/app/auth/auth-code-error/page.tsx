'use client'

import Link from 'next/link'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-800 border border-gray-700 rounded-2xl p-6 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">No se pudo completar el ingreso</h1>
        <p className="text-gray-300 mb-6">
          Ocurrió un problema al validar el inicio de sesión. Inténtalo de nuevo.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}


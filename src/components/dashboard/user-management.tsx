"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth-context'

const USER_ROLE_OPTIONS = ['superAdmin', 'capitan', 'invitado', 'arbitro'] as const;
type UserRoleOption = typeof USER_ROLE_OPTIONS[number];

interface AdminUserProfile {
  id: string
  email: string | null
  full_name: string | null
  role: UserRoleOption
  created_at?: string | null
  updated_at?: string | null
}

interface ApiUsersResponse {
  users?: AdminUserProfile[]
  error?: string
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages?: number
  }
}

interface ApiUserResponse {
  user?: AdminUserProfile
  error?: string
}

const roleLabels: Record<UserRoleOption, string> = {
  superAdmin: 'Super admin',
  capitan: 'Capitan',
  invitado: 'Invitado',
  arbitro: 'Arbitro'
}

const PAGE_SIZE = 10

type ManagedUser = AdminUserProfile

export function UserManagement() {
  const { role: currentRole, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingUserId, setSavingUserId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total])


  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
    }, 400)

    return () => clearTimeout(handler)
  }, [searchTerm])

  useEffect(() => {
    if (page !== 1) {
      setPage(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const fetchUsers = useCallback(async () => {
    if (currentRole !== 'superAdmin') return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE)
      })
      if (debouncedSearch) {
        params.set('search', debouncedSearch)
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: { Accept: 'application/json' }
      })
      const payload: ApiUsersResponse = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || 'No se pudieron cargar los usuarios')
      }

      setUsers(payload.users ?? [])
      const totalValue = payload.pagination?.total ?? payload.users?.length ?? 0
      setTotal(totalValue)

      const serverPage = payload.pagination?.page
      if (typeof serverPage === 'number' && serverPage !== page) {
        setPage(serverPage)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido al cargar usuarios'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [currentRole, page, debouncedSearch])

  useEffect(() => {
    if (!authLoading && currentRole === 'superAdmin') {
      void fetchUsers()
    }
  }, [authLoading, currentRole, fetchUsers])

  const handleRoleChange = useCallback(async (userId: string, newRole: UserRoleOption) => {
    setSavingUserId(userId)
    setError(null)
    setFeedback(null)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      })

      const payload: ApiUserResponse = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error || 'No se pudo actualizar el rol')
      }

      if (!payload.user) {
        throw new Error('Respuesta invalida del servidor')
      }

      await fetchUsers()
      setFeedback('Rol actualizado correctamente')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido al actualizar el rol'
      setError(message)
    } finally {
      setSavingUserId(null)
      setTimeout(() => setFeedback(null), 3000)
    }
  }, [fetchUsers])

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const emailA = a.email ?? ''
      const emailB = b.email ?? ''
      return emailA.localeCompare(emailB)
    })
  }, [users])

  if (!authLoading && currentRole !== 'superAdmin') {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 text-gray-300">
        No tienes permisos para ver la gestion de usuarios.
      </div>
    )
  }

  const startItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const endItem = total === 0 ? 0 : Math.min(page * PAGE_SIZE, total)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestion de usuarios</h1>
          <p className="text-gray-400">Asigna roles a los miembros de la plataforma</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            className="w-full sm:w-64 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Buscar por correo o nombre"
            aria-label="Buscar usuarios"
            autoComplete="off"
          />
          <button
            onClick={() => void fetchUsers()}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
            disabled={loading}
          >
            Recargar
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-800 text-red-300 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {feedback && !error && (
        <div className="bg-green-900/40 border border-green-800 text-green-300 px-4 py-3 rounded-xl">
          {feedback}
        </div>
      )}

      <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Correo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Rol actual</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">Asignar rol</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-400" colSpan={4}>
                    Cargando usuarios...
                  </td>
                </tr>
              ) : sortedUsers.length === 0 ? (
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-400" colSpan={4}>
                    No hay usuarios que coincidan con la busqueda.
                  </td>
                </tr>
              ) : (
                sortedUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-900/70 transition">
                    <td className="px-6 py-4 text-sm text-gray-200">
                      {user.email || 'Sin correo'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-200">
                      {user.full_name || 'Sin nombre'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {roleLabels[user.role] ?? user.role}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-200">
                      <select
                        value={user.role}
                        onChange={event => handleRoleChange(user.id, event.target.value as UserRoleOption)}
                        disabled={savingUserId === user.id}
                        className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60"
                      >
                        {USER_ROLE_OPTIONS.map(role => (
                          <option key={role} value={role}>
                            {roleLabels[role]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-400">
        <div>
          {loading ? 'Actualizando listado...' : `Mostrando ${startItem}-${endItem} de ${total}`}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={loading || page <= 1}
            className="px-3 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition"
          >
            Anterior
          </button>
          <span className="text-gray-300">Pagina {page} de {totalPages}</span>
          <button
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={loading || page >= totalPages}
            className="px-3 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  )
}

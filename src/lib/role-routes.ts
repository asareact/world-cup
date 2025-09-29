export const INVITADO_PUBLIC_TOURNAMENT_ROUTE = '/tournaments/876ed720-2b58-4e02-a459-7381ea0691cb/public?section=overview'

const DEFAULT_ROUTE_BY_ROLE = {
  superAdmin: '/dashboard',
  capitan: '/dashboard/my-team',
  invitado: INVITADO_PUBLIC_TOURNAMENT_ROUTE,
  arbitro: '/dashboard/matches',
} as const

type RoleKey = keyof typeof DEFAULT_ROUTE_BY_ROLE

export function getDefaultRouteForRole(role?: string | null) {
  if (!role) return INVITADO_PUBLIC_TOURNAMENT_ROUTE
  if ((role as RoleKey) in DEFAULT_ROUTE_BY_ROLE) {
    return DEFAULT_ROUTE_BY_ROLE[role as RoleKey]
  }
  return INVITADO_PUBLIC_TOURNAMENT_ROUTE
}

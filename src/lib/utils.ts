import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function toDate(value: string | number | Date) {
  return value instanceof Date ? value : new Date(value)
}

export function formatDate(value?: string | number | Date | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return ''
  // Use Cuba's timezone for display
  return new Intl.DateTimeFormat('es-ES', { timeZone: 'America/Havana', day: '2-digit', month: '2-digit', year: 'numeric', ...options }).format(toDate(value))
}

export function formatDateCuba(value?: string | number | Date | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return ''
  // Specifically format using Cuba's timezone
  return new Intl.DateTimeFormat('es-ES', { timeZone: 'America/Havana', day: '2-digit', month: '2-digit', year: 'numeric', ...options }).format(toDate(value))
}

export function formatDateTime(value?: string | number | Date | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return ''
  // Use Cuba's timezone for display
  return new Intl.DateTimeFormat('es-ES', { timeZone: 'America/Havana', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', ...options }).format(toDate(value))
}

export function formatDateTimeCuba(value?: string | number | Date | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return ''
  // Specifically format using Cuba's timezone
  return new Intl.DateTimeFormat('es-ES', { timeZone: 'America/Havana', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', ...options }).format(toDate(value))
}

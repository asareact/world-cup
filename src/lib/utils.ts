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
  return new Intl.DateTimeFormat('es-ES', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric', ...options }).format(toDate(value))
}

export function formatDateTime(value?: string | number | Date | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return ''
  return new Intl.DateTimeFormat('es-ES', { timeZone: 'UTC', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', ...options }).format(toDate(value))
}

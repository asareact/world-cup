import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

function parseCookies(header: string | null) {
  if (!header) return []

  return header
    .split(';')
    .map(cookie => {
      const [name, ...valueParts] = cookie.trim().split('=')
      const value = valueParts.join('=')
      return { name, value: decodeURIComponent(value || '') }
    })
    .filter(cookie => cookie.name && cookie.value)
}

export async function createClient() {
  // Dynamically import cookies to avoid issues with top-level imports
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // The setAll method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            console.debug('[Supabase] Skipped setting cookies in server component context', error)
          }
        },
      },
    }
  )
}

// For use in middleware where we can't use next/headers
export function createMiddlewareClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookies(request.headers.get('cookie'))
        },
        setAll(cookiesToSet) {
          // Set cookies in the response
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )
}

export function createRouteClient(request: NextRequest) {
  const pendingCookies: { name: string; value: string; options?: CookieOptions }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookies(request.headers.get('cookie'))
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            pendingCookies.push({ name, value, options })
          })
        },
      },
    }
  )

  const applyCookies = (response: NextResponse) => {
    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })
  }

  return { supabase, applyCookies }
}





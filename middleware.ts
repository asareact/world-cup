import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  // Create an updated response object
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create a Supabase client with proper cookie handling
  const supabase = createMiddlewareClient(request, response)

  // Get the user to verify authentication
  const { data: { user }, error } = await supabase.auth.getUser()
  
  // Log for debugging
  console.log('Middleware auth check:', { 
    user: user?.id, 
    error, 
    cookies: request.cookies.getAll().length,
    pathname: request.nextUrl.pathname
  })

  // Protect the profile API route
  if (!user) {
    // Return unauthorized response for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Unauthorized',
          message: 'Authentication required' 
        }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }
    
    // For protected dashboard routes, redirect to login
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/api/profile',
  ],
}
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC = ['/', '/esqueci-senha', '/redefinir-senha', '/auth']
const isPublic = (p: string) => PUBLIC.some((x) => p === x || (x !== '/' && p.startsWith(x + '/')))

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.next()

  let response = NextResponse.next({ request })
  const sessionOnly = request.cookies.get('sementes_remember')?.value === '0'

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        list.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, sessionOnly ? { ...options, maxAge: undefined, expires: undefined } : options),
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  if (!user && !isPublic(path)) {
    const to = request.nextUrl.clone()
    to.pathname = '/'
    to.search = ''
    return NextResponse.redirect(to)
  }
  if (user && path === '/') {
    const to = request.nextUrl.clone()
    to.pathname = '/dashboard'
    return NextResponse.redirect(to)
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}

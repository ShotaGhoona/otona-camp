import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isAuth = !!token
  const isAuthPage = request.nextUrl.pathname === '/login'

  if (isAuthPage) {
    if (isAuth) {
      // ログイン済みの場合はチーム選択ページへリダイレクト
      return NextResponse.redirect(new URL('/team-select', request.url))
    }
    return null
  }

  if (!isAuth) {
    // 未ログインの場合はログインページへリダイレクト
    let from = request.nextUrl.pathname
    if (request.nextUrl.search) {
      from += request.nextUrl.search
    }

    return NextResponse.redirect(
      new URL(`/login?from=${encodeURIComponent(from)}`, request.url)
    )
  }
}

// 保護するページのパスを指定
export const config = {
  matcher: [
    '/team-select',
    '/team-setup',
    '/questions/:path*',
    '/scoreboard',
    '/gamemaster/:path*'
  ]
}
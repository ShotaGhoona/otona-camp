import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const isAuth = !!token
  const isAuthPage = request.nextUrl.pathname === '/login'
  const isTeamSelectPage = request.nextUrl.pathname === '/team-select'
  const isTeamSetupPage = request.nextUrl.pathname === '/team-setup'

  // デバッグ用ログ（本番では削除）
  console.log('Middleware:', {
    pathname: request.nextUrl.pathname,
    isAuth,
    hasToken: !!token,
    teamId: token?.teamId
  })

  // ログインページの処理
  if (isAuthPage) {
    if (isAuth && token?.teamId) {
      // 完全ログイン済み（チーム情報もあり）の場合は問題ページへ
      console.log('Redirecting to /questions')
      return NextResponse.redirect(new URL('/questions', request.url))
    } else if (isAuth) {
      // 部分ログイン（チーム情報なし）の場合はチーム選択ページへ
      console.log('Redirecting to /team-select')
      return NextResponse.redirect(new URL('/team-select', request.url))
    }
    return null
  }

  // チーム選択・作成ページの処理
  if (isTeamSelectPage || isTeamSetupPage) {
    if (!isAuth) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // 既にチーム情報がある場合は問題ページへ
    if (token.teamId) {
      return NextResponse.redirect(new URL('/questions', request.url))
    }
    return null
  }

  // その他の保護されたページの処理
  if (!isAuth) {
    let from = request.nextUrl.pathname
    if (request.nextUrl.search) {
      from += request.nextUrl.search
    }

    return NextResponse.redirect(
      new URL(`/login?from=${encodeURIComponent(from)}`, request.url)
    )
  }

  // チーム情報がない場合はチーム選択ページへ
  if (!token?.teamId) {
    return NextResponse.redirect(new URL('/team-select', request.url))
  }
}

// 保護するページのパスを指定
export const config = {
  matcher: [
    '/login',
    '/team-select',
    '/team-setup',
    '/questions/:path*',
    '/scoreboard',
    '/gamemaster/:path*'
  ]
}
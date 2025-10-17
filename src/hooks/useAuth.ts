'use client'

import { useSession } from 'next-auth/react'

export function useAuth() {
  const { data: session, status } = useSession()

  // セッションIDがあれば認証済み（チーム情報は問わない）
  const isAuthenticated = !!session?.user?.id
  // 完全認証済み（チーム情報も含む）
  const isFullyAuthenticated = !!session?.user?.id && !!session?.user?.teamId
  const isLoading = status === 'loading'

  return { 
    memberId: session?.user?.id || null,
    teamId: session?.user?.teamId || null,
    memberName: session?.user?.name || null,
    teamName: session?.user?.teamName || null,
    teamColor: session?.user?.teamColor || null,
    teamScore: session?.user?.teamScore || 0,
    isAuthenticated, 
    isFullyAuthenticated,
    isLoading 
  }
}
'use client'

import { useSession } from 'next-auth/react'
import { getMemberId, getTeamId } from '@/lib/session'

export function useAuth() {
  const { data: session, status } = useSession()
  
  // セッションから情報を取得、またはローカルストレージから取得（移行期間のため）
  const memberId = session?.user?.id || getMemberId()
  const teamId = session?.user?.teamId || getTeamId()

  return {
    memberId,
    teamId,
    isAuthenticated: status === 'authenticated' || !!memberId,
    isLoading: status === 'loading'
  }
}
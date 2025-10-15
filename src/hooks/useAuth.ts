'use client'

import { useEffect, useState } from 'react'
import { getMemberId, getTeamId } from '@/lib/session'

export function useAuth() {
  const [memberId, setMemberId] = useState<string | null>(null)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setMemberId(getMemberId())
    setTeamId(getTeamId())
    setIsLoading(false)
  }, [])

  const isAuthenticated = !!memberId && !!teamId

  return { memberId, teamId, isAuthenticated, isLoading }
}
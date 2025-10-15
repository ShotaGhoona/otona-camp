'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { setSession } from '@/lib/session'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Header } from '@/components/layout/Header'

interface Team {
  id: string
  name: string
  color: string
  member_count: number
  score: number
}

export default function TeamSelectPage() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState<string | null>(null)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const name = localStorage.getItem('temp_name')
    if (!name) {
      router.push('/login')
      return
    }
    setUserName(name)
    fetchTeams()
  }, [router])

  const fetchTeams = async () => {
    try {
      const response = await apiClient('/api/teams')
      const data = await response.json()
      setTeams(data.teams || [])
    } catch (error) {
      alert('チーム一覧の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinTeam = async (teamId: string) => {
    setJoining(teamId)
    try {
      const response = await apiClient('/api/members', {
        method: 'POST',
        body: JSON.stringify({
          name: userName,
          team_id: teamId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to join team')
      }

      const member = await response.json()
      
      // セッションに保存
      setSession(member.id, member.team_id)
      localStorage.removeItem('temp_name')
      
      // 問題一覧へ
      router.push('/questions')
    } catch (error) {
      alert('チームへの参加に失敗しました')
      setJoining(null)
    }
  }

  const handleCreateTeam = () => {
    router.push('/team-setup')
  }


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="p-4 max-w-md mx-auto">
        <p className="text-center mb-6">
          ようこそ、{userName}さん
        </p>

        <Card className="mb-6">
          <CardContent className="p-4">
            <h2 className="font-semibold mb-4">既存のチームに参加</h2>
            <div className="space-y-3">
              {teams.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  チームがまだありません
                </p>
              ) : (
                teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => handleJoinTeam(team.id)}
                    disabled={joining !== null}
                    className="w-full p-3 border rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: team.color || '#888' }}
                      />
                      <span className="font-medium">{team.name}</span>
                      <span className="text-sm text-gray-500">
                        ({team.member_count}人)
                      </span>
                    </div>
                    {joining === team.id && (
                      <span className="text-sm">参加中...</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center mb-4">または</div>

        <Button 
          onClick={handleCreateTeam}
          variant="outline"
          className="w-full"
          disabled={joining !== null}
        >
          新しいチームを作る
        </Button>
      </div>
    </div>
  )
}
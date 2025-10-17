'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface Team {
  id: string
  name: string
  color: string
  member_count: number
  score: number
}

export default function TeamSelectPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user) {
      fetchTeams()
    }
  }, [session])

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
    if (!session?.user?.name) return
    
    setJoining(teamId)
    try {
      // チームに参加するため、新しいセッションで再ログイン
      // NextAuthが自動的にメンバー作成を処理する
      const result = await signIn('credentials', {
        name: session.user.name,
        teamId: teamId,
        redirect: false,
      })

      if (result?.error) {
        throw new Error('Failed to join team')
      }

      // セッション更新後、問題ページへリダイレクト
      setTimeout(() => {
        window.location.href = '/questions'
      }, 100)
    } catch (error) {
      alert('チームへの参加に失敗しました')
      setJoining(null)
    }
  }

  const handleCreateTeam = () => {
    router.push('/team-setup')
  }

  const teamColors: Record<string, string> = {
    "#FF6B6B": "bg-[#FF6B6B]",
    "#4ECDC4": "bg-[#4ECDC4]",
    "#95E77D": "bg-[#95E77D]",
    "#FFE66D": "bg-[#FFE66D]",
    "#A78BFA": "bg-[#A78BFA]",
    "#FB923C": "bg-[#FB923C]",
  }

  if (!session?.user?.name) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/login')}
          >
            <i className="fas fa-arrow-left"></i>
          </Button>
          <h1 className="text-xl font-bold">チーム選択</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Welcome Message */}
        <div className="text-center py-4">
          <p className="text-lg">
            ようこそ、<span className="font-bold text-primary">{session.user.name}</span>さん
          </p>
        </div>

        {/* Existing Teams */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">既存のチームに参加</h2>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : teams.length > 0 ? (
            <div className="space-y-3">
              {teams.map((team) => (
                <Card
                  key={team.id}
                  className="p-4 border-l-4 hover:shadow-md active:shadow-lg cursor-pointer transition-all"
                  style={{ borderLeftColor: team.color }}
                  onClick={() => handleJoinTeam(team.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full ${teamColors[team.color] || 'bg-primary'} flex items-center justify-center`}
                      >
                        <i className="fas fa-users text-white"></i>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{team.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {team.member_count}人
                        </p>
                      </div>
                    </div>
                    {joining === team.id ? (
                      <span className="text-sm text-muted-foreground">参加中...</span>
                    ) : (
                      <i className="fas fa-chevron-right text-muted-foreground"></i>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <i className="fas fa-users text-4xl text-muted-foreground mb-3"></i>
              <p className="text-muted-foreground">まだチームがありません</p>
            </Card>
          )}
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-4 text-sm text-muted-foreground">
              または
            </span>
          </div>
        </div>

        {/* Create New Team */}
        <Button
          onClick={handleCreateTeam}
          className="w-full h-12 text-base font-semibold rounded-full"
          variant="outline"
          size="lg"
          disabled={joining !== null}
        >
          <i className="fas fa-plus mr-2"></i>
          新しいチームを作る
        </Button>
      </div>
    </div>
  )
}
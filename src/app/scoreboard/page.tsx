'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Trophy } from 'lucide-react'
import { Header } from '@/components/layout/Header'

interface TeamScore {
  rank: number
  team_id: string
  team_name: string
  team_color: string
  score: number
  member_count: number
}

interface ScoreboardData {
  teams: TeamScore[]
  total_questions: number
  completed_questions: number
}

export default function ScoreboardPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [scoreData, setScoreData] = useState<ScoreboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    } else if (isAuthenticated) {
      fetchScoreboard()
    }
  }, [authLoading, isAuthenticated, router])

  const fetchScoreboard = async () => {
    try {
      const response = await apiClient('/api/scoreboard')
      if (response.ok) {
        const data = await response.json()
        setScoreData(data)
      }
    } catch (error) {
      console.error('Failed to fetch scoreboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return null
    }
  }


  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">読み込み中...</div>
      </div>
    )
  }

  if (!scoreData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">データの取得に失敗しました</div>
      </div>
    )
  }

  const maxScore = Math.max(...scoreData.teams.map(t => t.score), 1)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="p-4 max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">【現在の順位】</h2>
          
          <div className="space-y-4">
            {scoreData.teams.map((team) => (
              <Card key={team.team_id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl">
                      {getRankIcon(team.rank) || `${team.rank}位`}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: team.team_color || '#888' }}
                        />
                        <span className="font-semibold">{team.team_name}</span>
                        <span className="text-sm text-gray-500">
                          ({team.member_count}人)
                        </span>
                      </div>
                      <div className="text-2xl font-bold mb-2">
                        {team.score} pt
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(team.score / maxScore) * 100}%`,
                            backgroundColor: team.team_color || '#3B82F6'
                          }}
                        />
                      </div>
                      <div className="text-sm text-gray-500 mt-1 text-right">
                        {Math.round((team.score / maxScore) * 100)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center text-gray-600">
          <p>進行状況: Q{scoreData.completed_questions}/{scoreData.total_questions} 完了</p>
        </div>
      </div>
    </div>
  )
}
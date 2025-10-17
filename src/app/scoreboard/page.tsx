'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

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
  const { teamId, isFullyAuthenticated, isLoading: authLoading } = useAuth()
  const [scoreData, setScoreData] = useState<ScoreboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isFullyAuthenticated) {
      router.push('/login')
    } else if (isFullyAuthenticated) {
      fetchScoreboard()
    }
  }, [authLoading, isFullyAuthenticated, router])

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

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { emoji: "🥇", color: "bg-chart-4 text-white" };
    if (rank === 2) return { emoji: "🥈", color: "bg-muted text-foreground" };
    if (rank === 3) return { emoji: "🥉", color: "bg-chart-5 text-white" };
    return null;
  };

  if (!isFullyAuthenticated) return null

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/questions')}
          >
            <i className="fas fa-arrow-left"></i>
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <i className="fas fa-trophy text-primary"></i>
            スコアボード
          </h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Game Progress */}
        {scoreData && (
          <Card className="p-6 text-center bg-gradient-to-br from-primary/10 to-transparent">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">ゲーム進行状況</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-bold text-primary">
                  {scoreData.completed_questions}
                </span>
                <span className="text-2xl text-muted-foreground">/</span>
                <span className="text-2xl text-muted-foreground">
                  {scoreData.total_questions}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">問完了</p>
            </div>
          </Card>
        )}

        {/* Rankings */}
        <div className="space-y-3">
          {loading ? (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </>
          ) : scoreData?.teams && scoreData.teams.length > 0 ? (
            <>
              {scoreData.teams.map((team) => {
                const badge = getRankBadge(team.rank);
                const isMyTeam = team.team_id === teamId;

                return (
                  <Card
                    key={team.team_id}
                    className={`
                      p-4 border-l-4 transition-all
                      ${isMyTeam ? 'bg-primary/5 ring-2 ring-primary/20' : ''}
                      ${team.rank <= 3 ? 'bg-gradient-to-r from-muted/30 to-transparent' : ''}
                    `}
                    style={{ borderLeftColor: team.team_color }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className="w-16 text-center">
                          {badge ? (
                            <Badge className={`${badge.color} text-2xl px-3 py-2`}>
                              {badge.emoji}
                            </Badge>
                          ) : (
                            <div className="text-2xl font-bold text-muted-foreground">
                              {team.rank}
                            </div>
                          )}
                        </div>

                        {/* Team Info */}
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: team.team_color }}
                          >
                            <i className="fas fa-users text-white"></i>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">
                                {team.team_name}
                              </h3>
                              {isMyTeam && (
                                <Badge variant="default" className="text-xs">
                                  あなた
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {team.member_count}人
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <div className="text-3xl font-bold text-primary">
                          {team.score}
                        </div>
                        <p className="text-xs text-muted-foreground">pt</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </>
          ) : (
            <Card className="p-12 text-center">
              <i className="fas fa-trophy text-5xl text-muted-foreground mb-4"></i>
              <p className="text-lg font-semibold mb-2">まだスコアがありません</p>
              <p className="text-sm text-muted-foreground">
                ゲームが進むとスコアが表示されます
              </p>
            </Card>
          )}
        </div>

        {/* Legend */}
        <Card className="p-4">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <i className="fas fa-trophy text-chart-4"></i>
              <span>1位</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-medal text-muted"></i>
              <span>2位</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-medal text-chart-5"></i>
              <span>3位</span>
            </div>
          </div>
        </Card>

        {/* Live Update Indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-chart-3 animate-pulse"></div>
          <span>リアルタイム更新中</span>
        </div>
      </div>
    </div>
  )
}
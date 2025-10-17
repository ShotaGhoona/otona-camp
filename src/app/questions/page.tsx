'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

interface Question {
  id: string
  title: string
  description: string | null
  question_type: string
  time_limit: number | null
  points: number
  status: 'draft' | 'active' | 'voting' | 'finished'
  created_at: string
  started_at: string | null
  answeredTeams?: number
  totalTeams?: number
}

interface TeamInfo {
  id: string
  name: string
  color: string
  score: number
}

interface MemberInfo {
  id: string
  name: string
  team: TeamInfo
}

const STATUS_CONFIG = {
  draft: {
    icon: "fa-lock",
    label: "準備中",
    color: "text-muted-foreground",
    disabled: true,
  },
  active: {
    icon: "fa-pencil",
    label: "回答中",
    color: "text-primary",
    disabled: false,
    pulse: true,
  },
  voting: {
    icon: "fa-check-to-slot",
    label: "投票中",
    color: "text-chart-3",
    disabled: false,
  },
  finished: {
    icon: "fa-circle-check",
    label: "完了",
    color: "text-muted-foreground",
    disabled: false,
  },
};

export default function QuestionsPage() {
  const router = useRouter()
  const { memberId, teamId, isFullyAuthenticated, isLoading: authLoading } = useAuth()
  const [questions, setQuestions] = useState<Question[]>([])
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isFullyAuthenticated) {
      router.push('/login')
    } else if (isFullyAuthenticated) {
      fetchData()
    }
  }, [authLoading, isFullyAuthenticated, router])

  const fetchData = async () => {
    try {
      // メンバー情報取得
      const memberRes = await apiClient('/api/members/me')
      if (memberRes.ok) {
        const memberData = await memberRes.json()
        setMemberInfo(memberData)
      }

      // 問題一覧取得
      const questionsRes = await apiClient('/api/questions')
      if (questionsRes.ok) {
        const questionsData = await questionsRes.json()
        setQuestions(questionsData.questions || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuestionClick = (questionId: string, status: string) => {
    if (status === 'draft') return;
    
    if (status === 'active') {
      router.push(`/questions/${questionId}/answer`);
    } else if (status === 'voting') {
      router.push(`/questions/${questionId}/vote`);
    } else if (status === 'finished') {
      router.push(`/questions/${questionId}/result`);
    }
  }

  const handleScoreboard = () => {
    router.push('/scoreboard')
  }

  if (!isFullyAuthenticated) return null

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="icon">
            <i className="fas fa-bars"></i>
          </Button>
          <h1 className="text-xl font-bold">問題一覧</h1>
          <Button variant="ghost" size="icon">
            <i className="fas fa-user-circle"></i>
          </Button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Team Info */}
        {memberInfo?.team && (
          <Card className="p-4 border-l-4" style={{ borderLeftColor: memberInfo.team.color }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: memberInfo.team.color }}
                >
                  <i className="fas fa-users text-white"></i>
                </div>
                <div>
                  <h2 className="font-semibold text-lg">{memberInfo.team.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    あなたのチーム
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {memberInfo.team.score}
                </div>
                <p className="text-xs text-muted-foreground">ポイント</p>
              </div>
            </div>
          </Card>
        )}

        {/* Questions List */}
        <div className="space-y-3">
          {loading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </>
          ) : questions.length > 0 ? (
            <>
              {questions.map((question, index) => {
                const config = STATUS_CONFIG[question.status as keyof typeof STATUS_CONFIG];
                
                return (
                  <Card
                    key={question.id}
                    className={`
                      p-4 border-l-4 transition-all
                      ${!config.disabled ? 'hover:shadow-md active:shadow-lg cursor-pointer' : 'opacity-60 cursor-not-allowed'}
                    `}
                    style={{
                      borderLeftColor: config.disabled ? 'var(--muted)' : 
                        question.status === 'active' ? 'var(--primary)' :
                        question.status === 'voting' ? 'var(--chart-3)' :
                        'var(--muted)'
                    }}
                    onClick={() => !config.disabled && handleQuestionClick(question.id, question.status)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <i className={`fas ${config.icon} ${config.color} text-xl mt-1 ${(config as any).pulse ? 'animate-pulse' : ''}`}></i>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base line-clamp-2">
                              Q{index + 1}: {question.title}
                            </h3>
                          </div>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {question.points}pt
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={config.color}>
                          {config.label}
                        </span>
                        {question.time_limit && question.status === 'active' && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              <i className="fas fa-clock mr-1"></i>
                              {Math.floor(question.time_limit / 60)}分
                            </span>
                          </>
                        )}
                        {question.status === 'active' && question.answeredTeams !== undefined && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              {question.answeredTeams}/{question.totalTeams} チーム回答済
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </>
          ) : (
            <Card className="p-12 text-center">
              <i className="fas fa-inbox text-5xl text-muted-foreground mb-4"></i>
              <p className="text-lg font-semibold mb-2">問題がありません</p>
              <p className="text-sm text-muted-foreground">
                ゲームマスターが問題を作成するまでお待ちください
              </p>
            </Card>
          )}
        </div>

        {/* Scoreboard Button */}
        <Button
          onClick={handleScoreboard}
          variant="outline"
          className="w-full h-12 text-base font-semibold rounded-full"
        >
          <i className="fas fa-trophy mr-2"></i>
          スコアボードを見る
        </Button>
      </div>
    </div>
  )
}
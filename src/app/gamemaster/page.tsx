'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

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
  finished_at: string | null
}

const STATUS_CONFIG = {
  draft: {
    icon: "fa-lock",
    label: "準備中",
    color: "text-muted-foreground",
  },
  active: {
    icon: "fa-pencil",
    label: "回答受付中",
    color: "text-primary",
    pulse: true,
  },
  voting: {
    icon: "fa-check-to-slot",
    label: "投票中",
    color: "text-chart-3",
  },
  finished: {
    icon: "fa-circle-check",
    label: "完了",
    color: "text-muted-foreground",
  },
};

export default function GameMasterPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const response = await apiClient('/api/questions')
      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || [])
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error)
      alert('問題一覧の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (questionId: string, newStatus: string) => {
    setUpdating(questionId)
    try {
      const response = await apiClient(`/api/questions/${questionId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to update status')
      }

      alert(`ステータスを${getStatusText(newStatus)}に更新しました`)
      await fetchQuestions()
    } catch (error: any) {
      alert(error.message || 'ステータスの更新に失敗しました')
    } finally {
      setUpdating(null)
    }
  }

  const getStatusText = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label || '不明'
  }

  const getNextStatus = (currentStatus: Question['status']): Question['status'] | null => {
    switch (currentStatus) {
      case 'draft':
        return 'active'
      case 'active':
        return 'voting'
      case 'voting':
        return 'finished'
      case 'finished':
        return null
      default:
        return null
    }
  }

  const handleCreateQuestion = () => {
    router.push('/gamemaster/questions/new')
  }

  const handleViewResults = (questionId: string) => {
    router.push(`/questions/${questionId}/result`)
  }

  const handleScoreboard = () => {
    router.push('/scoreboard')
  }

  const isGameActive = questions.some(q => q.status === 'active' || q.status === 'voting')

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="icon">
            <i className="fas fa-bars"></i>
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <i className="fas fa-gamepad text-primary"></i>
            ゲームマスター
          </h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Game Status */}
        <Card className="p-6 space-y-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <i className={`fas ${isGameActive ? 'fa-play' : 'fa-pause'} text-primary`}></i>
            </div>
            <div>
              <h2 className="text-lg font-semibold">ゲーム進行状況</h2>
              <p className="text-sm text-muted-foreground">
                {isGameActive ? 'ゲーム進行中' : '待機中'}
              </p>
            </div>
          </div>
          
          <Button 
            onClick={handleScoreboard}
            variant="outline"
            className="w-full h-12 text-base font-semibold rounded-full"
          >
            <i className="fas fa-trophy mr-2"></i>
            スコアボードを表示
          </Button>
        </Card>

        {/* Questions Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">問題管理</h2>
            <Button 
              onClick={handleCreateQuestion}
              size="sm"
              className="rounded-full"
            >
              <i className="fas fa-plus mr-2"></i>
              新規作成
            </Button>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : questions.length > 0 ? (
            <div className="space-y-3">
              {questions.map((question, index) => {
                const config = STATUS_CONFIG[question.status];
                const nextStatus = getNextStatus(question.status);
                
                return (
                  <Card
                    key={question.id}
                    className={`
                      p-4 space-y-4 border-l-4 transition-all
                      ${question.status === 'active' ? 'ring-2 ring-primary/20' : ''}
                    `}
                    style={{ borderLeftColor: config?.color?.replace('text-', 'var(--') + ')' }}
                  >
                    <div className="flex items-start gap-3">
                      <i className={`fas ${config?.icon} ${config?.color} text-xl mt-1 ${(config as any)?.pulse ? 'animate-pulse' : ''}`}></i>
                      <div className="flex-1">
                        <h3 className="font-semibold text-base">
                          Q{index + 1}: {question.title}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className={config?.color}>{config?.label}</span>
                          {question.time_limit && (
                            <>
                              <span>•</span>
                              <span>
                                <i className="fas fa-clock mr-1"></i>
                                {Math.floor(question.time_limit / 60)}分
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span>{question.points}pt</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {question.status === 'finished' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewResults(question.id)}
                          className="flex-1"
                        >
                          <i className="fas fa-chart-bar mr-1"></i>
                          結果を見る
                        </Button>
                      )}
                      
                      {nextStatus && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(question.id, nextStatus)}
                          disabled={updating === question.id}
                          className="flex-1 rounded-full"
                        >
                          {updating === question.id ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-1"></i>
                              更新中...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-arrow-right mr-1"></i>
                              次のフェーズへ
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <i className="fas fa-plus-circle text-5xl text-muted-foreground mb-4"></i>
              <p className="text-lg font-semibold mb-2">問題がありません</p>
              <p className="text-sm text-muted-foreground mb-4">
                最初の問題を作成しましょう
              </p>
              <Button onClick={handleCreateQuestion} className="rounded-full">
                <i className="fas fa-plus mr-2"></i>
                問題を作成
              </Button>
            </Card>
          )}
        </div>

        {/* Help Text */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <i className="fas fa-lightbulb text-chart-2 mt-1"></i>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">💡 ヒント</p>
              <p>問題を作成し、ステータスを変更してゲームを進行させます</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
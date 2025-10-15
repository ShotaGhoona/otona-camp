'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Menu, Plus, Play, CheckCircle, Users, Trophy } from 'lucide-react'
import { Header } from '@/components/layout/Header'

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

  const getStatusIcon = (status: Question['status']) => {
    switch (status) {
      case 'draft':
        return '🔒'
      case 'active':
        return '✏️'
      case 'voting':
        return '🗳️'
      case 'finished':
        return '✅'
      default:
        return '❓'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return '準備中'
      case 'active':
        return '回答受付中'
      case 'voting':
        return '投票中'
      case 'finished':
        return '完了'
      default:
        return '不明'
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBack={false} showMenu={true} />

      <div className="p-4 max-w-4xl mx-auto">
        {/* ゲーム進行管理 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              ゲーム進行管理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>現在の状態:</span>
                <span className="font-medium">
                  {questions.some(q => q.status === 'active' || q.status === 'voting') 
                    ? '⏸️ ゲーム進行中' 
                    : '⏹️ 待機中'}
                </span>
              </div>
              <Button 
                onClick={handleScoreboard}
                variant="outline"
                className="w-full"
              >
                <Trophy className="w-4 h-4 mr-2" />
                スコアボードを表示
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 問題管理 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                問題管理
              </CardTitle>
              <Button 
                onClick={handleCreateQuestion}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                新しい問題を作成
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {questions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  問題がまだありません
                </p>
              ) : (
                questions.map((question, index) => (
                  <Card key={question.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getStatusIcon(question.status)}</span>
                        <div className="flex-1">
                          <h3 className="font-medium">
                            Q{index + 1}: {question.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">ステータス:</span> {getStatusText(question.status)}
                            {question.time_limit && (
                              <span className="ml-3">
                                <span className="font-medium">制限時間:</span> {question.time_limit}秒
                              </span>
                            )}
                            <span className="ml-3">
                              <span className="font-medium">配点:</span> {question.points}pt
                            </span>
                          </p>
                          
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {/* 編集機能は後で実装 */}}
                              disabled
                            >
                              編集
                            </Button>
                            
                            {question.status === 'finished' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewResults(question.id)}
                              >
                                結果を見る
                              </Button>
                            )}
                            
                            {getNextStatus(question.status) && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(question.id, getNextStatus(question.status)!)}
                                disabled={updating === question.id}
                              >
                                {updating === question.id ? '更新中...' : '次のフェーズへ'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>💡 ヒント: 問題を作成し、ステータスを変更してゲームを進行させます</p>
        </div>
      </div>
    </div>
  )
}
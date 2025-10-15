'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Menu, User } from 'lucide-react'
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

export default function QuestionsPage() {
  const router = useRouter()
  const { memberId, teamId, isAuthenticated, isLoading: authLoading } = useAuth()
  const [questions, setQuestions] = useState<Question[]>([])
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    } else if (isAuthenticated) {
      fetchData()
    }
  }, [authLoading, isAuthenticated, router])

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

  const getStatusText = (status: Question['status']) => {
    switch (status) {
      case 'draft':
        return '準備中'
      case 'active':
        return '回答中'
      case 'voting':
        return '投票中'
      case 'finished':
        return '完了'
      default:
        return '不明'
    }
  }

  const handleQuestionClick = (question: Question) => {
    if (question.status === 'draft') return
    
    switch (question.status) {
      case 'active':
        router.push(`/questions/${question.id}/answer`)
        break
      case 'voting':
        router.push(`/questions/${question.id}/vote`)
        break
      case 'finished':
        router.push(`/questions/${question.id}/result`)
        break
    }
  }

  const handleScoreboard = () => {
    router.push('/scoreboard')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBack={false} showMenu={true} />

      <div className="p-4 max-w-2xl mx-auto">
        {memberInfo && (
          <div className="mb-4 p-4 bg-white rounded-lg shadow-sm flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: memberInfo.team.color || '#888' }}
              />
              <span className="font-medium">{memberInfo.team.name}</span>
            </div>
            <span className="text-lg font-bold">{memberInfo.team.score}pt</span>
          </div>
        )}

        <div className="space-y-3">
          {questions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              問題がまだありません
            </p>
          ) : (
            questions.map((question, index) => (
              <Card 
                key={question.id}
                className={`cursor-pointer transition-all ${
                  question.status === 'draft' 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleQuestionClick(question)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getStatusIcon(question.status)}</span>
                    <div className="flex-1">
                      <h3 className="font-medium">
                        Q{index + 1}: {question.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        ステータス: {getStatusText(question.status)}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {question.points}pt
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="mt-8">
          <Button 
            onClick={handleScoreboard}
            variant="outline"
            className="w-full"
          >
            スコアボードを見る
          </Button>
        </div>
      </div>
    </div>
  )
}
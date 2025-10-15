'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, CheckCircle, Ban, Image as ImageIcon } from 'lucide-react'
import { Header } from '@/components/layout/Header'

interface Question {
  id: string
  title: string
  description: string | null
  question_type: string
  points: number
  status: string
  my_voted: boolean
  total_votes: number
  total_members: number
}

interface Option {
  id: string
  team_id: string
  team_name: string
  team_color: string
  content: string | null
  image_url: string | null
  is_my_team: boolean
  vote_count?: number
}

interface VoteInfo {
  voted: boolean
  vote?: {
    id: string
    option_id: string
    option_content: string
    team_name: string
  }
}

export default function VotePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const questionId = use(params).id
  const { memberId, isAuthenticated, isLoading: authLoading } = useAuth()
  const [question, setQuestion] = useState<Question | null>(null)
  const [options, setOptions] = useState<Option[]>([])
  const [voteInfo, setVoteInfo] = useState<VoteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    } else if (isAuthenticated) {
      fetchData()
    }
  }, [authLoading, isAuthenticated, router, questionId])

  const fetchData = async () => {
    try {
      // 問題詳細取得
      const questionRes = await apiClient(`/api/questions/${questionId}`)
      if (!questionRes.ok) {
        throw new Error('Failed to fetch question')
      }
      const questionData = await questionRes.json()
      setQuestion(questionData)

      // ステータスチェック
      if (questionData.status !== 'voting') {
        router.push(`/questions/${questionId}/${questionData.status === 'active' ? 'answer' : 'result'}`)
        return
      }

      // 回答一覧取得
      const optionsRes = await apiClient(`/api/questions/${questionId}/options`)
      if (optionsRes.ok) {
        const optionsData = await optionsRes.json()
        setOptions(optionsData.options || [])
      }

      // 投票状態確認
      if (questionData.my_voted) {
        // APIがあればここで投票詳細を取得
        setVoteInfo({ voted: true })
      } else {
        setVoteInfo({ voted: false })
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      alert('データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (optionId: string) => {
    if (voteInfo?.voted) {
      alert('既に投票済みです')
      return
    }

    const option = options.find(o => o.id === optionId)
    if (option?.is_my_team) {
      alert('自分のチームには投票できません')
      return
    }

    setVoting(optionId)
    try {
      const response = await apiClient(`/api/questions/${questionId}/votes`, {
        method: 'POST',
        body: JSON.stringify({ option_id: optionId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to vote')
      }

      alert('投票しました！')
      await fetchData() // 再取得
    } catch (error: any) {
      alert(error.message || '投票に失敗しました')
    } finally {
      setVoting(null)
    }
  }


  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">読み込み中...</div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">問題が見つかりません</div>
      </div>
    )
  }

  const voteProgress = question.total_members > 0
    ? Math.round((question.total_votes / question.total_members) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentQuestion={1} totalQuestions={10} />

      <div className="p-4 max-w-2xl mx-auto">
        {/* ステップインジケーター */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full" />
              <span className="text-sm text-gray-500">回答</span>
            </div>
            <div className="h-px bg-gray-300 w-8" />
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-sm font-medium">投票</span>
            </div>
            <div className="h-px bg-gray-300 w-8" />
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full" />
              <span className="text-sm text-gray-500">結果</span>
            </div>
          </div>
          <p className="text-center text-sm text-gray-600">Step 2/3</p>
        </div>

        {/* 投票状態表示 */}
        {voteInfo?.voted ? (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-green-800">投票完了！</h3>
              </div>
              {voteInfo.vote && (
                <p className="text-sm text-gray-700">
                  あなたの投票: {voteInfo.vote.team_name} - {voteInfo.vote.option_content}
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-2">【投票してください】</h2>
              <p className="text-gray-700">どの回答が一番いい？</p>
            </CardContent>
          </Card>
        )}

        {/* 回答一覧 */}
        <div className="space-y-4">
          {options.map((option) => (
            <Card key={option.id} className={option.is_my_team ? 'opacity-75' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: option.team_color || '#888' }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">
                      {option.team_name}
                      {option.is_my_team && <span className="text-gray-500 ml-2">（自分）</span>}
                    </h3>
                    
                    {option.content && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <p className="whitespace-pre-wrap">{option.content}</p>
                      </div>
                    )}
                    
                    {option.image_url && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-gray-500" />
                          <a 
                            href={option.image_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            画像を表示
                          </a>
                        </div>
                      </div>
                    )}

                    {option.is_my_team ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        投票不可
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleVote(option.id)}
                        disabled={voteInfo?.voted || voting !== null}
                        className="w-full"
                      >
                        {voting === option.id ? '投票中...' : '投票する'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {options.length > 0 && (
          <p className="text-sm text-gray-500 text-center mt-4">
            ※自分のチームには投票できません
          </p>
        )}

        {/* 投票進捗 */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-2">
              他の人の投票状況:
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${voteProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 text-right">
              {question.total_votes}/{question.total_members}人
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
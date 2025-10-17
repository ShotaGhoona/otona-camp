'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

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
        // チーム名を匿名化し、ランダムに並び替え
        const anonymizedOptions = (optionsData.options || []).map((option: Option, index: number) => ({
          ...option,
          team_name: `チーム ${String.fromCharCode(65 + index)}`, // A, B, C, D...
          original_team_name: option.team_name // 元のチーム名を保持（内部用）
        }))
        setOptions(shuffleArray(anonymizedOptions))
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

  if (!isAuthenticated) return null

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
          <h1 className="text-base font-bold">
            Q{1}/{10}
          </h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Progress Steps */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <i className="fas fa-check text-muted-foreground text-sm"></i>
              </div>
              <span className="text-sm text-muted-foreground">回答</span>
            </div>
            <div className="flex-1 h-0.5 bg-primary mx-3"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <i className="fas fa-check text-primary-foreground text-sm"></i>
              </div>
              <span className="text-sm font-semibold text-primary">投票</span>
            </div>
            <div className="flex-1 h-0.5 bg-border mx-3"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center">
                <span className="text-sm text-muted-foreground">3</span>
              </div>
              <span className="text-sm text-muted-foreground">結果</span>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground">Step 2/3</p>
        </div>

        {/* Voting Instructions */}
        <Card className="p-6 space-y-2 border-l-4 border-l-chart-3">
          <h2 className="text-xl font-bold">【投票してください】</h2>
          <p className="text-muted-foreground">どの回答が一番いい？</p>
          <p className="text-xs text-muted-foreground">
            ※ チーム名は匿名化されています
          </p>
        </Card>

        {/* My Vote Status */}
        {voteInfo?.voted && (
          <Card className="p-4 bg-chart-3/10 border-chart-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-chart-3 flex items-center justify-center">
                <i className="fas fa-check text-white"></i>
              </div>
              <div>
                <p className="text-sm font-semibold text-chart-3">投票済み</p>
                <p className="text-sm text-muted-foreground">
                  投票が完了しました
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Options List */}
        <div className="space-y-4">
          {options.map((option, index) => (
            <Card
              key={option.id}
              className={`
                p-6 space-y-4 border-t-4 transition-all
                ${!option.is_my_team && !voteInfo?.voted ? 'hover:shadow-md active:shadow-lg cursor-pointer' : ''}
              `}
              style={{ borderTopColor: 'var(--muted)' }}
            >
              {/* Anonymous Team Name */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-sm font-bold text-muted-foreground">
                    {String.fromCharCode(65 + index)}
                  </span>
                </div>
                <h3 className="font-semibold text-lg">
                  {option.team_name}
                  {option.is_my_team && (
                    <Badge variant="secondary" className="ml-2">自分</Badge>
                  )}
                </h3>
              </div>

              {/* Answer Content */}
              <div className="p-4 bg-muted/30 rounded-lg">
                {option.image_url ? (
                  <img
                    src={option.image_url}
                    alt={`${option.team_name}の回答`}
                    className="w-full rounded-lg"
                  />
                ) : (
                  <p className="text-xl font-semibold text-center py-4">
                    {option.content}
                  </p>
                )}
              </div>

              {/* Vote Button */}
              {option.is_my_team ? (
                <Button
                  disabled
                  className="w-full"
                  variant="outline"
                >
                  <i className="fas fa-ban mr-2"></i>
                  投票不可（自分のチーム）
                </Button>
              ) : voteInfo?.voted ? (
                <Button
                  disabled
                  className="w-full"
                  variant="outline"
                >
                  投票済み
                </Button>
              ) : (
                <Button
                  onClick={() => handleVote(option.id)}
                  disabled={voting !== null}
                  className="w-full h-12 text-base font-semibold rounded-full"
                >
                  {voting === option.id ? '投票中...' : (
                    <>
                      <i className="fas fa-check-to-slot mr-2"></i>
                      投票する
                    </>
                  )}
                </Button>
              )}
            </Card>
          ))}
        </div>

        {!voteInfo?.voted && (
          <p className="text-sm text-muted-foreground text-center py-4">
            ※ 自分のチームには投票できません<br />
            ※ チーム名は匿名化されています
          </p>
        )}
      </div>
    </div>
  )
}
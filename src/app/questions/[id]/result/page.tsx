'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Trophy, Medal, Award, Image as ImageIcon } from 'lucide-react'
import { Header } from '@/components/layout/Header'

interface Question {
  id: string
  title: string
  points: number
  status: string
}

interface Result {
  rank: number
  option_id: string
  team_id: string
  team_name: string
  team_color: string
  content: string | null
  image_url: string | null
  vote_count: number
  points_earned: number
}

interface ResultsData {
  question: Question
  results: Result[]
  total_votes: number
}

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const questionId = use(params).id
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [resultsData, setResultsData] = useState<ResultsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    } else if (isAuthenticated) {
      fetchResults()
    }
  }, [authLoading, isAuthenticated, router, questionId])

  const fetchResults = async () => {
    try {
      const response = await apiClient(`/api/questions/${questionId}/results`)
      if (!response.ok) {
        const error = await response.json()
        if (error.error?.code === 'INVALID_STATUS') {
          // まだ結果が利用できない場合は適切なページへリダイレクト
          const questionRes = await apiClient(`/api/questions/${questionId}`)
          if (questionRes.ok) {
            const questionData = await questionRes.json()
            const redirectPath = questionData.status === 'active' ? 'answer' : 'vote'
            router.push(`/questions/${questionId}/${redirectPath}`)
            return
          }
        }
        throw new Error('Failed to fetch results')
      }
      const data = await response.json()
      setResultsData(data)
    } catch (error) {
      console.error('Failed to fetch results:', error)
      alert('結果の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-orange-600" />
      default:
        return null
    }
  }

  const getRankEmoji = (rank: number) => {
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


  const handleNextQuestion = () => {
    router.push('/questions')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">読み込み中...</div>
      </div>
    )
  }

  if (!resultsData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">結果が見つかりません</div>
      </div>
    )
  }

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
              <div className="w-3 h-3 bg-gray-300 rounded-full" />
              <span className="text-sm text-gray-500">投票</span>
            </div>
            <div className="h-px bg-gray-300 w-8" />
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-sm font-medium">結果</span>
            </div>
          </div>
          <p className="text-center text-sm text-gray-600">Step 3/3</p>
        </div>

        {/* 結果発表ヘッダー */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="p-6 text-center">
            <div className="text-3xl mb-2">🏆</div>
            <h2 className="text-2xl font-bold text-gray-800">結果発表！</h2>
            <p className="text-gray-600 mt-2">
              総投票数: {resultsData.total_votes}票
            </p>
          </CardContent>
        </Card>

        {/* ランキング */}
        <div className="space-y-4">
          {resultsData.results.map((result) => (
            <Card 
              key={result.option_id}
              className={result.rank === 1 ? 'border-yellow-400 shadow-lg' : ''}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <span className="text-2xl mb-1">
                      {getRankEmoji(result.rank) || `${result.rank}位`}
                    </span>
                    <span className="text-xl font-bold">{result.vote_count}票</span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: result.team_color || '#888' }}
                      />
                      <h3 className="font-semibold">{result.team_name}</h3>
                    </div>
                    
                    {result.content && (
                      <div className="mb-2 p-3 bg-gray-50 rounded-lg">
                        <p className="whitespace-pre-wrap">{result.content}</p>
                      </div>
                    )}
                    
                    {result.image_url && (
                      <div className="mb-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-gray-500" />
                          <a 
                            href={result.image_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            画像を表示
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {result.points_earned > 0 && (
                      <div className="mt-2 inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        +{result.points_earned}pt 獲得！
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 次の問題へボタン */}
        <div className="mt-8">
          <Button 
            onClick={handleNextQuestion}
            className="w-full"
            size="lg"
          >
            次の問題へ >>
          </Button>
        </div>
      </div>
    </div>
  )
}
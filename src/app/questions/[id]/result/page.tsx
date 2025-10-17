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

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { emoji: "🥇", color: "bg-chart-4 text-white" };
    if (rank === 2) return { emoji: "🥈", color: "bg-muted text-foreground" };
    if (rank === 3) return { emoji: "🥉", color: "bg-chart-5 text-white" };
    return null;
  };

  const handleNextQuestion = () => {
    router.push('/questions')
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
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <i className="fas fa-check text-muted-foreground text-sm"></i>
              </div>
              <span className="text-sm text-muted-foreground">投票</span>
            </div>
            <div className="flex-1 h-0.5 bg-primary mx-3"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <i className="fas fa-check text-primary-foreground text-sm"></i>
              </div>
              <span className="text-sm font-semibold text-primary">結果</span>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground">Step 3/3</p>
        </div>

        {/* Results Header */}
        <Card className="p-6 text-center bg-gradient-to-br from-chart-4/10 to-transparent">
          <div className="space-y-2">
            <i className="fas fa-trophy text-4xl text-chart-4"></i>
            <h2 className="text-2xl font-bold">結果発表！</h2>
            <p className="text-muted-foreground">
              総投票数: {resultsData?.total_votes || 0}票
            </p>
          </div>
        </Card>

        {/* Rankings */}
        <div className="space-y-4">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted/30 rounded-xl animate-pulse"></div>
              ))}
            </>
          ) : resultsData?.results && resultsData.results.length > 0 ? (
            <>
              {resultsData.results.map((result) => {
                const badge = getRankBadge(result.rank);
                
                return (
                  <Card
                    key={result.option_id}
                    className={`
                      p-6 space-y-4 border-l-4 transition-all
                      ${result.rank === 1 ? 'bg-gradient-to-r from-chart-4/10 to-transparent ring-2 ring-chart-4/20' : ''}
                    `}
                    style={{ borderLeftColor: result.team_color }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Rank and Votes */}
                      <div className="flex flex-col items-center gap-2">
                        {badge ? (
                          <Badge className={`${badge.color} text-2xl px-3 py-2`}>
                            {badge.emoji}
                          </Badge>
                        ) : (
                          <div className="text-2xl font-bold text-muted-foreground">
                            {result.rank}
                          </div>
                        )}
                        <div className="text-center">
                          <div className="text-xl font-bold text-primary">{result.vote_count}</div>
                          <div className="text-xs text-muted-foreground">票</div>
                        </div>
                      </div>

                      {/* Team Info and Content */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: result.team_color }}
                          >
                            <i className="fas fa-users text-white text-sm"></i>
                          </div>
                          <h3 className="font-semibold text-lg">{result.team_name}</h3>
                        </div>

                        {/* Answer Content */}
                        <div className="p-4 bg-muted/30 rounded-lg">
                          {result.image_url ? (
                            <img
                              src={result.image_url}
                              alt={`${result.team_name}の回答`}
                              className="w-full rounded-lg"
                            />
                          ) : result.content ? (
                            <p className="text-lg font-medium text-center py-2">
                              {result.content}
                            </p>
                          ) : (
                            <p className="text-center text-muted-foreground py-2">
                              回答なし
                            </p>
                          )}
                        </div>

                        {/* Points Earned */}
                        {result.points_earned > 0 && (
                          <div className="flex items-center justify-center">
                            <Badge className="bg-chart-2 text-white text-sm px-3 py-1">
                              <i className="fas fa-star mr-1"></i>
                              +{result.points_earned}pt 獲得！
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </>
          ) : (
            <Card className="p-12 text-center">
              <i className="fas fa-trophy text-5xl text-muted-foreground mb-4"></i>
              <p className="text-lg font-semibold mb-2">結果がありません</p>
              <p className="text-sm text-muted-foreground">
                結果の集計中です
              </p>
            </Card>
          )}
        </div>

        {/* Next Question Button */}
        <Button
          onClick={handleNextQuestion}
          className="w-full h-12 text-base font-semibold rounded-full"
          size="lg"
        >
          <i className="fas fa-arrow-right mr-2"></i>
          次の問題へ
        </Button>
      </div>
    </div>
  )
}
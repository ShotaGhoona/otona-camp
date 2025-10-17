'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { FileUpload } from '@/components/ui/file-upload'
import { uploadImage } from '@/lib/upload'

interface Question {
  id: string
  title: string
  description: string | null
  question_type: 'text' | 'image' | 'both'
  time_limit: number | null
  points: number
  status: string
  started_at: string | null
  my_team_answered: boolean
  total_teams: number
  answered_teams: number
}

interface Option {
  id: string
  team_id: string
  team_name: string
  team_color: string
  content: string | null
  image_url: string | null
  is_my_team: boolean
}

export default function AnswerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const questionId = use(params).id
  const { memberId, teamId, isAuthenticated, isLoading: authLoading } = useAuth()
  const [question, setQuestion] = useState<Question | null>(null)
  const [teamOption, setTeamOption] = useState<Option | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [answer, setAnswer] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    } else if (isAuthenticated) {
      fetchData()
    }
  }, [authLoading, isAuthenticated, router, questionId])

  useEffect(() => {
    if (question?.time_limit && question.started_at && question.status === 'active') {
      const interval = setInterval(() => {
        const startTime = new Date(question.started_at!).getTime()
        const now = new Date().getTime()
        const elapsed = Math.floor((now - startTime) / 1000)
        const remaining = question.time_limit! - elapsed
        
        if (remaining <= 0) {
          setTimeLeft(0)
          clearInterval(interval)
        } else {
          setTimeLeft(remaining)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [question])

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
      if (questionData.status !== 'active') {
        router.push(`/questions/${questionId}/${questionData.status === 'voting' ? 'vote' : 'result'}`)
        return
      }

      // 既存の回答取得
      const optionsRes = await apiClient(`/api/questions/${questionId}/options`)
      if (optionsRes.ok) {
        const optionsData = await optionsRes.json()
        const myOption = optionsData.options?.find((opt: Option) => opt.is_my_team)
        if (myOption) {
          setTeamOption(myOption)
          if (myOption.content) setAnswer(myOption.content)
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      alert('データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
  }

  const handleFileRemove = () => {
    setSelectedFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!answer.trim() && !selectedFile) {
      alert('回答を入力してください')
      return
    }

    setSubmitting(true)
    try {
      let finalImageUrl = ''

      // ファイルが選択されている場合はアップロード
      if (selectedFile) {
        setUploadingImage(true)
        try {
          const uploadResult = await uploadImage(selectedFile)
          finalImageUrl = uploadResult.url
        } catch (uploadError: any) {
          throw new Error(`画像のアップロードに失敗しました: ${uploadError.message}`)
        } finally {
          setUploadingImage(false)
        }
      }

      const body: any = {}
      if (answer.trim()) body.content = answer
      if (finalImageUrl) body.image_url = finalImageUrl

      const response = await apiClient(`/api/questions/${questionId}/options`, {
        method: 'POST',
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to submit answer')
      }

      alert('回答を送信しました！')
      await fetchData() // 再取得
    } catch (error: any) {
      alert(error.message || '回答の送信に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
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
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <i className="fas fa-check text-primary-foreground text-sm"></i>
              </div>
              <span className="text-sm font-semibold text-primary">回答</span>
            </div>
            <div className="flex-1 h-0.5 bg-border mx-3"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center">
                <span className="text-sm text-muted-foreground">2</span>
              </div>
              <span className="text-sm text-muted-foreground">投票</span>
            </div>
            <div className="flex-1 h-0.5 bg-border mx-3"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center">
                <span className="text-sm text-muted-foreground">3</span>
              </div>
              <span className="text-sm text-muted-foreground">結果</span>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground">Step 1/3</p>
        </div>

        {/* Question Card */}
        <Card className="p-6 space-y-4 border-l-4 border-l-primary">
          <h2 className="text-xl font-bold">【問題】</h2>
          <p className="text-lg">{question?.title}</p>
          {question?.description && (
            <p className="text-sm text-muted-foreground">{question.description}</p>
          )}
          
          {timeLeft !== null && (
            <div className="flex items-center gap-2 text-destructive">
              <i className="fas fa-clock"></i>
              <span className="font-medium">
                制限時間: {formatTime(timeLeft)}
              </span>
            </div>
          )}
        </Card>

        {/* Answer Form or Submitted Answer */}
        {teamOption ? (
          <Card className="p-6 space-y-4 border-l-4 border-l-chart-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-chart-2 flex items-center justify-center">
                <i className="fas fa-check text-white"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-chart-2">回答完了</h3>
                <p className="text-sm text-muted-foreground">
                  {teamOption.team_name}の回答
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-muted/30 rounded-lg">
              {teamOption.content && (
                <p className="whitespace-pre-wrap text-center py-2">{teamOption.content}</p>
              )}
              {teamOption.image_url && (
                <img
                  src={teamOption.image_url}
                  alt="回答画像"
                  className="w-full rounded-lg"
                />
              )}
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              投票フェーズまでお待ちください
            </p>
          </Card>
        ) : (
          <form onSubmit={handleSubmit}>
            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-semibold">チームの回答を入力</h3>
              
              {(question?.question_type === 'text' || question?.question_type === 'both') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">テキスト回答</label>
                  <Textarea
                    placeholder="回答を入力してください"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={4}
                    disabled={submitting}
                    className="w-full"
                  />
                </div>
              )}

              {(question?.question_type === 'image' || question?.question_type === 'both') && (
                <>
                  {question.question_type === 'both' && (
                    <div className="text-center">
                      <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        または
                      </span>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <i className="fas fa-image"></i>
                      画像回答
                    </label>
                    <FileUpload
                      onFileSelect={handleFileSelect}
                      onFileRemove={handleFileRemove}
                      selectedFile={selectedFile}
                      disabled={submitting || uploadingImage}
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold rounded-full"
                disabled={submitting || uploadingImage || (!answer.trim() && !selectedFile)}
              >
                {uploadingImage ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    画像アップロード中...
                  </>
                ) : submitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    送信中...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    回答を送信
                  </>
                )}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                ※チームの誰か1人が回答すればOKです
              </p>
            </Card>
          </form>
        )}

        {/* Progress */}
        <Card className="p-4">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              {teamOption ? '投票フェーズ待機中...' : '他のチームの回答状況'}
            </p>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${question && question.total_teams > 0 ? Math.round((question.answered_teams / question.total_teams) * 100) : 0}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {question?.answered_teams || 0}/{question?.total_teams || 0}チーム完了
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
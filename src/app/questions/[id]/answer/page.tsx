'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { getTeamId } from '@/lib/session'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { FileUpload } from '@/components/ui/file-upload'
import { ArrowLeft, Clock, Image as ImageIcon } from 'lucide-react'
import { Header } from '@/components/layout/Header'
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

  const progress = question.total_teams > 0 
    ? Math.round((question.answered_teams / question.total_teams) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentQuestion={1} totalQuestions={10} />

      <div className="p-4 max-w-2xl mx-auto">
        {/* ステップインジケーター */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-sm font-medium">回答</span>
            </div>
            <div className="h-px bg-gray-300 w-8" />
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full" />
              <span className="text-sm text-gray-500">投票</span>
            </div>
            <div className="h-px bg-gray-300 w-8" />
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full" />
              <span className="text-sm text-gray-500">結果</span>
            </div>
          </div>
          <p className="text-center text-sm text-gray-600">Step 1/3</p>
        </div>

        {/* 問題文 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-2">【問題】</h2>
            <p className="text-lg mb-2">{question.title}</p>
            {question.description && (
              <p className="text-sm text-gray-600">{question.description}</p>
            )}
            
            {timeLeft !== null && (
              <div className="mt-4 flex items-center gap-2 text-red-600">
                <Clock className="w-4 h-4" />
                <span className="font-medium">
                  制限時間: {formatTime(timeLeft)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 回答フォーム */}
        {teamOption ? (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-green-600">
                ✅ チームの回答:
              </h3>
              {teamOption.content && (
                <div className="p-4 bg-gray-50 rounded-lg mb-2">
                  <p className="whitespace-pre-wrap">{teamOption.content}</p>
                </div>
              )}
              {teamOption.image_url && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">画像URL: {teamOption.image_url}</p>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-4">
                回答者: {teamOption.team_name}のメンバー
              </p>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit}>
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">チームの回答を入力:</h3>
                
                {(question.question_type === 'text' || question.question_type === 'both') && (
                  <div className="mb-4">
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

                {(question.question_type === 'image' || question.question_type === 'both') && (
                  <>
                    {question.question_type === 'both' && (
                      <p className="text-center text-sm text-gray-600 mb-4">または</p>
                    )}
                    
                    {/* ファイルアップロード */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ImageIcon className="w-4 h-4" />
                        <label className="text-sm font-medium">画像ファイル</label>
                      </div>
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
                  className="w-full"
                  disabled={submitting || uploadingImage || (!answer.trim() && !selectedFile)}
                >
                  {uploadingImage ? '画像アップロード中...' : submitting ? '送信中...' : '回答を送信 &gt;&gt;'}
                </Button>

                <p className="text-sm text-gray-500 text-center mt-4">
                  ※チームの誰か1人が回答すればOKです
                </p>
              </CardContent>
            </Card>
          </form>
        )}

        {/* 進捗表示 */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 mb-2">
              {teamOption ? '投票フェーズ待機中...' : '他のチームの回答状況:'}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 text-right">
              {question.answered_teams}/{question.total_teams}チーム完了
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
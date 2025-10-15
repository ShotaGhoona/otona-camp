'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import { Header } from '@/components/layout/Header'

interface QuestionForm {
  title: string
  description: string
  question_type: 'text' | 'image' | 'both'
  time_limit: string
  points: string
}

export default function NewQuestionPage() {
  const router = useRouter()
  const [form, setForm] = useState<QuestionForm>({
    title: '',
    description: '',
    question_type: 'text',
    time_limit: '60',
    points: '100'
  })
  const [submitting, setSubmitting] = useState(false)

  const handleInputChange = (field: keyof QuestionForm, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent, immediately: boolean = false) => {
    e.preventDefault()
    
    if (!form.title.trim()) {
      alert('問題文を入力してください')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        question_type: form.question_type,
        time_limit: form.time_limit ? parseInt(form.time_limit) : null,
        points: parseInt(form.points) || 100
      }

      const response = await apiClient('/api/questions', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to create question')
      }

      const question = await response.json()

      // 即座にアクティブ化する場合
      if (immediately) {
        const statusResponse = await apiClient(`/api/questions/${question.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'active' })
        })
        
        if (!statusResponse.ok) {
          alert('問題は作成されましたが、アクティブ化に失敗しました')
        } else {
          alert('問題を作成し、回答受付を開始しました！')
        }
      } else {
        alert('問題を作成しました！')
      }

      router.push('/gamemaster')
    } catch (error: any) {
      alert(error.message || '問題の作成に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="p-4 max-w-2xl mx-auto">
        <form onSubmit={(e) => handleSubmit(e, false)}>
          <Card>
            <CardHeader>
              <CardTitle>新しい問題を作成</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 問題文 */}
              <div>
                <Label htmlFor="title" className="text-base font-medium mb-2">
                  問題文 <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="title"
                  placeholder="あなたのチームを動物で例えると？"
                  value={form.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  rows={3}
                  required
                  disabled={submitting}
                  className="mt-2"
                />
              </div>

              {/* 補足説明 */}
              <div>
                <Label htmlFor="description" className="text-base font-medium mb-2">
                  補足説明（任意）
                </Label>
                <Textarea
                  id="description"
                  placeholder="チームの特徴を動物で表現してください"
                  value={form.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={2}
                  disabled={submitting}
                  className="mt-2"
                />
              </div>

              {/* 回答タイプ */}
              <div>
                <Label className="text-base font-medium mb-3 block">
                  回答タイプ
                </Label>
                <RadioGroup
                  value={form.question_type}
                  onValueChange={(value) => handleInputChange('question_type', value as 'text' | 'image' | 'both')}
                  disabled={submitting}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text" id="text" />
                    <Label htmlFor="text" className="font-normal cursor-pointer">
                      テキスト
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="image" id="image" />
                    <Label htmlFor="image" className="font-normal cursor-pointer">
                      画像
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both" className="font-normal cursor-pointer">
                      テキスト + 画像
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* 制限時間 */}
              <div>
                <Label htmlFor="time_limit" className="text-base font-medium mb-2">
                  制限時間（秒）
                </Label>
                <Input
                  id="time_limit"
                  type="number"
                  placeholder="60"
                  value={form.time_limit}
                  onChange={(e) => handleInputChange('time_limit', e.target.value)}
                  min="0"
                  disabled={submitting}
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  ※空欄の場合は無制限
                </p>
              </div>

              {/* 配点 */}
              <div>
                <Label htmlFor="points" className="text-base font-medium mb-2">
                  配点
                </Label>
                <Input
                  id="points"
                  type="number"
                  placeholder="100"
                  value={form.points}
                  onChange={(e) => handleInputChange('points', e.target.value)}
                  min="0"
                  step="50"
                  disabled={submitting}
                  className="mt-2"
                />
              </div>

              {/* ボタン */}
              <div className="space-y-3 pt-4">
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full"
                  disabled={submitting || !form.title.trim()}
                >
                  {submitting ? '作成中...' : '下書き保存'}
                </Button>
                <Button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  className="w-full"
                  disabled={submitting || !form.title.trim()}
                >
                  {submitting ? '作成中...' : '即座にアクティブ化'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
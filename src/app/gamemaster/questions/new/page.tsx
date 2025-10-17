'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

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
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/gamemaster')}
          >
            <i className="fas fa-arrow-left"></i>
          </Button>
          <h1 className="text-xl font-bold">新しい問題</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          {/* Question Title */}
          <Card className="p-6 space-y-4 border-l-4 border-l-primary">
            <h2 className="text-lg font-semibold">問題文</h2>
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                問題文 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="title"
                placeholder="あなたのチームを動物で例えると？"
                value={form.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                rows={3}
                required
                disabled={submitting}
                className="resize-none"
              />
            </div>
          </Card>

          {/* Description */}
          <Card className="p-6 space-y-4 border-l-4 border-l-secondary">
            <h2 className="text-lg font-semibold">補足説明</h2>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                補足説明（任意）
              </Label>
              <Textarea
                id="description"
                placeholder="チームの特徴を動物で表現してください"
                value={form.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={2}
                disabled={submitting}
                className="resize-none"
              />
            </div>
          </Card>

          {/* Question Type */}
          <Card className="p-6 space-y-4 border-l-4 border-l-chart-1">
            <h2 className="text-lg font-semibold">回答タイプ</h2>
            <RadioGroup
              value={form.question_type}
              onValueChange={(value) => handleInputChange('question_type', value as 'text' | 'image' | 'both')}
              disabled={submitting}
              className="space-y-4"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="text" id="text" />
                <Label htmlFor="text" className="flex items-center gap-2 cursor-pointer">
                  <i className="fas fa-font text-sm"></i>
                  テキスト
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="image" id="image" />
                <Label htmlFor="image" className="flex items-center gap-2 cursor-pointer">
                  <i className="fas fa-image text-sm"></i>
                  画像
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="both" id="both" />
                <Label htmlFor="both" className="flex items-center gap-2 cursor-pointer">
                  <i className="fas fa-images text-sm"></i>
                  テキスト + 画像
                </Label>
              </div>
            </RadioGroup>
          </Card>

          {/* Settings */}
          <Card className="p-6 space-y-6 border-l-4 border-l-chart-3">
            <h2 className="text-lg font-semibold">設定</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time_limit" className="text-sm font-medium">
                  制限時間（分）
                </Label>
                <Input
                  id="time_limit"
                  type="number"
                  placeholder="1"
                  value={form.time_limit}
                  onChange={(e) => handleInputChange('time_limit', e.target.value)}
                  min="0"
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">
                  空欄は無制限
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="points" className="text-sm font-medium">
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
                />
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              type="submit"
              variant="outline"
              className="w-full h-12 text-base font-semibold rounded-full"
              disabled={submitting || !form.title.trim()}
            >
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  作成中...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  下書き保存
                </>
              )}
            </Button>
            
            <Button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              className="w-full h-12 text-base font-semibold rounded-full"
              disabled={submitting || !form.title.trim()}
            >
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  作成中...
                </>
              ) : (
                <>
                  <i className="fas fa-play mr-2"></i>
                  即座にアクティブ化
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
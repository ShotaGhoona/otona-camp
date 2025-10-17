'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { apiClient } from '@/lib/api'
import { setSession } from '@/lib/session'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

const TEAM_COLORS = [
  { value: '#000000', label: '⚫', name: 'ブラック' },
  { value: '#FF6B6B', label: '🔴', name: 'レッド' },
  { value: '#4ECDC4', label: '🔵', name: 'ブルー' },
  { value: '#96CEB4', label: '🟢', name: 'グリーン' },
  { value: '#FFE66D', label: '🟡', name: 'イエロー' },
  { value: '#9B59B6', label: '🟣', name: 'パープル' },
]

export default function TeamSetupPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [teamName, setTeamName] = useState('')
  const [selectedColor, setSelectedColor] = useState(TEAM_COLORS[1].value)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teamName.trim()) return

    setLoading(true)
    try {
      // チーム作成
      const teamResponse = await apiClient('/api/teams', {
        method: 'POST',
        body: JSON.stringify({
          name: teamName,
          color: selectedColor
        })
      })

      if (!teamResponse.ok) {
        throw new Error('Failed to create team')
      }

      const team = await teamResponse.json()

      // メンバー登録（自動的にチームに参加）
      const memberResponse = await apiClient('/api/members', {
        method: 'POST',
        body: JSON.stringify({
          name: session?.user?.name || '',
          team_id: team.id
        })
      })

      if (!memberResponse.ok) {
        throw new Error('Failed to join team')
      }

      const member = await memberResponse.json()
      
      // セッションに保存（後でSupabaseと連携時に使用）
      setSession(member.id, member.team_id, member.name)
      
      // セッション情報を更新するため、リロード
      window.location.href = '/questions'
    } catch (error) {
      alert('チームの作成に失敗しました')
    } finally {
      setLoading(false)
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
            onClick={() => router.push('/team-select')}
          >
            <i className="fas fa-arrow-left"></i>
          </Button>
          <h1 className="text-xl font-bold">チーム作成</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Header Card */}
        <Card className="p-6 text-center bg-gradient-to-br from-primary/10 to-transparent">
          <div className="space-y-2">
            <i className="fas fa-users text-4xl text-primary"></i>
            <h2 className="text-xl font-bold">新しいチームを作成</h2>
            <p className="text-sm text-muted-foreground">
              チーム名とカラーを選択してください
            </p>
          </div>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team Name */}
          <Card className="p-6 space-y-4 border-l-4 border-l-primary">
            <h3 className="text-lg font-semibold">チーム名</h3>
            <div className="space-y-2">
              <Label htmlFor="teamName" className="text-sm font-medium">
                チーム名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="teamName"
                type="text"
                placeholder="最強チーム"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                disabled={loading}
                className="h-12 text-base"
              />
            </div>
          </Card>

          {/* Team Color */}
          <Card className="p-6 space-y-4 border-l-4 border-l-secondary">
            <h3 className="text-lg font-semibold">チームカラー</h3>
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                チームカラーを選択
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {TEAM_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSelectedColor(color.value)}
                    className={`
                      p-4 rounded-xl border-2 transition-all text-center
                      ${selectedColor === color.value
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                    disabled={loading}
                  >
                    <div className="space-y-2">
                      <div 
                        className="w-8 h-8 rounded-full mx-auto"
                        style={{ backgroundColor: color.value }}
                      ></div>
                      <div className="text-sm font-medium">
                        {color.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {color.name}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Preview */}
          {teamName.trim() && (
            <Card className="p-6 space-y-4 border-l-4 border-l-chart-3">
              <h3 className="text-lg font-semibold">プレビュー</h3>
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: selectedColor }}
                >
                  <i className="fas fa-users text-white"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-lg">{teamName}</h4>
                  <p className="text-sm text-muted-foreground">
                    あなたがリーダーになります
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold rounded-full"
            disabled={loading || !teamName.trim()}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                作成中...
              </>
            ) : (
              <>
                <i className="fas fa-plus mr-2"></i>
                チームを作成
              </>
            )}
          </Button>
        </form>

        {/* Help Text */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <i className="fas fa-info-circle text-chart-1 mt-1"></i>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">💡 ヒント</p>
              <p>チーム作成後、あなたが自動的にチームリーダーになります</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
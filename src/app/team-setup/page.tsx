'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { apiClient } from '@/lib/api'
import { setSession } from '@/lib/session'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/Header'

const TEAM_COLORS = [
  { value: '#000000', label: '⚫' },
  { value: '#FF6B6B', label: '🔴' },
  { value: '#4ECDC4', label: '🔵' },
  { value: '#96CEB4', label: '🟢' },
  { value: '#FFE66D', label: '🟡' },
  { value: '#9B59B6', label: '🟣' },
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
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="p-4 max-w-md mx-auto">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  チーム名
                </label>
                <Input
                  type="text"
                  placeholder="最強チーム"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  チームカラー
                </label>
                <div className="flex gap-3 justify-center">
                  {TEAM_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSelectedColor(color.value)}
                      className={`text-2xl p-2 rounded-lg border-2 transition-all ${
                        selectedColor === color.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      disabled={loading}
                    >
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={loading || !teamName.trim()}
              >
                {loading ? '作成中...' : 'チームを作成'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
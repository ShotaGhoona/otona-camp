'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/Header'

export default function LoginPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      // NextAuth.jsでログイン
      const result = await signIn('credentials', {
        name: name,
        redirect: false,
      })

      if (result?.error) {
        alert('ログインに失敗しました')
      } else {
        // ログイン成功後、チーム選択ページへ
        router.push('/team-select')
      }
    } catch (error) {
      alert('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showBack={false} />
      <div className="flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 57px)' }}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="text-4xl mb-4">🎮</div>
            <CardTitle className="text-2xl">チーム対抗ゲーム</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  あなたの名前
                </label>
                <Input
                  type="text"
                  placeholder="山田太郎"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading || !name.trim()}
              >
                {loading ? '処理中...' : 'ログイン &gt;&gt;'}
              </Button>
            </form>
            
            <p className="mt-6 text-center text-sm text-gray-500">
              ※セキュリティなし<br />
              名前だけで参加OK
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
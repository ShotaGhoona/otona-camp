'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Title */}
        <div className="text-center space-y-2">
          <div className="inline-block p-4 rounded-full bg-primary/10 mb-4">
            <i className="fas fa-gamepad text-5xl text-primary"></i>
          </div>
          <h1 className="text-4xl font-bold text-foreground">
            Otona Camp Game
          </h1>
          <p className="text-muted-foreground">競争して、投票して、勝利しよう！</p>
        </div>

        {/* Login Form */}
        <div className="bg-card rounded-xl p-6 space-y-6 border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-semibold">
                あなたの名前
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="ダイダロス"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit(e);
                }}
                className="h-12 text-base"
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              onClick={handleSubmit}
              className="w-full h-12 text-base font-semibold rounded-full"
              size="lg"
              disabled={loading || !name.trim()}
            >
              {loading ? '処理中...' : 'ログイン'}
              {!loading && <i className="fas fa-arrow-right ml-2"></i>}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center">
            名前だけで参加OK
          </p>
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>produced by @D.D.</p>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ArrowLeft, Menu } from 'lucide-react'

interface HeaderProps {
  title?: string
  showBack?: boolean
  showMenu?: boolean
  currentQuestion?: number
  totalQuestions?: number
  onMenuClick?: () => void
}

export function Header({ 
  title, 
  showBack = true, 
  showMenu = false,
  currentQuestion,
  totalQuestions,
  onMenuClick 
}: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleBack = () => {
    // パスに基づいて適切な戻り先を決定
    if (pathname.includes('/questions/') && pathname.includes('/answer')) {
      router.push('/questions')
    } else if (pathname.includes('/questions/') && pathname.includes('/vote')) {
      router.push('/questions')
    } else if (pathname.includes('/questions/') && pathname.includes('/result')) {
      router.push('/questions')
    } else if (pathname === '/team-setup' || pathname === '/team-select') {
      router.push('/login')
    } else if (pathname === '/gamemaster/questions/new') {
      router.push('/gamemaster')
    } else if (pathname === '/scoreboard') {
      router.push('/questions')
    } else {
      router.back()
    }
  }

  // タイトルの自動生成
  const getTitle = () => {
    if (title) return title
    
    if (currentQuestion && totalQuestions) {
      return `Q${currentQuestion}/${totalQuestions}`
    }
    
    // パスに基づいてタイトルを決定
    if (pathname === '/login') return 'ログイン'
    if (pathname === '/team-select') return 'チーム選択'
    if (pathname === '/team-setup') return 'チーム作成'
    if (pathname === '/questions') return '問題一覧'
    if (pathname === '/scoreboard') return 'スコアボード'
    if (pathname === '/gamemaster') return 'ゲームマスター'
    if (pathname === '/gamemaster/questions/new') return '問題作成'
    
    return 'Adult Camp Game'
  }

  return (
    <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
      <div className="flex items-center">
        {showBack && (
          <button onClick={handleBack} className="mr-4">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        {showMenu && (
          <button onClick={onMenuClick} className="p-2">
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>
      <h1 className="text-lg font-semibold flex-1 text-center">
        {getTitle()}
      </h1>
      <div className="w-5" />
    </div>
  )
}
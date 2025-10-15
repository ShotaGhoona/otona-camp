# アーキテクチャ設計

## 設計方針

- **MVP最優先**: 明日使える最小限の機能
- **シンプル**: 過度な抽象化を避ける
- **保守性**: 適度なファイル分割
- **Next.js App Router**: 最新のベストプラクティス
- **Supabase**: リアルタイム機能とDB

---

## 技術スタック

### フロントエンド
- **Next.js 14+** (App Router)
- **React 18+**
- **TypeScript**
- **Tailwind CSS**
- **NextAuth.js** (認証)
- **shadcn/ui** (UIコンポーネント)

### バックエンド
- **Next.js API Routes** (App Router)
- **Supabase** (PostgreSQL + Realtime)
- **NextAuth.js** (セッション管理)

### デプロイ
- **Vercel**

### 状態管理
- **React Context** (グローバル状態: ユーザー情報)
- **SWR** or **useState** (ローカル状態)
- **Supabase Realtime** (リアルタイム同期)

---

## ディレクトリ構造

```
adult-camp/
├── .env.local                      # 環境変数（Git管理外）
├── .gitignore
├── next.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
│
├── docs/                           # ドキュメント
│   └── requirement/
│       ├── db.md                   # DB設計
│       ├── page.md                 # 画面設計
│       ├── api.md                  # API設計
│       ├── tasks.md                # タスクリスト
│       └── architecture.md         # このファイル
│
├── public/                         # 静的ファイル
│   ├── favicon.ico
│   └── images/
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # ルートレイアウト
│   │   ├── page.tsx                # ホーム（リダイレクト）
│   │   ├── globals.css             # グローバルスタイル
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx            # ログインページ
│   │   │
│   │   ├── team-select/
│   │   │   └── page.tsx            # チーム選択ページ
│   │   │
│   │   ├── team-setup/
│   │   │   └── page.tsx            # チーム作成ページ
│   │   │
│   │   ├── questions/
│   │   │   ├── page.tsx            # 問題一覧ページ
│   │   │   └── [id]/
│   │   │       ├── answer/
│   │   │       │   └── page.tsx    # 回答フェーズ
│   │   │       ├── vote/
│   │   │       │   └── page.tsx    # 投票フェーズ
│   │   │       └── result/
│   │   │           └── page.tsx    # 結果フェーズ
│   │   │
│   │   ├── scoreboard/
│   │   │   └── page.tsx            # スコアボード
│   │   │
│   │   ├── gamemaster/
│   │   │   ├── page.tsx            # GMダッシュボード
│   │   │   └── questions/
│   │   │       └── new/
│   │   │           └── page.tsx    # 問題作成ページ
│   │   │
│   │   └── api/                    # API Routes
│   │       ├── teams/
│   │       │   └── route.ts        # GET, POST /api/teams
│   │       │
│   │       ├── members/
│   │       │   ├── route.ts        # POST /api/members
│   │       │   └── me/
│   │       │       └── route.ts    # GET /api/members/me
│   │       │
│   │       ├── questions/
│   │       │   ├── route.ts        # GET, POST /api/questions
│   │       │   └── [id]/
│   │       │       ├── route.ts    # GET /api/questions/:id
│   │       │       ├── status/
│   │       │       │   └── route.ts # PATCH /api/questions/:id/status
│   │       │       ├── options/
│   │       │       │   └── route.ts # GET, POST /api/questions/:id/options
│   │       │       ├── votes/
│   │       │       │   └── route.ts # POST /api/questions/:id/votes
│   │       │       └── results/
│   │       │           └── route.ts # GET /api/questions/:id/results
│   │       │
│   │       └── scoreboard/
│   │           └── route.ts        # GET /api/scoreboard
│   │
│   ├── components/                 # Reactコンポーネント
│   │   ├── ui/                     # 再利用可能なUIコンポーネント（shadcn/ui）
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── label.tsx
│   │   │   └── radio-group.tsx
│   │   │
│   │   ├── layout/                 # レイアウトコンポーネント
│   │   │   ├── Header.tsx
│   │   │   └── Container.tsx
│   │   │
│   │   ├── team/                   # チーム関連
│   │   │   ├── TeamCard.tsx
│   │   │   ├── TeamSelector.tsx
│   │   │   └── TeamColorPicker.tsx
│   │   │
│   │   ├── question/               # 問題関連
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── QuestionList.tsx
│   │   │   ├── AnswerForm.tsx
│   │   │   └── Timer.tsx
│   │   │
│   │   ├── vote/                   # 投票関連
│   │   │   ├── OptionCard.tsx
│   │   │   └── VoteButton.tsx
│   │   │
│   │   ├── scoreboard/             # スコアボード関連
│   │   │   ├── TeamRankCard.tsx
│   │   │   └── ProgressBar.tsx
│   │   │
│   │   └── gamemaster/             # ゲームマスター関連
│   │       ├── QuestionForm.tsx
│   │       └── StatusControl.tsx
│   │
│   ├── providers/                  # プロバイダーコンポーネント
│   │   └── SessionProvider.tsx     # NextAuth SessionProvider
│   │
│   ├── lib/                        # ユーティリティ・ヘルパー
│   │   ├── supabase.ts             # Supabaseクライアント
│   │   ├── session.ts              # セッション管理
│   │   ├── api.ts                  # API呼び出しヘルパー
│   │   └── utils.ts                # 汎用ユーティリティ
│   │
│   ├── hooks/                      # カスタムフック
│   │   ├── useAuth.ts              # 認証状態管理
│   │   ├── useRealtime.ts          # Realtimeサブスクリプション
│   │   ├── useQuestions.ts         # 問題データ取得
│   │   └── useTeam.ts              # チーム情報管理
│   │
│   ├── types/                      # TypeScript型定義
│   │   ├── database.ts             # DBスキーマ型
│   │   ├── api.ts                  # APIレスポンス型
│   │   ├── index.ts                # 共通型エクスポート
│   │   └── next-auth.d.ts          # NextAuth型定義
│   │
│   ├── contexts/                   # React Context
│   │   └── AuthContext.tsx         # 認証コンテキスト
│   │
│   └── middleware.ts               # NextAuth認証ミドルウェア
│
└── supabase/                       # Supabase関連
    └── migrations/
        └── 001_initial_schema.sql  # 初期スキーマ
```

---

## ファイル詳細

### 環境変数 (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

---

### コアファイル

#### `src/lib/supabase.ts`
Supabaseクライアントの初期化

```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

#### `src/lib/session.ts`
セッション管理（LocalStorage使用、NextAuthと併用）

```typescript
export function getMemberId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('member_id')
}

export function getTeamId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('team_id')
}

export function setSession(memberId: string, teamId: string, name?: string) {
  localStorage.setItem('member_id', memberId)
  localStorage.setItem('team_id', teamId)
  if (name) localStorage.setItem('member_name', name)
}

export function clearSession() {
  localStorage.removeItem('member_id')
  localStorage.removeItem('team_id')
  localStorage.removeItem('member_name')
}
```

#### `src/lib/api.ts`
API呼び出しヘルパー

```typescript
import { getMemberId, getTeamId } from './session'

export async function apiClient(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const memberId = getMemberId()
  const teamId = getTeamId()

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(memberId && { 'Authorization': memberId }),
      ...(teamId && { 'X-Team-ID': teamId }),
      ...options.headers,
    },
  })
}
```

#### `src/types/database.ts`
DB型定義（Supabaseから自動生成可能）

```typescript
export type Team = {
  id: string
  name: string
  color: string | null
  score: number
  created_at: string
}

export type Member = {
  id: string
  team_id: string
  name: string
  created_at: string
}

export type Question = {
  id: string
  title: string
  description: string | null
  question_type: 'text' | 'image' | 'both'
  time_limit: number | null
  points: number
  status: 'draft' | 'active' | 'voting' | 'finished'
  created_at: string
  started_at: string | null
  finished_at: string | null
}

export type Option = {
  id: string
  question_id: string
  team_id: string
  content: string | null
  image_url: string | null
  created_at: string
}

export type Vote = {
  id: string
  option_id: string
  member_id: string
  question_id: string
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      teams: { Row: Team }
      members: { Row: Member }
      questions: { Row: Question }
      options: { Row: Option }
      votes: { Row: Vote }
    }
  }
}
```

#### `src/hooks/useAuth.ts`
認証状態管理（NextAuth対応）

```typescript
'use client'

import { useSession } from 'next-auth/react'
import { getMemberId, getTeamId } from '@/lib/session'

export function useAuth() {
  const { data: session, status } = useSession()
  
  // セッションから情報を取得、またはローカルストレージから取得（移行期間のため）
  const memberId = session?.user?.id || getMemberId()
  const teamId = session?.user?.teamId || getTeamId()

  return {
    memberId,
    teamId,
    isAuthenticated: status === 'authenticated' || !!memberId,
    isLoading: status === 'loading'
  }
}
```

#### `src/hooks/useRealtime.ts`
Realtimeサブスクリプション

```typescript
'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtime(
  table: string,
  onUpdate: (payload: any) => void
) {
  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        (payload) => {
          onUpdate(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, onUpdate])
}
```

---

## コンポーネント設計方針

### 1. UIコンポーネント（`components/ui/`）
- **責務**: 見た目のみ、ビジネスロジックなし
- **再利用性**: 高い
- **例**: Button, Card, Input

```typescript
// components/ui/Button.tsx
interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'disabled'
  className?: string
}

export function Button({ children, onClick, variant = 'primary', className }: ButtonProps) {
  // シンプルなボタンコンポーネント
}
```

### 2. フィーチャーコンポーネント（`components/*/`）
- **責務**: 特定機能に特化
- **再利用性**: 中程度
- **例**: TeamCard, QuestionCard

```typescript
// components/team/TeamCard.tsx
interface TeamCardProps {
  team: Team
  onSelect: (teamId: string) => void
}

export function TeamCard({ team, onSelect }: TeamCardProps) {
  // チーム情報を表示するカード
}
```

### 3. ページコンポーネント（`app/*/page.tsx`）
- **責務**: データ取得、状態管理、レイアウト
- **再利用性**: なし
- **例**: questions/page.tsx

```typescript
// app/questions/page.tsx
export default async function QuestionsPage() {
  // データ取得
  // UIコンポーネントの組み立て
}
```

---

## API Routes設計

### 基本構造

```typescript
// app/api/teams/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('score', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ teams: data })
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const { data, error } = await supabase
    .from('teams')
    .insert(body)
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 400 }
    )
  }

  return NextResponse.json(data, { status: 201 })
}
```

---

## データフロー

### 1. ログインフロー

```
User Input (名前)
  ↓
Login Page → NextAuth signIn()
  ↓
NextAuth Credentials Provider
  ↓
JWTセッション生成
  ↓
Team Select Page へリダイレクト
  ↓
チーム選択 → POST /api/members
  ↓
Supabase (members テーブルに挿入)
  ↓
LocalStorage に保存（Supabase連携用）
  ↓
Questions Page へリダイレクト
```

### 2. 回答フロー

```
User Input (回答)
  ↓
Answer Page → POST /api/questions/:id/options
  ↓
Supabase (options テーブルに挿入)
  ↓
Realtime 通知
  ↓
全ユーザーの画面更新（進捗バー）
```

### 3. 投票フロー

```
User Click (投票ボタン)
  ↓
Vote Page → POST /api/questions/:id/votes
  ↓
バリデーション（自チーム投票不可）
  ↓
Supabase (votes テーブルに挿入)
  ↓
Realtime 通知
  ↓
全ユーザーの画面更新（投票数）
```

### 4. リアルタイム更新フロー

```
Supabase (データ変更)
  ↓
Realtime Channel 通知
  ↓
useRealtime Hook
  ↓
React State 更新
  ↓
UI 再レンダリング
```

---

## 状態管理戦略

### グローバル状態（Context/NextAuth）
- ユーザー情報（NextAuthセッション）
- チーム情報（LocalStorageとの連携）

### ローカル状態（useState）
- フォーム入力値
- UI状態（ローディング、エラー）
- ページ固有のデータ

### サーバー状態（SWR or Fetch）
- 問題一覧
- 回答一覧
- 投票結果

### リアルタイム状態（Supabase Realtime）
- 問題ステータス変更
- 回答・投票数の変化
- スコア更新

---

## セキュリティ方針（MVP）

### やらないこと（時間優先）
- ❌ 厳密な認証・認可（パスワード等）
- ❌ Row Level Security (RLS)
- ❌ Rate Limiting
- ❌ 入力値の厳密なバリデーション

### 最低限やること
- ✅ NextAuth.jsによる基本的な認証
- ✅ middlewareによる保護されたページのアクセス制御
- ✅ 自チーム投票不可のチェック（API側）
- ✅ 重複回答・重複投票のチェック（UNIQUE制約）
- ✅ 環境変数の.gitignore管理
- ✅ XSS対策（Reactのデフォルト）
- ✅ CSRF対策（NextAuth.jsのデフォルト）

---

## パフォーマンス最適化

### 最適化しないこと（YAGNI）
- コード分割（ページ数が少ない）
- 画像最適化（時間がない）
- メモ化（useMemo, useCallback）

### 最低限の最適化
- ✅ Supabaseクエリの効率化（必要なカラムのみSELECT）
- ✅ Realtime購読の適切な解除（useEffect cleanup）
- ✅ ローディング状態の表示

---

## デプロイ構成

```
┌─────────────┐
│   ユーザー   │
└──────┬──────┘
       │
       ↓
┌─────────────────┐
│  Vercel (CDN)   │
│  - Next.js App  │
│  - API Routes   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Supabase      │
│  - PostgreSQL   │
│  - Realtime     │
└─────────────────┘
```

**メリット:**
- グローバルCDNで高速
- 自動スケーリング
- ゼロダウンタイムデプロイ
- 無料枠で十分（50人程度）

---

## エラーハンドリング戦略

### API側
```typescript
try {
  // DB操作
} catch (error) {
  return NextResponse.json(
    { error: { code: 'DB_ERROR', message: error.message } },
    { status: 500 }
  )
}
```

### フロント側
```typescript
try {
  const response = await apiClient('/api/teams')
  if (!response.ok) {
    throw new Error('Failed to fetch teams')
  }
  const data = await response.json()
} catch (error) {
  console.error(error)
  // エラー表示（シンプルなalertでOK）
  alert('エラーが発生しました')
}
```

---

## テスト戦略（MVP）

### やらないこと
- ❌ Unit Tests
- ❌ Integration Tests
- ❌ E2E Tests

### やること
- ✅ 手動テスト（複数デバイス）
- ✅ 主要フローの動作確認
- ✅ エッジケースの確認

---

## 完成イメージ

```
📱 スマホ（参加者）
├── ログイン
├── チーム選択/作成
├── 問題一覧（リアルタイム更新）
├── 回答入力
├── 投票（自チーム除く）
├── 結果表示
└── スコアボード

💻 PC/タブレット（ゲームマスター）
├── 問題作成
├── ステータス管理
├── 進行コントロール
└── 結果確認

☁️ Supabase
├── データ永続化
└── リアルタイム同期
```

---

## まとめ

このアーキテクチャは以下を実現します:

1. **MVP最優先**: 不要な機能は一切なし
2. **シンプル**: 学習コストが低い
3. **スケーラブル**: 必要に応じて拡張可能
4. **保守性**: 適度なファイル分割
5. **リアルタイム**: Supabaseで簡単実装
6. **デプロイ容易**: Vercel 1クリックデプロイ

明日のイベントに間に合わせることを最優先した設計です。

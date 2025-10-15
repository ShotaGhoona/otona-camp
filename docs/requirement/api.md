# API設計

## 設計方針

- **MVP最優先**: 明日使うために必要な機能のみ実装
- **RESTful**: リソース指向の設計
- **YAGNI原則**: 使わない機能は実装しない
- **シンプル**: 認証・認可は最小限（名前ベース）

---

## 認証・セッション管理

最小限の実装:
- Cookie/LocalStorageに `member_id` と `team_id` を保存
- 各APIリクエスト時にヘッダーまたはクエリパラメータで送信

```
Authorization: member_id
X-Team-ID: team_id
```

※セキュリティは無視（1回限りの使用のため）

---

## エンドポイント一覧

### 1. チーム管理

#### 1.1 チーム一覧取得
```
GET /api/teams
```

**レスポンス:**
```json
{
  "teams": [
    {
      "id": "uuid",
      "name": "チームA",
      "color": "#FF6B6B",
      "member_count": 5,
      "score": 150
    }
  ]
}
```

#### 1.2 チーム作成
```
POST /api/teams
```

**リクエスト:**
```json
{
  "name": "チームA",
  "color": "#FF6B6B"
}
```

**レスポンス:**
```json
{
  "id": "uuid",
  "name": "チームA",
  "color": "#FF6B6B",
  "score": 0,
  "created_at": "2025-10-15T10:00:00Z"
}
```

---

### 2. メンバー管理

#### 2.1 メンバー登録（ログイン）
```
POST /api/members
```

**リクエスト:**
```json
{
  "name": "山田太郎",
  "team_id": "uuid"
}
```

**レスポンス:**
```json
{
  "id": "uuid",
  "name": "山田太郎",
  "team_id": "uuid",
  "team_name": "チームA",
  "created_at": "2025-10-15T10:00:00Z"
}
```

**用途:**
- ログイン時に使用
- レスポンスの `id` をセッションに保存

#### 2.2 メンバー情報取得（現在のユーザー）
```
GET /api/members/me
```

**ヘッダー:**
```
Authorization: {member_id}
```

**レスポンス:**
```json
{
  "id": "uuid",
  "name": "山田太郎",
  "team": {
    "id": "uuid",
    "name": "チームA",
    "color": "#FF6B6B",
    "score": 150
  }
}
```

---

### 3. 問題管理

#### 3.1 問題一覧取得
```
GET /api/questions
```

**クエリパラメータ:**
- `status` (optional): `draft`, `active`, `voting`, `finished`

**レスポンス:**
```json
{
  "questions": [
    {
      "id": "uuid",
      "title": "あなたのチームを動物で例えると？",
      "description": null,
      "question_type": "text",
      "time_limit": 60,
      "points": 100,
      "status": "voting",
      "created_at": "2025-10-15T10:00:00Z",
      "started_at": "2025-10-15T10:05:00Z"
    }
  ]
}
```

#### 3.2 問題詳細取得
```
GET /api/questions/:id
```

**レスポンス:**
```json
{
  "id": "uuid",
  "title": "あなたのチームを動物で例えると？",
  "description": "チームの特徴を動物で表現してください",
  "question_type": "text",
  "time_limit": 60,
  "points": 100,
  "status": "voting",
  "started_at": "2025-10-15T10:05:00Z",
  "finished_at": null,
  "my_team_answered": true,
  "total_teams": 5,
  "answered_teams": 5,
  "my_voted": false,
  "total_votes": 12,
  "total_members": 25
}
```

#### 3.3 問題作成（ゲームマスター）
```
POST /api/questions
```

**リクエスト:**
```json
{
  "title": "あなたのチームを動物で例えると？",
  "description": "チームの特徴を表現してください",
  "question_type": "text",
  "time_limit": 60,
  "points": 100
}
```

**レスポンス:**
```json
{
  "id": "uuid",
  "title": "あなたのチームを動物で例えると？",
  "status": "draft",
  "created_at": "2025-10-15T10:00:00Z"
}
```

#### 3.4 問題ステータス更新（ゲームマスター）
```
PATCH /api/questions/:id/status
```

**リクエスト:**
```json
{
  "status": "active"
}
```

**レスポンス:**
```json
{
  "id": "uuid",
  "status": "active",
  "started_at": "2025-10-15T10:05:00Z"
}
```

**ステータス遷移:**
- `draft` → `active`: 回答受付開始
- `active` → `voting`: 投票開始
- `voting` → `finished`: 結果確定

---

### 4. 回答（Option）管理

#### 4.1 問題の回答一覧取得
```
GET /api/questions/:questionId/options
```

**レスポンス（投票前 - status=active）:**
```json
{
  "options": [
    {
      "id": "uuid",
      "team_id": "uuid",
      "team_name": "チームA",
      "team_color": "#FF6B6B",
      "content": "***",
      "image_url": null,
      "is_my_team": true
    }
  ],
  "total_options": 3,
  "total_teams": 5
}
```

**レスポンス（投票中/結果 - status=voting/finished）:**
```json
{
  "options": [
    {
      "id": "uuid",
      "team_id": "uuid",
      "team_name": "チームA",
      "team_color": "#FF6B6B",
      "content": "ライオン",
      "image_url": null,
      "is_my_team": true,
      "vote_count": 12
    },
    {
      "id": "uuid",
      "team_id": "uuid2",
      "team_name": "チームB",
      "team_color": "#4ECDC4",
      "content": "ペンギン",
      "image_url": null,
      "is_my_team": false,
      "vote_count": 8
    }
  ]
}
```

**注意:**
- `status=active` の場合、他チームの `content` は伏せ字（`***`）
- `status=voting` 以降は全て公開
- `is_my_team` で自チームか判定（投票制御に使用）

#### 4.2 回答作成
```
POST /api/questions/:questionId/options
```

**ヘッダー:**
```
Authorization: {member_id}
X-Team-ID: {team_id}
```

**リクエスト（テキスト）:**
```json
{
  "content": "ライオン"
}
```

**リクエスト（画像）:**
```json
{
  "image_url": "https://..."
}
```

**レスポンス:**
```json
{
  "id": "uuid",
  "team_id": "uuid",
  "question_id": "uuid",
  "content": "ライオン",
  "image_url": null,
  "created_at": "2025-10-15T10:06:00Z"
}
```

**バリデーション:**
- 1チーム1回答まで（既に回答済みなら400エラー）
- `question.status` が `active` の場合のみ受付

#### 4.3 回答更新（オプション）
```
PATCH /api/questions/:questionId/options/:id
```

**リクエスト:**
```json
{
  "content": "ライオン（百獣の王）"
}
```

**制限:**
- 自チームの回答のみ更新可能
- `status=active` の時のみ

---

### 5. 投票管理

#### 5.1 投票する
```
POST /api/questions/:questionId/votes
```

**ヘッダー:**
```
Authorization: {member_id}
```

**リクエスト:**
```json
{
  "option_id": "uuid"
}
```

**レスポンス:**
```json
{
  "id": "uuid",
  "option_id": "uuid",
  "member_id": "uuid",
  "question_id": "uuid",
  "created_at": "2025-10-15T10:10:00Z"
}
```

**バリデーション:**
- `question.status` が `voting` の場合のみ受付
- 1問につき1人1票（重複投票は400エラー）
- **自分のチームには投票不可**（`member.team_id != option.team_id`）

#### 5.2 自分の投票状況確認
```
GET /api/questions/:questionId/votes/me
```

**ヘッダー:**
```
Authorization: {member_id}
```

**レスポンス（投票済み）:**
```json
{
  "voted": true,
  "vote": {
    "id": "uuid",
    "option_id": "uuid",
    "option_content": "ライオン",
    "team_name": "チームA",
    "created_at": "2025-10-15T10:10:00Z"
  }
}
```

**レスポンス（未投票）:**
```json
{
  "voted": false
}
```

---

### 6. 結果・集計

#### 6.1 問題の結果取得
```
GET /api/questions/:questionId/results
```

**レスポンス:**
```json
{
  "question": {
    "id": "uuid",
    "title": "あなたのチームを動物で例えると？",
    "points": 100,
    "status": "finished"
  },
  "results": [
    {
      "rank": 1,
      "option_id": "uuid",
      "team_id": "uuid",
      "team_name": "チームA",
      "team_color": "#FF6B6B",
      "content": "ライオン",
      "image_url": null,
      "vote_count": 12,
      "points_earned": 300
    },
    {
      "rank": 2,
      "option_id": "uuid2",
      "team_id": "uuid2",
      "team_name": "チームB",
      "team_color": "#4ECDC4",
      "content": "ペンギン",
      "image_url": null,
      "vote_count": 8,
      "points_earned": 100
    }
  ],
  "total_votes": 25
}
```

**制限:**
- `status=finished` の場合のみアクセス可能

#### 6.2 スコアボード取得
```
GET /api/scoreboard
```

**レスポンス:**
```json
{
  "teams": [
    {
      "rank": 1,
      "team_id": "uuid",
      "team_name": "チームA",
      "team_color": "#FF6B6B",
      "score": 450,
      "member_count": 5
    },
    {
      "rank": 2,
      "team_id": "uuid2",
      "team_name": "チームB",
      "team_color": "#4ECDC4",
      "score": 350,
      "member_count": 6
    }
  ],
  "total_questions": 10,
  "completed_questions": 3
}
```

---

### 7. ゲーム状態管理（ゲームマスター）

#### 7.1 現在のゲーム状態取得
```
GET /api/game-state
```

**レスポンス:**
```json
{
  "phase": "playing",
  "current_question_id": "uuid",
  "current_question": {
    "id": "uuid",
    "title": "あなたのチームを動物で例えると？",
    "status": "voting"
  },
  "updated_at": "2025-10-15T10:05:00Z"
}
```

#### 7.2 ゲーム状態更新（ゲームマスター）
```
PATCH /api/game-state
```

**リクエスト:**
```json
{
  "phase": "playing",
  "current_question_id": "uuid"
}
```

**レスポンス:**
```json
{
  "phase": "playing",
  "current_question_id": "uuid",
  "updated_at": "2025-10-15T10:05:00Z"
}
```

---

### 8. 画像アップロード（オプション）

#### 8.1 画像アップロード
```
POST /api/upload
```

**リクエスト:**
```
Content-Type: multipart/form-data

file: [画像ファイル]
```

**レスポンス:**
```json
{
  "url": "https://storage.../image.jpg"
}
```

**実装方法:**
- Supabase Storage
- Vercel Blob Storage
- Cloudinary

**簡易実装:**
- Base64エンコードしてDBに直接保存（小さい画像のみ）

---

## エラーレスポンス

全エンドポイント共通:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "既に回答済みです"
  }
}
```

**エラーコード例:**
- `INVALID_REQUEST`: リクエストが不正
- `NOT_FOUND`: リソースが見つからない
- `ALREADY_ANSWERED`: 既に回答済み
- `ALREADY_VOTED`: 既に投票済み
- `CANNOT_VOTE_OWN_TEAM`: 自チームには投票不可
- `INVALID_STATUS`: ステータスが不正（例: 回答受付期間外）

---

## リアルタイム更新

### Supabase Realtimeを使用する場合

クライアント側でSubscribeするテーブル:
1. `questions` - ステータス変更を監視
2. `options` - 回答追加を監視
3. `votes` - 投票数の変化を監視
4. `teams` - スコア更新を監視

```typescript
// 例: 問題ステータス変更の監視
supabase
  .channel('questions-changes')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'questions'
  }, (payload) => {
    // UI更新
  })
  .subscribe()
```

### ポーリングを使用する場合（シンプル）

```typescript
// 5秒ごとにポーリング
setInterval(async () => {
  const response = await fetch(`/api/questions/${id}`)
  const data = await response.json()
  updateUI(data)
}, 5000)
```

---

## 実装の優先順位（MVP）

### Phase 1: 最小限で動く（必須）
1. ✅ `POST /api/teams` - チーム作成
2. ✅ `GET /api/teams` - チーム一覧
3. ✅ `POST /api/members` - メンバー登録
4. ✅ `GET /api/members/me` - 自分の情報取得
5. ✅ `POST /api/questions` - 問題作成
6. ✅ `GET /api/questions` - 問題一覧
7. ✅ `GET /api/questions/:id` - 問題詳細
8. ✅ `POST /api/questions/:id/options` - 回答作成
9. ✅ `GET /api/questions/:id/options` - 回答一覧
10. ✅ `POST /api/questions/:id/votes` - 投票
11. ✅ `GET /api/questions/:id/results` - 結果取得
12. ✅ `GET /api/scoreboard` - スコアボード
13. ✅ `PATCH /api/questions/:id/status` - ステータス更新

### Phase 2: あると便利（時間があれば）
- `GET /api/questions/:id/votes/me` - 投票確認
- `PATCH /api/questions/:id/options/:id` - 回答修正
- `POST /api/upload` - 画像アップロード
- `GET /api/game-state` - ゲーム状態取得

### Phase 3: 不要（YAGNI）
- 認証・認可の厳密な実装
- 問題の削除機能
- メンバーの編集・削除
- 詳細なログ機能
- 管理画面の高度な機能

---

## Next.js App Router での実装例

```
app/api/
├── teams/
│   └── route.ts          # GET, POST /api/teams
├── members/
│   ├── route.ts          # POST /api/members
│   └── me/
│       └── route.ts      # GET /api/members/me
├── questions/
│   ├── route.ts          # GET, POST /api/questions
│   └── [id]/
│       ├── route.ts      # GET /api/questions/:id
│       ├── status/
│       │   └── route.ts  # PATCH /api/questions/:id/status
│       ├── options/
│       │   └── route.ts  # GET, POST /api/questions/:id/options
│       ├── votes/
│       │   ├── route.ts  # POST /api/questions/:id/votes
│       │   └── me/
│       │       └── route.ts # GET /api/questions/:id/votes/me
│       └── results/
│           └── route.ts  # GET /api/questions/:id/results
├── scoreboard/
│   └── route.ts          # GET /api/scoreboard
└── game-state/
    └── route.ts          # GET, PATCH /api/game-state
```

---

## 実装時のTips

### 1. セッション管理（超シンプル版）

```typescript
// lib/session.ts
export function getMemberId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('member_id')
}

export function setMemberId(id: string) {
  localStorage.setItem('member_id', id)
  localStorage.setItem('team_id', teamId)
}
```

### 2. API呼び出しヘルパー

```typescript
// lib/api.ts
export async function apiClient(url: string, options = {}) {
  const memberId = getMemberId()
  const teamId = getTeamId()

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': memberId || '',
      'X-Team-ID': teamId || '',
      ...options.headers,
    }
  })
}
```

### 3. Supabaseクライアント

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

---

## まとめ

- **13のエンドポイント**で最小限のMVPが動作
- RESTfulな設計でわかりやすい
- YAGNI原則に従い、不要な機能は排除
- 明日のイベントに間に合わせることを最優先

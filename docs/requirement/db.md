# Database Design

## 設計方針

- **柔軟性最優先**: どんなゲームにも対応できる汎用的な設計
- **シンプル**: 明日使うので複雑な機能は省略
- **セキュリティ無視**: 1回限りの使用なので認証などは最小限

## ゲームの流れ

1. **Setup**: チーム登録
2. **Question作成**: ゲームマスターが問題（Question）を作成
3. **回答提出**: 各チームがOptionを作成（テキスト/画像）
4. **投票**: 各メンバーがOptionに投票
5. **集計**: 結果表示とスコア更新

---

## テーブル設計

### 1. teams（チーム）

チーム情報を管理

```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT, -- 表示用の色コード（オプション）
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. members（メンバー）

各チームのメンバー

```sql
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. questions（問題）

ゲームマスターが作成する問題・お題

```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, -- 問題文・お題
  description TEXT, -- 補足説明
  question_type TEXT NOT NULL, -- 'text', 'image', 'prediction' など
  time_limit INTEGER, -- 秒数（NULL = 無制限）
  points INTEGER DEFAULT 100, -- この問題の配点
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'voting', 'finished'
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  finished_at TIMESTAMP
);
```

**status の遷移:**
- `draft`: 作成中（参加者には見えない）
- `active`: 回答受付中
- `voting`: 投票受付中
- `finished`: 終了（結果表示）

### 4. options（回答選択肢）

各チームが提出する回答

```sql
CREATE TABLE options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  content TEXT, -- テキスト回答
  image_url TEXT, -- 画像URL（アップロードした場合）
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(question_id, team_id) -- 1チーム1回答まで
);
```

### 5. votes（投票）

各メンバーの投票

```sql
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID REFERENCES options(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(question_id, member_id) -- 1問につき1人1票
);
```

### 6. game_state（ゲーム状態）

現在のゲーム進行状況を管理（シングルトン）

```sql
CREATE TABLE game_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  current_question_id UUID REFERENCES questions(id),
  phase TEXT DEFAULT 'setup', -- 'setup', 'playing', 'finished'
  updated_at TIMESTAMP DEFAULT NOW(),

  CHECK (id = 1) -- 1レコードのみ
);

-- 初期レコード挿入
INSERT INTO game_state (id) VALUES (1);
```

---

## 使用例

### 1. セットアップフェーズ

```sql
-- チーム作成
INSERT INTO teams (name, color) VALUES
  ('チームA', '#FF6B6B'),
  ('チームB', '#4ECDC4');

-- メンバー登録
INSERT INTO members (team_id, name) VALUES
  ('team-a-uuid', '山田太郎'),
  ('team-a-uuid', '佐藤花子');
```

### 2. 問題作成（ゲームマスター）

```sql
-- 問題作成
INSERT INTO questions (title, question_type, time_limit, points)
VALUES ('このチームを動物で例えると？', 'text', 60, 100);

-- ゲーム状態を更新
UPDATE game_state SET
  current_question_id = 'question-uuid',
  phase = 'playing';

-- 問題をアクティブに
UPDATE questions SET status = 'active' WHERE id = 'question-uuid';
```

### 3. チームが回答提出

```sql
INSERT INTO options (question_id, team_id, content)
VALUES ('question-uuid', 'team-a-uuid', 'ライオン');
```

### 4. 投票フェーズ

```sql
-- 問題ステータスを投票に変更
UPDATE questions SET status = 'voting' WHERE id = 'question-uuid';

-- メンバーが投票
INSERT INTO votes (option_id, member_id, question_id)
VALUES ('option-uuid', 'member-uuid', 'question-uuid');
```

### 5. 集計・結果表示

```sql
-- 投票数集計
SELECT
  o.id,
  o.content,
  t.name as team_name,
  COUNT(v.id) as vote_count
FROM options o
LEFT JOIN votes v ON v.option_id = o.id
LEFT JOIN teams t ON t.id = o.team_id
WHERE o.question_id = 'question-uuid'
GROUP BY o.id, o.content, t.name
ORDER BY vote_count DESC;

-- スコア更新（1位のチームに得点）
UPDATE teams SET score = score + 100
WHERE id = (
  SELECT o.team_id FROM options o
  LEFT JOIN votes v ON v.option_id = o.id
  WHERE o.question_id = 'question-uuid'
  GROUP BY o.id, o.team_id
  ORDER BY COUNT(v.id) DESC
  LIMIT 1
);

-- 問題を終了
UPDATE questions SET status = 'finished', finished_at = NOW()
WHERE id = 'question-uuid';
```

---

## 拡張可能な部分

この設計は以下のような拡張が簡単にできます：

- **複数回答**: `options` の UNIQUE 制約を外せば、1チーム複数回答可能
- **重み付け投票**: `votes` テーブルに `weight` カラム追加
- **匿名投票**: `votes` から `member_id` を外す
- **画像アップロード**: `options.image_url` を使用
- **複数の投票**: UNIQUE 制約を調整
- **タイマー**: `questions.time_limit` と `started_at` で計算

---

## 技術スタック案

### おすすめ: Supabase

```bash
# Supabaseプロジェクト作成後
npm install @supabase/supabase-js

# 環境変数設定
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 代替: Vercel Postgres

```bash
npm install @vercel/postgres

# Vercelダッシュボードで Postgres を有効化
```

### 軽量実装: JSON ファイル or インメモリ

```typescript
// データ永続化が不要な場合
// Server Actions でメモリ内保存
```

---

## リアルタイム同期の実装方針

### Supabase の場合（推奨）

```typescript
// リアルタイムサブスクリプション
supabase
  .channel('game-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'questions'
  }, (payload) => {
    // UI更新
  })
  .subscribe()
```

### シンプルな実装

```typescript
// 5秒ごとにポーリング
setInterval(async () => {
  const response = await fetch('/api/game-state')
  const data = await response.json()
  updateUI(data)
}, 5000)
```

---

## 次のステップ

1. Supabase プロジェクト作成
2. 上記SQLを実行してテーブル作成
3. Next.js で API Routes 実装
4. 画面実装（Setup → GameMaster → Dashboard → Member）

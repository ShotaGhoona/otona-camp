-- チームテーブル
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT,
  score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- メンバーテーブル
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 問題テーブル
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  question_type TEXT NOT NULL,
  time_limit INTEGER,
  points INTEGER DEFAULT 100,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  finished_at TIMESTAMP
);

-- 回答選択肢テーブル
CREATE TABLE options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(question_id, team_id)
);

-- 投票テーブル
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID REFERENCES options(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(question_id, member_id)
);

-- ゲーム状態テーブル
CREATE TABLE game_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  current_question_id UUID REFERENCES questions(id),
  phase TEXT DEFAULT 'setup',
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK (id = 1)
);

-- 初期レコード挿入
INSERT INTO game_state (id) VALUES (1);

-- インデックス作成（パフォーマンス向上）
CREATE INDEX idx_members_team_id ON members(team_id);
CREATE INDEX idx_options_question_id ON options(question_id);
CREATE INDEX idx_options_team_id ON options(team_id);
CREATE INDEX idx_votes_question_id ON votes(question_id);
CREATE INDEX idx_votes_option_id ON votes(option_id);
CREATE INDEX idx_votes_member_id ON votes(member_id);
CREATE INDEX idx_questions_status ON questions(status);

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

export type QuestionStatus = 'draft' | 'active' | 'voting' | 'finished'
export type QuestionType = 'text' | 'image' | 'both'

export type Question = {
  id: string
  title: string
  description: string | null
  question_type: QuestionType
  time_limit: number | null
  points: number
  status: QuestionStatus
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

export type GameState = {
  id: number
  current_question_id: string | null
  phase: 'setup' | 'playing' | 'finished'
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      teams: {
        Row: Team
        Insert: Omit<Team, 'id' | 'created_at' | 'score'> & { score?: number }
        Update: Partial<Omit<Team, 'id' | 'created_at'>>
      }
      members: {
        Row: Member
        Insert: Omit<Member, 'id' | 'created_at'>
        Update: Partial<Omit<Member, 'id' | 'created_at'>>
      }
      questions: {
        Row: Question
        Insert: Omit<Question, 'id' | 'created_at' | 'started_at' | 'finished_at'> & { status?: QuestionStatus }
        Update: Partial<Omit<Question, 'id' | 'created_at'>>
      }
      options: {
        Row: Option
        Insert: Omit<Option, 'id' | 'created_at'>
        Update: Partial<Omit<Option, 'id' | 'created_at'>>
      }
      votes: {
        Row: Vote
        Insert: Omit<Vote, 'id' | 'created_at'>
        Update: Partial<Omit<Vote, 'id' | 'created_at'>>
      }
      game_state: {
        Row: GameState
        Insert: Partial<GameState>
        Update: Partial<Omit<GameState, 'id'>>
      }
    }
  }
}

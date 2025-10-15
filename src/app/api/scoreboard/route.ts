import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/scoreboard
 * スコアボード取得
 */
export async function GET() {
  try {
    // 全チーム取得（スコア順）
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, color, score')
      .order('score', { ascending: false })

    if (teamsError) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: teamsError.message } },
        { status: 500 }
      )
    }

    // 各チームのメンバー数を取得
    const teamsWithMemberCount = await Promise.all(
      (teams || []).map(async (team, index) => {
        const { count } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', team.id)

        return {
          rank: index + 1,
          team_id: team.id,
          team_name: team.name,
          team_color: team.color,
          score: team.score,
          member_count: count || 0,
        }
      })
    )

    // 完了した問題数と総問題数
    const { count: totalQuestions } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })

    const { count: completedQuestions } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'finished')

    return NextResponse.json({
      teams: teamsWithMemberCount,
      total_questions: totalQuestions || 0,
      completed_questions: completedQuestions || 0,
    })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

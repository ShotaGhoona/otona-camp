import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // チーム一覧を取得（スコア降順）
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .order('score', { ascending: false })

    if (teamsError) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: teamsError.message } },
        { status: 500 }
      )
    }

    // 各チームのメンバー数を取得
    const teamsWithInfo = await Promise.all(
      ((teams as any[]) || []).map(async (team, index) => {
        const { count: memberCount } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', team.id)

        return {
          rank: index + 1,
          team_id: team.id,
          team_name: team.name,
          team_color: team.color,
          score: team.score,
          member_count: memberCount || 0
        }
      })
    )

    // 問題の統計情報を取得
    const { count: totalQuestions } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })

    const { count: completedQuestions } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'finished')

    const response = {
      teams: teamsWithInfo,
      total_questions: totalQuestions || 0,
      completed_questions: completedQuestions || 0
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
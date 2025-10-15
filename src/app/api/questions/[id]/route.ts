import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/questions/:id
 * 問題詳細取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const memberId = request.headers.get('Authorization')
    const teamId = request.headers.get('X-Team-ID')

    // 問題情報取得
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single()

    if (questionError || !question) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Question not found' } },
        { status: 404 }
      )
    }

    // 自チームの回答状況
    let myTeamAnswered = false
    if (teamId) {
      const { data: option } = await supabase
        .from('options')
        .select('id')
        .eq('question_id', id)
        .eq('team_id', teamId)
        .single()

      myTeamAnswered = !!option
    }

    // 総チーム数と回答済みチーム数
    const { count: totalTeams } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })

    const { count: answeredTeams } = await supabase
      .from('options')
      .select('*', { count: 'exact', head: true })
      .eq('question_id', id)

    // 自分の投票状況
    let myVoted = false
    if (memberId) {
      const { data: vote } = await supabase
        .from('votes')
        .select('id')
        .eq('question_id', id)
        .eq('member_id', memberId)
        .single()

      myVoted = !!vote
    }

    // 総メンバー数と投票数
    const { count: totalMembers } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })

    const { count: totalVotes } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('question_id', id)

    return NextResponse.json({
      ...question,
      my_team_answered: myTeamAnswered,
      total_teams: totalTeams || 0,
      answered_teams: answeredTeams || 0,
      my_voted: myVoted,
      total_members: totalMembers || 0,
      total_votes: totalVotes || 0,
    })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

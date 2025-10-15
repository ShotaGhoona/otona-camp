import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const questionId = (await params).id
    const memberId = request.headers.get('Authorization')

    // 問題詳細を取得
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single()

    if (questionError || !question) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Question not found' } },
        { status: 404 }
      )
    }

    // チーム数を取得
    const { count: totalTeams } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })

    // 回答済みチーム数を取得
    const { count: answeredTeams } = await supabase
      .from('options')
      .select('*', { count: 'exact', head: true })
      .eq('question_id', questionId)

    let myTeamAnswered = false
    let myVoted = false
    let totalVotes = 0
    let totalMembers = 0

    if (memberId) {
      // 自分のチームが回答済みか確認
      const { data: member } = await supabase
        .from('members')
        .select('team_id')
        .eq('id', memberId)
        .single()

      if (member) {
        const { data: teamOption } = await supabase
          .from('options')
          .select('*')
          .eq('question_id', questionId)
          .eq('team_id', (member as any).team_id)
          .single()

        myTeamAnswered = !!teamOption
      }

      // 自分が投票済みか確認
      const { data: myVote } = await supabase
        .from('votes')
        .select('*')
        .eq('question_id', questionId)
        .eq('member_id', memberId)
        .single()

      myVoted = !!myVote
    }

    // 投票数を取得
    const { count: voteCount } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('question_id', questionId)

    totalVotes = voteCount || 0

    // 総メンバー数を取得
    const { count: memberCount } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })

    totalMembers = memberCount || 0

    const response = {
      ...(question as any),
      my_team_answered: myTeamAnswered,
      total_teams: totalTeams || 0,
      answered_teams: answeredTeams || 0,
      my_voted: myVoted,
      total_votes: totalVotes,
      total_members: totalMembers
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
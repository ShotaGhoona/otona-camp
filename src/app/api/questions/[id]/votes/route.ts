import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * POST /api/questions/:id/votes
 * 投票
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const memberId = request.headers.get('Authorization')
    const body = await request.json()
    const { option_id } = body

    if (!memberId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Member ID is required' } },
        { status: 401 }
      )
    }

    if (!option_id) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Option ID is required' } },
        { status: 400 }
      )
    }

    // 問題のステータス確認
    const { data: question } = await supabase
      .from('questions')
      .select('status')
      .eq('id', id)
      .single()

    if (!question) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Question not found' } },
        { status: 404 }
      )
    }

    if (question.status !== 'voting') {
      return NextResponse.json(
        { error: { code: 'INVALID_STATUS', message: 'Question is not accepting votes' } },
        { status: 400 }
      )
    }

    // 既に投票済みか確認
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('question_id', id)
      .eq('member_id', memberId)
      .single()

    if (existingVote) {
      return NextResponse.json(
        { error: { code: 'ALREADY_VOTED', message: 'Member has already voted' } },
        { status: 400 }
      )
    }

    // メンバーのチームIDを取得
    const { data: member } = await supabase
      .from('members')
      .select('team_id')
      .eq('id', memberId)
      .single()

    if (!member) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Member not found' } },
        { status: 404 }
      )
    }

    // 選択肢のチームIDを取得
    const { data: option } = await supabase
      .from('options')
      .select('team_id')
      .eq('id', option_id)
      .single()

    if (!option) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Option not found' } },
        { status: 404 }
      )
    }

    // 自分のチームには投票不可
    if (member.team_id === option.team_id) {
      return NextResponse.json(
        { error: { code: 'CANNOT_VOTE_OWN_TEAM', message: 'Cannot vote for your own team' } },
        { status: 400 }
      )
    }

    // 投票作成
    const { data, error } = await supabase
      .from('votes')
      .insert({
        option_id,
        member_id: memberId,
        question_id: id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: error.message } },
        { status: 400 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

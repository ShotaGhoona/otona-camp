import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const questionId = (await params).id
    const body = await request.json()
    const memberId = request.headers.get('Authorization')

    if (!memberId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authorization required' } },
        { status: 401 }
      )
    }

    if (!body.option_id) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'option_id is required' } },
        { status: 400 }
      )
    }

    // 問題のステータスを確認
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('status')
      .eq('id', questionId)
      .single()

    if (questionError || !question) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Question not found' } },
        { status: 404 }
      )
    }

    if ((question as any).status !== 'voting') {
      return NextResponse.json(
        { error: { code: 'INVALID_STATUS', message: 'Voting is not active' } },
        { status: 400 }
      )
    }

    // 選択肢が存在するか確認
    const { data: option, error: optionError } = await supabase
      .from('options')
      .select('team_id')
      .eq('id', body.option_id)
      .eq('question_id', questionId)
      .single()

    if (optionError || !option) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Option not found' } },
        { status: 404 }
      )
    }

    // 自分のチームIDを取得
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

    // 自分のチームには投票不可
    if ((option as any).team_id === (member as any).team_id) {
      return NextResponse.json(
        { error: { code: 'CANNOT_VOTE_OWN_TEAM', message: 'Cannot vote for own team' } },
        { status: 400 }
      )
    }

    // 既に投票済みか確認
    const { data: existingVote } = await supabase
      .from('votes')
      .select('*')
      .eq('question_id', questionId)
      .eq('member_id', memberId)
      .single()

    if (existingVote) {
      return NextResponse.json(
        { error: { code: 'ALREADY_VOTED', message: 'Already voted' } },
        { status: 400 }
      )
    }

    // 投票を作成
    const { data, error } = await supabase
      .from('votes')
      .insert({
        option_id: body.option_id,
        member_id: memberId,
        question_id: questionId
      } as any)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: error.message } },
        { status: 400 }
      )
    }

    return NextResponse.json(data as any, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
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
    const teamId = request.headers.get('X-Team-ID')

    if (!memberId || !teamId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authorization required' } },
        { status: 401 }
      )
    }

    // contentまたはimage_urlが必須
    if (!body.content && !body.image_url) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Content or image_url is required' } },
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

    if ((question as any).status !== 'active') {
      return NextResponse.json(
        { error: { code: 'INVALID_STATUS', message: 'Question is not active' } },
        { status: 400 }
      )
    }

    // 既に回答済みか確認
    const { data: existingOption } = await supabase
      .from('options')
      .select('*')
      .eq('question_id', questionId)
      .eq('team_id', teamId)
      .single()

    if (existingOption) {
      return NextResponse.json(
        { error: { code: 'ALREADY_ANSWERED', message: 'Team already answered' } },
        { status: 400 }
      )
    }

    // 回答を作成
    const { data, error } = await supabase
      .from('options')
      .insert({
        question_id: questionId,
        team_id: teamId,
        content: body.content || null,
        image_url: body.image_url || null
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const questionId = (await params).id
    const memberId = request.headers.get('Authorization')

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

    // 自分のチームIDを取得
    let myTeamId = null
    if (memberId) {
      const { data: member } = await supabase
        .from('members')
        .select('team_id')
        .eq('id', memberId)
        .single()
      
      if (member) {
        myTeamId = (member as any).team_id
      }
    }

    // 回答一覧を取得
    const { data: options, error } = await supabase
      .from('options')
      .select('*, teams!inner(name, color)')
      .eq('question_id', questionId)

    if (error) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    // チーム総数を取得
    const { count: totalTeams } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })

    const questionStatus = (question as any).status

    // レスポンスを組み立て
    const formattedOptions = (options || []).map((option: any) => {
      const isMyTeam = option.team_id === myTeamId
      
      // activeステータスの場合、他チームのcontentは伏せる
      const content = questionStatus === 'active' && !isMyTeam ? '***' : option.content

      const formattedOption: any = {
        id: option.id,
        team_id: option.team_id,
        team_name: option.teams.name,
        team_color: option.teams.color,
        content: content,
        image_url: option.image_url,
        is_my_team: isMyTeam
      }

      // voting/finishedステータスの場合は投票数を追加
      if (questionStatus === 'voting' || questionStatus === 'finished') {
        // 投票数を取得（実際の実装では事前に取得した方が効率的）
        formattedOption.vote_count = 0 // TODO: 実際の投票数を取得
      }

      return formattedOption
    })

    const response: any = {
      options: formattedOptions,
      total_options: options?.length || 0,
      total_teams: totalTeams || 0
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
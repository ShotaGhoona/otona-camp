import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/questions/:id/options
 * 回答一覧取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const teamId = request.headers.get('X-Team-ID')

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

    // 回答とチーム情報を取得
    const { data: options, error } = await supabase
      .from('options')
      .select(`
        id,
        team_id,
        content,
        image_url,
        created_at
      `)
      .eq('question_id', id)

    if (error) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    // チーム情報を追加
    const optionsWithTeam = await Promise.all(
      (options || []).map(async (option) => {
        const { data: team } = await supabase
          .from('teams')
          .select('name, color')
          .eq('id', option.team_id)
          .single()

        // 投票フェーズ前は他チームの内容を伏せる
        let content = option.content
        if (question.status === 'active' && option.team_id !== teamId) {
          content = '***'
        }

        // 投票数を取得（voting/finished ステータスの場合のみ）
        let voteCount = 0
        if (question.status === 'voting' || question.status === 'finished') {
          const { count } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('option_id', option.id)

          voteCount = count || 0
        }

        return {
          id: option.id,
          team_id: option.team_id,
          team_name: team?.name || '',
          team_color: team?.color || null,
          content,
          image_url: option.image_url,
          is_my_team: option.team_id === teamId,
          vote_count: voteCount,
        }
      })
    )

    // 総チーム数
    const { count: totalTeams } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      options: optionsWithTeam,
      total_options: optionsWithTeam.length,
      total_teams: totalTeams || 0,
    })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

/**
 * POST /api/questions/:id/options
 * 回答作成
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const teamId = request.headers.get('X-Team-ID')
    const body = await request.json()
    const { content, image_url } = body

    if (!teamId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Team ID is required' } },
        { status: 401 }
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

    if (question.status !== 'active') {
      return NextResponse.json(
        { error: { code: 'INVALID_STATUS', message: 'Question is not accepting answers' } },
        { status: 400 }
      )
    }

    // 既に回答済みか確認
    const { data: existing } = await supabase
      .from('options')
      .select('id')
      .eq('question_id', id)
      .eq('team_id', teamId)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: { code: 'ALREADY_ANSWERED', message: 'Team has already answered' } },
        { status: 400 }
      )
    }

    // 回答作成
    const { data, error } = await supabase
      .from('options')
      .insert({
        question_id: id,
        team_id: teamId,
        content: content || null,
        image_url: image_url || null,
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

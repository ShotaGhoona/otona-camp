import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * POST /api/members
 * メンバー登録（ログイン）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, team_id } = body

    if (!name || !team_id) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Name and team_id are required' } },
        { status: 400 }
      )
    }

    // チームが存在するか確認
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name')
      .eq('id', team_id)
      .single()

    if (teamError || !team) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Team not found' } },
        { status: 404 }
      )
    }

    // メンバー作成
    const { data, error } = await supabase
      .from('members')
      .insert({
        name,
        team_id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: error.message } },
        { status: 400 }
      )
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      team_id: data.team_id,
      team_name: team.name,
      created_at: data.created_at,
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

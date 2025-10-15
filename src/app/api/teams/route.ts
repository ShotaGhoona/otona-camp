import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/teams
 * チーム一覧取得
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, color, score, created_at')
      .order('score', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    // メンバー数を取得
    const teamsWithCount = await Promise.all(
      (data || []).map(async (team) => {
        const { count } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', team.id)

        return {
          ...team,
          member_count: count || 0,
        }
      })
    )

    return NextResponse.json({ teams: teamsWithCount })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

/**
 * POST /api/teams
 * チーム作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, color } = body

    if (!name) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Team name is required' } },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('teams')
      .insert({
        name,
        color: color || null,
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

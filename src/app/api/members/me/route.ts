import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/members/me
 * 自分の情報取得
 */
export async function GET(request: NextRequest) {
  try {
    const memberId = request.headers.get('Authorization')

    if (!memberId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Member ID is required' } },
        { status: 401 }
      )
    }

    // メンバー情報とチーム情報を取得
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, name, team_id')
      .eq('id', memberId)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Member not found' } },
        { status: 404 }
      )
    }

    // チーム情報を取得
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name, color, score')
      .eq('id', member.team_id)
      .single()

    if (teamError || !team) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Team not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: member.id,
      name: member.name,
      team: {
        id: team.id,
        name: team.name,
        color: team.color,
        score: team.score,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

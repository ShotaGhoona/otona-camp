import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

export async function GET() {
  try {
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
    const teamsWithMemberCount = await Promise.all(
      (teams as any[]).map(async (team) => {
        const { count } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', team.id)
        
        return {
          ...team,
          member_count: count || 0
        }
      })
    )

    return NextResponse.json({ teams: teamsWithMemberCount })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Team name is required' } },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('teams')
      .insert({
        name: body.name,
        color: body.color || null
      } as any)
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
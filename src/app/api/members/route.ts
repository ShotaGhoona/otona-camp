import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // バリデーション
    if (!body.name || !body.team_id) {
      return NextResponse.json(
        { 
          error: { 
            code: 'INVALID_REQUEST', 
            message: 'Name and team_id are required' 
          } 
        },
        { status: 400 }
      )
    }

    // チームが存在するかチェック
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', body.team_id)
      .single()

    if (teamError || !team) {
      return NextResponse.json(
        { 
          error: { 
            code: 'NOT_FOUND', 
            message: 'Team not found' 
          } 
        },
        { status: 404 }
      )
    }

    // メンバーを作成
    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert({
        name: body.name,
        team_id: body.team_id
      } as any)
      .select()
      .single()

    if (memberError) {
      return NextResponse.json(
        { 
          error: { 
            code: 'DB_ERROR', 
            message: memberError.message 
          } 
        },
        { status: 400 }
      )
    }

    // レスポンスにteam_nameを追加
    const response = {
      ...(member as any),
      team_name: (team as any).name
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Internal server error' 
        } 
      },
      { status: 500 }
    )
  }
}
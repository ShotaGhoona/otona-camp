import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // ヘッダーからmember_idを取得
    const memberId = request.headers.get('Authorization')

    if (!memberId) {
      return NextResponse.json(
        { 
          error: { 
            code: 'UNAUTHORIZED', 
            message: 'Member ID is required' 
          } 
        },
        { status: 401 }
      )
    }

    // メンバー情報を取得
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { 
          error: { 
            code: 'NOT_FOUND', 
            message: 'Member not found' 
          } 
        },
        { status: 404 }
      )
    }

    // チーム情報を取得
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', (member as any).team_id)
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

    // レスポンスを組み立て
    const response = {
      id: (member as any).id,
      name: (member as any).name,
      team: {
        id: (team as any).id,
        name: (team as any).name,
        color: (team as any).color,
        score: (team as any).score
      }
    }

    return NextResponse.json(response)
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
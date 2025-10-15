import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // バリデーション
    if (!body.title || !body.question_type) {
      return NextResponse.json(
        { 
          error: { 
            code: 'INVALID_REQUEST', 
            message: 'Title and question_type are required' 
          } 
        },
        { status: 400 }
      )
    }

    // 問題を作成
    const { data, error } = await supabase
      .from('questions')
      .insert({
        title: body.title,
        description: body.description || null,
        question_type: body.question_type,
        time_limit: body.time_limit || null,
        points: body.points || 100,
        status: 'draft'
      } as any)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: error.message } },
        { status: 400 }
      )
    }

    return NextResponse.json({
      id: (data as any).id,
      title: (data as any).title,
      status: (data as any).status,
      created_at: (data as any).created_at
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    let query = supabase.from('questions').select('*')

    // ステータスフィルター
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({ questions: data || [] })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
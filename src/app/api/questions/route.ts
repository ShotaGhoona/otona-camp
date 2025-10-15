import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/questions
 * 問題一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

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

/**
 * POST /api/questions
 * 問題作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, question_type, time_limit, points } = body

    if (!title || !question_type) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Title and question_type are required' } },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('questions')
      .insert({
        title,
        description: description || null,
        question_type,
        time_limit: time_limit || null,
        points: points || 100,
        status: 'draft',
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

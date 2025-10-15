import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const questionId = (await params).id
    const body = await request.json()

    if (!body.status) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Status is required' } },
        { status: 400 }
      )
    }

    // ステータスの妥当性チェック
    const validStatuses = ['draft', 'active', 'voting', 'finished']
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Invalid status' } },
        { status: 400 }
      )
    }

    // 現在の問題を取得
    const { data: currentQuestion, error: fetchError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single()

    if (fetchError || !currentQuestion) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Question not found' } },
        { status: 404 }
      )
    }

    // ステータス更新用のデータを準備
    const updateData: any = { status: body.status }

    // activeに変更時はstarted_atを設定
    if (body.status === 'active' && !(currentQuestion as any).started_at) {
      updateData.started_at = new Date().toISOString()
    }

    // finishedに変更時はfinished_atを設定
    if (body.status === 'finished' && !(currentQuestion as any).finished_at) {
      updateData.finished_at = new Date().toISOString()
    }

    // ステータスを更新
    const { data, error } = await (supabase as any)
      .from('questions')
      .update(updateData)
      .eq('id', questionId)
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
      status: (data as any).status,
      started_at: (data as any).started_at,
      finished_at: (data as any).finished_at
    })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
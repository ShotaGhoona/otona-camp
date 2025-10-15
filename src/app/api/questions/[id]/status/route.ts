import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * PATCH /api/questions/:id/status
 * 問題ステータス更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Status is required' } },
        { status: 400 }
      )
    }

    // ステータスの検証
    const validStatuses = ['draft', 'active', 'voting', 'finished']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Invalid status' } },
        { status: 400 }
      )
    }

    const updateData: any = { status }

    // ステータスに応じてタイムスタンプを更新
    if (status === 'active') {
      updateData.started_at = new Date().toISOString()
    } else if (status === 'finished') {
      updateData.finished_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('questions')
      .update(updateData)
      .eq('id', id)
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
      status: data.status,
      started_at: data.started_at,
      finished_at: data.finished_at,
    })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

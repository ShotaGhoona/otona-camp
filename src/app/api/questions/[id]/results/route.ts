import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const questionId = (await params).id

    // 問題情報を取得
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single()

    if (questionError || !question) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Question not found' } },
        { status: 404 }
      )
    }

    // finishedステータスでない場合はアクセス不可
    if ((question as any).status !== 'finished') {
      return NextResponse.json(
        { error: { code: 'INVALID_STATUS', message: 'Results not available yet' } },
        { status: 400 }
      )
    }

    // 各回答の投票数を集計
    const { data: options, error: optionsError } = await supabase
      .from('options')
      .select('*, teams!inner(name, color)')
      .eq('question_id', questionId)

    if (optionsError) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: optionsError.message } },
        { status: 500 }
      )
    }

    // 各オプションの投票数を取得
    const optionsWithVotes = await Promise.all(
      (options || []).map(async (option: any) => {
        const { count } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('option_id', option.id)

        return {
          ...option,
          vote_count: count || 0
        }
      })
    )

    // 投票数でソートして順位を付ける
    optionsWithVotes.sort((a, b) => b.vote_count - a.vote_count)

    // 結果を整形
    const results = optionsWithVotes.map((option, index) => {
      // ポイント計算（1位: 300pt, 2位: 100pt, 3位: 50pt）
      let pointsEarned = 0
      if (index === 0 && option.vote_count > 0) pointsEarned = 300
      else if (index === 1 && option.vote_count > 0) pointsEarned = 100
      else if (index === 2 && option.vote_count > 0) pointsEarned = 50

      return {
        rank: index + 1,
        option_id: option.id,
        team_id: option.team_id,
        team_name: option.teams.name,
        team_color: option.teams.color,
        content: option.content,
        image_url: option.image_url,
        vote_count: option.vote_count,
        points_earned: pointsEarned
      }
    })

    // 総投票数を取得
    const { count: totalVotes } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('question_id', questionId)

    // スコアを更新（1位のチームのみ）
    if (results.length > 0 && results[0].vote_count > 0) {
      const { data: currentTeam } = await supabase
        .from('teams')
        .select('score')
        .eq('id', results[0].team_id)
        .single()
      
      if (currentTeam) {
        await (supabase as any)
          .from('teams')
          .update({ 
            score: (currentTeam as { score: number }).score + results[0].points_earned
          })
          .eq('id', results[0].team_id)
      }
    }

    const response = {
      question: {
        id: (question as any).id,
        title: (question as any).title,
        points: (question as any).points,
        status: (question as any).status
      },
      results: results,
      total_votes: totalVotes || 0
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
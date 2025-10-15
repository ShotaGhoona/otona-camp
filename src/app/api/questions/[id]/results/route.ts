import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/questions/:id/results
 * 問題の結果取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // 問題情報取得
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('id, title, points, status')
      .eq('id', id)
      .single()

    if (questionError || !question) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Question not found' } },
        { status: 404 }
      )
    }

    // 回答一覧と投票数を取得
    const { data: options, error: optionsError } = await supabase
      .from('options')
      .select('id, team_id, content, image_url')
      .eq('question_id', id)

    if (optionsError) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: optionsError.message } },
        { status: 500 }
      )
    }

    // 各選択肢の投票数とチーム情報を取得
    const results = await Promise.all(
      (options || []).map(async (option) => {
        // 投票数カウント
        const { count } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('option_id', option.id)

        // チーム情報取得
        const { data: team } = await supabase
          .from('teams')
          .select('name, color')
          .eq('id', option.team_id)
          .single()

        return {
          option_id: option.id,
          team_id: option.team_id,
          team_name: team?.name || '',
          team_color: team?.color || null,
          content: option.content,
          image_url: option.image_url,
          vote_count: count || 0,
        }
      })
    )

    // 投票数でソート（降順）
    results.sort((a, b) => b.vote_count - a.vote_count)

    // 順位とポイントを付与
    const resultsWithRank = results.map((result, index) => {
      let pointsEarned = 0

      // 1位: 満点の3倍、2位: 満点、3位: 満点の半分
      if (index === 0) {
        pointsEarned = question.points * 3
      } else if (index === 1) {
        pointsEarned = question.points
      } else if (index === 2) {
        pointsEarned = Math.floor(question.points * 0.5)
      }

      return {
        rank: index + 1,
        ...result,
        points_earned: pointsEarned,
      }
    })

    // 総投票数
    const { count: totalVotes } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('question_id', id)

    // スコア更新（問題がfinishedステータスの場合のみ）
    if (question.status === 'finished') {
      for (const result of resultsWithRank) {
        if (result.points_earned > 0) {
          await supabase
            .from('teams')
            .update({
              score: supabase.rpc('increment', { x: result.points_earned })
            })
            .eq('id', result.team_id)

          // RPCがない場合の代替: 現在のスコアを取得して加算
          const { data: teamData } = await supabase
            .from('teams')
            .select('score')
            .eq('id', result.team_id)
            .single()

          if (teamData) {
            await supabase
              .from('teams')
              .update({ score: (teamData.score || 0) + result.points_earned })
              .eq('id', result.team_id)
          }
        }
      }
    }

    return NextResponse.json({
      question: {
        id: question.id,
        title: question.title,
        points: question.points,
        status: question.status,
      },
      results: resultsWithRank,
      total_votes: totalVotes || 0,
    })
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

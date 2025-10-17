import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Upload API Called ===')
    
    // Supabaseクライアントの確認
    console.log('Supabase client check:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
    })
    
    const formData = await request.formData()
    const file = formData.get('file') as File

    console.log('File received:', {
      name: file?.name,
      size: file?.size,
      type: file?.type
    })

    if (!file) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'No file provided' } },
        { status: 400 }
      )
    }

    // ファイルタイプの検証
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Only image files are allowed' } },
        { status: 400 }
      )
    }

    // ファイルサイズの検証（5MB制限）
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'File size must be less than 5MB' } },
        { status: 400 }
      )
    }

    // ファイル名を生成（タイムスタンプ + ランダム文字列）
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}_${randomString}.${fileExtension}`

    // Supabase Storageにアップロード
    console.log('Uploading to Supabase Storage:', fileName)
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return NextResponse.json(
        { error: { code: 'UPLOAD_ERROR', message: `Failed to upload file: ${error.message}` } },
        { status: 500 }
      )
    }

    console.log('Upload successful:', data)

    // 公開URLを取得
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName)

    console.log('Public URL generated:', urlData.publicUrl)

    return NextResponse.json({
      url: urlData.publicUrl,
      fileName: fileName
    })

  } catch (error) {
    console.error('Upload error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` } },
      { status: 500 }
    )
  }
}

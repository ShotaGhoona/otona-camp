/**
 * 画像アップロード用ヘルパー関数
 */

export interface UploadResult {
  url: string
  fileName: string
}

export interface UploadError {
  code: string
  message: string
}

/**
 * ファイルをSupabase Storageにアップロード
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Upload failed')
  }

  return response.json()
}

/**
 * ファイルの検証
 */
export function validateFile(file: File): { isValid: boolean; error?: string } {
  // ファイルタイプの検証
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: '画像ファイルのみアップロード可能です' }
  }

  // ファイルサイズの検証（5MB制限）
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'ファイルサイズは5MB以下にしてください' }
  }

  return { isValid: true }
}

/**
 * ファイルサイズを人間が読みやすい形式に変換
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 画像プレビューのためのURLを生成
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}

/**
 * プレビューURLをクリーンアップ
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url)
}

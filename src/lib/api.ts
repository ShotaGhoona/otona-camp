/**
 * API呼び出しヘルパー
 * セッション情報を自動的にヘッダーに付与
 */

import { getMemberId, getTeamId } from './session'

export async function apiClient(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const memberId = getMemberId()
  const teamId = getTeamId()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  // セッション情報があればヘッダーに追加
  if (memberId) {
    headers['Authorization'] = memberId
  }
  if (teamId) {
    headers['X-Team-ID'] = teamId
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

/**
 * GET リクエストヘルパー
 */
export async function get<T>(url: string): Promise<T> {
  const response = await apiClient(url, { method: 'GET' })
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`)
  }
  return response.json()
}

/**
 * POST リクエストヘルパー
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function post<T>(url: string, data?: any): Promise<T> {
  const response = await apiClient(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`)
  }
  return response.json()
}

/**
 * PATCH リクエストヘルパー
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function patch<T>(url: string, data?: any): Promise<T> {
  const response = await apiClient(url, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  })
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`)
  }
  return response.json()
}

/**
 * セッション管理ヘルパー
 * LocalStorageを使用してメンバーIDとチームIDを管理
 */

const MEMBER_ID_KEY = 'member_id'
const TEAM_ID_KEY = 'team_id'
const MEMBER_NAME_KEY = 'member_name'

export function getMemberId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(MEMBER_ID_KEY)
}

export function getTeamId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TEAM_ID_KEY)
}

export function getMemberName(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(MEMBER_NAME_KEY)
}

export function setSession(memberId: string, teamId: string, memberName: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(MEMBER_ID_KEY, memberId)
  localStorage.setItem(TEAM_ID_KEY, teamId)
  localStorage.setItem(MEMBER_NAME_KEY, memberName)
}

export function clearSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(MEMBER_ID_KEY)
  localStorage.removeItem(TEAM_ID_KEY)
  localStorage.removeItem(MEMBER_NAME_KEY)
}

export function isAuthenticated(): boolean {
  return !!getMemberId() && !!getTeamId()
}

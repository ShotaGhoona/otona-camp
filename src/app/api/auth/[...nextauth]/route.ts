import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { supabase } from "@/lib/supabase"

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        name: { label: "名前", type: "text", placeholder: "山田太郎" },
        teamId: { label: "Team ID", type: "hidden" }
      },
      async authorize(credentials) {
        if (!credentials?.name) return null

        try {
          let member: any = null

          if (credentials.teamId) {
            // チーム指定でのログイン（チーム選択後）
            // 既存のメンバーを検索（重複作成を防ぐ）
            const { data: existingMember } = await (supabase as any)
              .from('members')
              .select('*, teams!inner(name, color, score)')
              .eq('name', credentials.name)
              .eq('team_id', credentials.teamId)
              .single()

            if (existingMember) {
              member = existingMember
            } else {
              // 新規メンバー作成
              const { data, error } = await (supabase as any)
                .from('members')
                .insert({
                  name: credentials.name,
                  team_id: credentials.teamId
                })
                .select('*, teams!inner(name, color, score)')
                .single()

              if (error || !data) {
                return null
              }
              member = data
            }
          } else {
            // チーム未選択でのログイン（初回ログイン）
            // メンバーIDのみ生成してセッションに保存
            // 実際のメンバーレコードはチーム選択時に作成
            return {
              id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: credentials.name,
              teamId: null,
              teamName: null,
              teamColor: null,
              teamScore: 0
            }
          }

          return {
            id: (member as any).id,
            name: (member as any).name,
            teamId: (member as any).team_id,
            teamName: (member as any).teams?.name,
            teamColor: (member as any).teams?.color,
            teamScore: (member as any).teams?.score || 0
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30日間
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.teamId = user.teamId
        token.teamName = user.teamName
        token.teamColor = user.teamColor
        token.teamScore = user.teamScore
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.teamId = token.teamId as string
        session.user.teamName = token.teamName as string
        session.user.teamColor = token.teamColor as string
        session.user.teamScore = token.teamScore as number
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  }
})

export { handler as GET, handler as POST }
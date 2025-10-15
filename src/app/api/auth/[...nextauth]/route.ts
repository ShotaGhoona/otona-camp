import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { apiClient } from "@/lib/api"

const handler = NextAuth({
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
          // 既存のメンバーAPIを使用してユーザー情報を作成/取得
          // MVP版なので名前だけで認証（実際のプロダクションではパスワードなど追加）
          return {
            id: credentials.name, // 一時的にnameをIDとして使用
            name: credentials.name,
            teamId: credentials.teamId || null
          }
        } catch (error) {
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
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.teamId = token.teamId as string | null
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
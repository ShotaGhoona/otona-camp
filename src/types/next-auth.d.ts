import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      teamId: string | null
    }
  }

  interface User {
    id: string
    name: string
    teamId: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    name: string
    teamId: string | null
  }
}
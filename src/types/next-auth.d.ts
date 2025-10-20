import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      role: string
      loyaltyPoints: number
      phone?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    loyaltyPoints: number
    phone?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    loyaltyPoints: number
    phone?: string | null
  }
}

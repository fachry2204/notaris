import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { user, admin } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        // 1. Check admin table
        const admins = await db.select().from(admin).where(eq(admin.username, credentials.username)).limit(1);
        if (admins.length > 0) {
          const foundAdmin = admins[0];
          if (!foundAdmin.isActive) return null;
          const isPasswordValid = await bcrypt.compare(credentials.password, foundAdmin.passwordHash);
          if (!isPasswordValid) return null;
          return {
            id: foundAdmin.id,
            username: foundAdmin.username,
            email: foundAdmin.email,
            fullName: foundAdmin.fullName,
            role: foundAdmin.role,
          } as any;
        }

        // 2. Check user table (Pegawai)
        const users = await db.select().from(user).where(eq(user.username, credentials.username)).limit(1);
        if (users.length > 0) {
          const foundUser = users[0];
          if (!foundUser.isActive) return null;
          const isPasswordValid = await bcrypt.compare(credentials.password, foundUser.passwordHash);
          if (!isPasswordValid) return null;
          return {
            id: foundUser.id,
            username: foundUser.username,
            email: foundUser.email,
            fullName: foundUser.fullName,
            role: foundUser.role,
          } as any;
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.username = (user as any).username;
        token.role = (user as any).role;
        token.fullName = (user as any).fullName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
        session.user.fullName = token.fullName as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

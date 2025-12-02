import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnHistory = nextUrl.pathname.startsWith('/history');

      if (isOnHistory) {
        if (isLoggedIn) return true;
        return false; // 로그인 페이지로 리다이렉트
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.accessToken = user.accessToken || '';
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: '이메일', type: 'email' },
        password: { label: '비밀번호', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const data = await response.json();

          // 백엔드 응답 형식: { success: true, data: { user, accessToken, refreshToken } }
          if (data.success && data.data?.accessToken && data.data?.user) {
            return {
              id: data.data.user.id,
              email: data.data.user.email,
              accessToken: data.data.accessToken,
            };
          }

          return null;
        } catch {
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 14 * 24 * 60 * 60, // 14일
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// NextAuth 타입 확장
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
    };
    accessToken: string;
  }

  interface User {
    id: string;
    email: string;
    accessToken?: string;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    email: string;
    accessToken: string;
  }
}

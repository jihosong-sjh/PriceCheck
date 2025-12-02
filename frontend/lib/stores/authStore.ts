/**
 * Zustand 인증 상태 스토어
 * 토큰 관리 및 인증 상태
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  // 토큰 상태
  accessToken: string | null;
  refreshToken: string | null;

  // 토큰 설정
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearTokens: () => void;

  // 인증 여부
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setAccessToken: (accessToken) => set({ accessToken }),

      clearTokens: () => set({ accessToken: null, refreshToken: null }),

      isAuthenticated: () => !!get().accessToken,
    }),
    {
      name: 'pricecheck-auth-storage', // localStorage 키
      partialize: (state) => ({
        // localStorage에 저장할 상태 (보안상 refreshToken만 저장)
        refreshToken: state.refreshToken,
      }),
    }
  )
);

// 선택자 함수들
export const useAccessToken = () => useAuthStore((state) => state.accessToken);
export const useRefreshToken = () => useAuthStore((state) => state.refreshToken);
export const useIsAuthenticated = () =>
  useAuthStore((state) => !!state.accessToken);

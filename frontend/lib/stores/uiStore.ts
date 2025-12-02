/**
 * Zustand UI 상태 스토어
 * 전역 UI 상태 관리 (모달, 로딩, 최근 검색 등)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // 전역 로딩 상태
  isLoading: boolean;
  loadingMessage: string;
  setLoading: (loading: boolean, message?: string) => void;

  // 모달 상태
  modalOpen: string | null; // 'alert' | 'bookmark' | 'confirm' | null
  modalData: unknown;
  openModal: (modal: string, data?: unknown) => void;
  closeModal: () => void;

  // 사이드바 (모바일)
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;

  // 최근 검색 기록 (localStorage 저장)
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;

  // 토스트 메시지
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // 전역 로딩 상태
      isLoading: false,
      loadingMessage: '',
      setLoading: (loading, message = '') =>
        set({ isLoading: loading, loadingMessage: message }),

      // 모달 상태
      modalOpen: null,
      modalData: null,
      openModal: (modal, data = null) => set({ modalOpen: modal, modalData: data }),
      closeModal: () => set({ modalOpen: null, modalData: null }),

      // 사이드바
      sidebarOpen: false,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      closeSidebar: () => set({ sidebarOpen: false }),

      // 최근 검색 기록
      recentSearches: [],
      addRecentSearch: (query) =>
        set((state) => ({
          recentSearches: [
            query,
            ...state.recentSearches.filter((q) => q !== query),
          ].slice(0, 5), // 최대 5개 유지
        })),
      clearRecentSearches: () => set({ recentSearches: [] }),

      // 토스트 메시지
      toast: null,
      showToast: (message, type = 'info') => {
        set({ toast: { message, type } });
        // 3초 후 자동 숨김
        setTimeout(() => {
          set({ toast: null });
        }, 3000);
      },
      hideToast: () => set({ toast: null }),
    }),
    {
      name: 'pricecheck-ui-storage', // localStorage 키
      partialize: (state) => ({
        // localStorage에 저장할 상태만 선택
        recentSearches: state.recentSearches,
      }),
    }
  )
);

// 선택자 함수들 (최적화된 구독)
export const useIsLoading = () => useUIStore((state) => state.isLoading);
export const useLoadingMessage = () => useUIStore((state) => state.loadingMessage);
export const useModalState = () =>
  useUIStore((state) => ({
    modalOpen: state.modalOpen,
    modalData: state.modalData,
  }));
export const useRecentSearches = () => useUIStore((state) => state.recentSearches);
export const useToast = () => useUIStore((state) => state.toast);

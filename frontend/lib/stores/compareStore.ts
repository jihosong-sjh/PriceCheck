/**
 * Zustand 상품 비교 스토어
 * 여러 상품의 가격 비교 상태 관리
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Category, Condition } from '@/lib/types';

// 비교 상품 항목
export interface CompareItem {
  id: string;
  productName: string;
  modelName?: string;
  category: Category;
  condition: Condition;
  recommendedPrice: number;
  priceMin: number;
  priceMax: number;
  addedAt: string;
}

interface CompareState {
  // 비교 목록 (최대 4개)
  items: CompareItem[];
  maxItems: number;

  // 상품 추가
  addItem: (item: Omit<CompareItem, 'addedAt'>) => boolean;

  // 상품 제거
  removeItem: (id: string) => void;

  // 목록 초기화
  clearAll: () => void;

  // 상품이 이미 추가되어 있는지 확인
  isInCompare: (id: string) => boolean;

  // 추가 가능 여부 확인
  canAdd: () => boolean;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      maxItems: 4,

      addItem: (item) => {
        const state = get();

        // 이미 추가된 상품인지 확인
        if (state.items.some((i) => i.id === item.id)) {
          return false;
        }

        // 최대 개수 초과 확인
        if (state.items.length >= state.maxItems) {
          return false;
        }

        set({
          items: [
            ...state.items,
            {
              ...item,
              addedAt: new Date().toISOString(),
            },
          ],
        });

        return true;
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      clearAll: () => {
        set({ items: [] });
      },

      isInCompare: (id) => {
        return get().items.some((item) => item.id === id);
      },

      canAdd: () => {
        return get().items.length < get().maxItems;
      },
    }),
    {
      name: 'pricecheck-compare-storage',
    }
  )
);

// 선택자 함수
export const useCompareItems = () => useCompareStore((state) => state.items);
export const useCompareCount = () => useCompareStore((state) => state.items.length);

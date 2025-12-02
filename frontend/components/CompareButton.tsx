'use client';

import { useCompareStore } from '@/lib/stores/compareStore';
import { useUIStore } from '@/lib/stores/uiStore';
import type { Category, Condition } from '@/lib/types';

interface CompareButtonProps {
  id: string;
  productName: string;
  modelName?: string;
  category: Category;
  condition: Condition;
  recommendedPrice: number;
  priceMin: number;
  priceMax: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function CompareButton({
  id,
  productName,
  modelName,
  category,
  condition,
  recommendedPrice,
  priceMin,
  priceMax,
  size = 'md',
}: CompareButtonProps) {
  const { items, addItem, removeItem, isInCompare, maxItems } = useCompareStore();
  const showToast = useUIStore((state) => state.showToast);

  const isAdded = isInCompare(id);
  const isFull = items.length >= maxItems;

  const handleClick = () => {
    if (isAdded) {
      removeItem(id);
      showToast('비교 목록에서 제거되었습니다.', 'info');
    } else {
      if (isFull) {
        showToast(`비교는 최대 ${maxItems}개까지 가능합니다.`, 'error');
        return;
      }

      const success = addItem({
        id,
        productName,
        modelName,
        category,
        condition,
        recommendedPrice,
        priceMin,
        priceMax,
      });

      if (success) {
        showToast('비교 목록에 추가되었습니다.', 'success');
      }
    }
  };

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${sizeClasses[size]} rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
        isAdded
          ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
      }`}
      aria-label={isAdded ? '비교 목록에서 제거' : '비교 목록에 추가'}
      title={isAdded ? '비교 목록에서 제거' : '비교하기 추가'}
    >
      <svg
        className={iconSizes[size]}
        fill={isAdded ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    </button>
  );
}

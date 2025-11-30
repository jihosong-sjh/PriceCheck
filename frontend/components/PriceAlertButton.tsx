'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import type { Category, Condition } from '@/lib/types';
import AlertModal from './AlertModal';

interface PriceAlertButtonProps {
  category: Category;
  productName: string;
  modelName?: string;
  condition: Condition;
  currentPrice: number;
}

export default function PriceAlertButton({
  category,
  productName,
  modelName,
  condition,
  currentPrice,
}: PriceAlertButtonProps) {
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!session) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
        title="가격 알림 설정"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        <span>가격 알림</span>
      </button>

      {isModalOpen && (
        <AlertModal
          category={category}
          productName={productName}
          modelName={modelName}
          condition={condition}
          suggestedPrice={currentPrice}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

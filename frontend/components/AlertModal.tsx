'use client';

import { useState } from 'react';
import { createAlert, ApiException } from '@/lib/api';
import { CATEGORY_LABELS, CONDITION_LABELS } from '@/lib/types';
import type { Category, Condition } from '@/lib/types';

interface AlertModalProps {
  category: Category;
  productName: string;
  modelName?: string;
  condition: Condition;
  suggestedPrice: number;
  onClose: () => void;
}

export default function AlertModal({
  category,
  productName,
  modelName,
  condition,
  suggestedPrice,
  onClose,
}: AlertModalProps) {
  const [targetPrice, setTargetPrice] = useState<string>(
    Math.round(suggestedPrice * 0.9).toString()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const price = parseInt(targetPrice, 10);
    if (isNaN(price) || price < 1000) {
      setError('목표 가격은 1,000원 이상이어야 합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createAlert({
        category,
        productName,
        modelName,
        condition,
        targetPrice: price,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.data.message || '알림 등록에 실패했습니다.');
      } else {
        setError('알림 등록에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const productDisplay = modelName ? `${productName} ${modelName}` : productName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="닫기"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-amber-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
              />
            </svg>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              가격 알림 설정
            </h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            목표 가격에 도달하면 알림을 보내드립니다.
          </p>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-8 h-8 text-green-600 dark:text-green-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              알림이 등록되었습니다!
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              목표 가격에 도달하면 알려드릴게요.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Product info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {CATEGORY_LABELS[category]} | 상태: {CONDITION_LABELS[condition]}
              </div>
              <div className="font-medium text-gray-900 dark:text-white">
                {productDisplay}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                현재 추천가: {suggestedPrice.toLocaleString()}원
              </div>
            </div>

            {/* Target price input */}
            <div className="mb-4">
              <label
                htmlFor="targetPrice"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                목표 가격
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="targetPrice"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  min={1000}
                  step={1000}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="목표 가격 입력"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  원
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                이 가격 이하로 떨어지면 알림을 보내드립니다.
              </p>
            </div>

            {/* Quick buttons */}
            <div className="flex gap-2 mb-4">
              {[0.9, 0.8, 0.7].map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() =>
                    setTargetPrice(Math.round(suggestedPrice * ratio).toString())
                  }
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700
                           hover:bg-gray-200 dark:hover:bg-gray-600
                           text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  -{Math.round((1 - ratio) * 100)}%
                </button>
              ))}
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300
                       text-white font-medium rounded-lg transition-colors"
            >
              {isSubmitting ? '등록 중...' : '알림 등록'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

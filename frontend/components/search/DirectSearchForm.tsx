'use client';

import { useState, useCallback } from 'react';
import AutocompleteInput from './AutocompleteInput';
import type { Condition, AutocompleteSuggestion } from '@/lib/types';
import { CONDITIONS } from '@/lib/types';

interface DirectSearchFormProps {
  onSubmit: (data: { productName: string; condition: Condition; modelName?: string }) => void;
  isLoading?: boolean;
}

export default function DirectSearchForm({ onSubmit, isLoading = false }: DirectSearchFormProps) {
  const [productName, setProductName] = useState('');
  const [condition, setCondition] = useState<Condition>('FAIR'); // 기본값: 중
  const [modelName, setModelName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 자동완성 선택 처리
  const handleSuggestionSelect = useCallback((suggestion: AutocompleteSuggestion) => {
    setProductName(suggestion.text);
    setError(null);
  }, []);

  // 폼 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!productName.trim()) {
      setError('제품명을 입력해주세요.');
      return;
    }

    if (productName.trim().length < 2) {
      setError('제품명은 최소 2글자 이상 입력해주세요.');
      return;
    }

    setError(null);
    onSubmit({
      productName: productName.trim(),
      condition,
      modelName: modelName.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 제품명 입력 (자동완성) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          제품명
          <span className="text-red-500 ml-1">*</span>
        </label>
        <AutocompleteInput
          value={productName}
          onChange={(value) => {
            setProductName(value);
            if (error) setError(null);
          }}
          onSelect={handleSuggestionSelect}
          placeholder="예: 아이폰 15 프로, 맥북 에어 M2"
          disabled={isLoading}
        />
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          카테고리는 제품명에서 자동으로 추정됩니다
        </p>
      </div>

      {/* 상태 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          제품 상태
        </label>
        <div className="grid grid-cols-3 gap-2">
          {CONDITIONS.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setCondition(c.code)}
              disabled={isLoading}
              className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors
                ${
                  condition === c.code
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                }
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {c.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 고급 옵션 토글 */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span>고급 옵션</span>
        </button>

        {/* 모델명 입력 (접힌 상태) */}
        {showAdvanced && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              모델명 (선택)
            </label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="예: 256GB, MU7A3KH/A"
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed
                placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              더 정확한 시세를 위해 모델명이나 용량을 입력해주세요
            </p>
          </div>
        )}
      </div>

      {/* 검색 버튼 */}
      <button
        type="submit"
        disabled={isLoading || !productName.trim()}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400
          text-white font-medium rounded-lg transition-colors
          disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>시세 조회 중...</span>
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span>시세 조회하기</span>
          </>
        )}
      </button>
    </form>
  );
}

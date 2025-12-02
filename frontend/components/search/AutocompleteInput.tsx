'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getAutocomplete } from '@/lib/api';
import type { AutocompleteSuggestion, SeparatedSuggestions } from '@/lib/types';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: AutocompleteSuggestion) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function AutocompleteInput({
  value,
  onChange,
  onSelect,
  placeholder = '제품명을 입력하세요',
  className = '',
  disabled = false,
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<SeparatedSuggestions>({ history: [], naver: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // 전체 제안 항목 (키보드 네비게이션용)
  const allSuggestions = useMemo(() => {
    return [...suggestions.history, ...suggestions.naver];
  }, [suggestions]);

  // 드롭다운 표시 여부
  const hasAnySuggestions = suggestions.history.length > 0 || suggestions.naver.length > 0;

  // 디바운스된 자동완성 조회
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions({ history: [], naver: [] });
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await getAutocomplete(query);
      setSuggestions(results);
      const hasSuggestions = results.history.length > 0 || results.naver.length > 0;
      setIsOpen(hasSuggestions);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('자동완성 조회 실패:', error);
      setSuggestions({ history: [], naver: [] });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 입력값 변경 처리 (디바운스 적용)
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);

      // 이전 타이머 취소
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // 300ms 후 자동완성 조회
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(newValue);
      }, 300);
    },
    [onChange, fetchSuggestions]
  );

  // 키보드 네비게이션
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || allSuggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < allSuggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < allSuggestions.length) {
            const selected = allSuggestions[selectedIndex];
            onChange(selected.text);
            onSelect(selected);
            setIsOpen(false);
            setSelectedIndex(-1);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
    },
    [isOpen, allSuggestions, selectedIndex, onChange, onSelect]
  );

  // 제안 항목 클릭
  const handleSuggestionClick = useCallback(
    (suggestion: AutocompleteSuggestion) => {
      onChange(suggestion.text);
      onSelect(suggestion);
      setIsOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.focus();
    },
    [onChange, onSelect]
  );

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 인덱스로 선택 여부 확인 (섹션 분리된 경우)
  const getGlobalIndex = (section: 'history' | 'naver', localIndex: number): number => {
    if (section === 'history') {
      return localIndex;
    }
    return suggestions.history.length + localIndex;
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (hasAnySuggestions) setIsOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            bg-white dark:bg-gray-800 text-gray-900 dark:text-white
            disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            ${className}`}
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              className="animate-spin h-5 w-5 text-gray-400"
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
          </div>
        )}
      </div>

      {/* 드롭다운 */}
      {isOpen && hasAnySuggestions && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-72 overflow-y-auto"
        >
          {/* 검색 기록 섹션 */}
          {suggestions.history.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  최근 검색
                </span>
              </div>
              {suggestions.history.map((suggestion, index) => (
                <button
                  key={`history-${suggestion.text}-${index}`}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between
                    ${getGlobalIndex('history', index) === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/30' : ''}
                    ${index !== suggestions.history.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
                >
                  <div className="flex flex-col">
                    <span className="text-gray-900 dark:text-white font-medium">
                      {suggestion.text}
                    </span>
                    {suggestion.categoryName && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {suggestion.categoryName}
                      </span>
                    )}
                  </div>
                  {suggestion.searchCount && suggestion.searchCount > 0 && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {suggestion.searchCount}회
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* 네이버 추천 섹션 */}
          {suggestions.naver.length > 0 && (
            <div>
              <div className={`px-4 py-2 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 ${suggestions.history.length > 0 ? 'border-t' : ''}`}>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  추천 검색어
                </span>
              </div>
              {suggestions.naver.map((suggestion, index) => (
                <button
                  key={`naver-${suggestion.text}-${index}`}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between
                    ${getGlobalIndex('naver', index) === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/30' : ''}
                    ${index !== suggestions.naver.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
                >
                  <div className="flex flex-col">
                    <span className="text-gray-900 dark:text-white font-medium">
                      {suggestion.text}
                    </span>
                    {suggestion.categoryName && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {suggestion.categoryName}
                      </span>
                    )}
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400">
                    네이버
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

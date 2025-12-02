'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { checkBookmark, createBookmark, deleteBookmark, setAuthToken } from '@/lib/api';

interface BookmarkButtonProps {
  recommendationId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

// CUID 형식 검증 (c로 시작하고 영숫자로 구성)
function isValidCuid(id: string): boolean {
  return /^c[a-z0-9]{24,}$/i.test(id);
}

export default function BookmarkButton({
  recommendationId,
  className = '',
  size = 'md',
  showText = false,
}: BookmarkButtonProps) {
  const { data: session, status } = useSession();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // 크기별 스타일
  const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // 세션 토큰 설정 및 북마크 상태 확인
  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.accessToken) {
      setIsChecking(false);
      return;
    }

    // 유효한 CUID가 아닌 경우 (비로그인 시 생성된 임시 UUID 등) 체크 스킵
    if (!isValidCuid(recommendationId)) {
      setIsChecking(false);
      return;
    }

    setAuthToken(session.accessToken as string);

    const checkBookmarkStatus = async () => {
      try {
        const result = await checkBookmark(recommendationId);
        setIsBookmarked(result.isBookmarked);
        setBookmarkId(result.bookmarkId);
      } catch {
        // 에러 무시 (비로그인 상태 등)
      } finally {
        setIsChecking(false);
      }
    };

    checkBookmarkStatus();
  }, [session, status, recommendationId]);

  const handleToggle = async () => {
    if (!session) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }

    // 유효한 CUID가 아닌 경우 (비로그인 시 생성된 조회 결과)
    if (!isValidCuid(recommendationId)) {
      alert('로그인 후 조회한 결과만 찜할 수 있습니다.');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      if (isBookmarked && bookmarkId) {
        await deleteBookmark(bookmarkId);
        setIsBookmarked(false);
        setBookmarkId(null);
      } else {
        const result = await createBookmark({ recommendationId });
        setIsBookmarked(true);
        setBookmarkId(result.id);
      }
    } catch (error) {
      console.error('북마크 처리 실패:', error);
      alert('처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인하지 않은 경우 버튼 비활성화 상태로 표시
  if (status === 'unauthenticated') {
    return (
      <button
        type="button"
        onClick={() => alert('로그인이 필요한 기능입니다.')}
        className={`
          flex items-center justify-center gap-2
          ${sizeStyles[size]}
          rounded-full
          border border-gray-200 bg-white
          text-gray-400
          hover:bg-gray-50
          transition-colors
          ${className}
        `}
        title="로그인 후 이용 가능"
      >
        <svg
          className={iconSizes[size]}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        {showText && <span className="text-sm">찜하기</span>}
      </button>
    );
  }

  // 로딩 중
  if (isChecking || status === 'loading') {
    return (
      <button
        type="button"
        disabled
        className={`
          flex items-center justify-center gap-2
          ${sizeStyles[size]}
          rounded-full
          border border-gray-200 bg-white
          text-gray-300
          ${className}
        `}
      >
        <svg className={`${iconSizes[size]} animate-spin`} viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        flex items-center justify-center gap-2
        ${showText ? 'px-4 py-2' : sizeStyles[size]}
        rounded-full
        border
        ${
          isBookmarked
            ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
            : 'border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-red-400'
        }
        transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title={isBookmarked ? '찜 해제' : '찜하기'}
    >
      <svg
        className={`${iconSizes[size]} ${isLoading ? 'animate-pulse' : ''}`}
        fill={isBookmarked ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {showText && (
        <span className="text-sm font-medium">
          {isBookmarked ? '찜 해제' : '찜하기'}
        </span>
      )}
    </button>
  );
}

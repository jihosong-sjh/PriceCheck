'use client';

import { useState, useRef, useEffect } from 'react';
import { CATEGORY_LABELS, CONDITION_LABELS } from '@/lib/types';
import type { Category, Condition } from '@/lib/types';

interface ShareButtonProps {
  productName: string;
  modelName?: string;
  category: Category;
  condition: Condition;
  recommendedPrice: number;
  priceMin: number;
  priceMax: number;
  size?: 'sm' | 'md' | 'lg';
}

interface ShareData {
  title: string;
  text: string;
  url: string;
}

export default function ShareButton({
  productName,
  modelName,
  category,
  condition,
  recommendedPrice,
  priceMin,
  priceMax,
  size = 'md',
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 가격 포맷
  const formatPrice = (price: number) => new Intl.NumberFormat('ko-KR').format(price);

  // 공유 데이터 생성
  const getShareData = (): ShareData => {
    const fullProductName = modelName ? `${productName} ${modelName}` : productName;
    const title = `${fullProductName} 중고 시세`;
    const text = `[PriceCheck]\n${fullProductName}\n카테고리: ${CATEGORY_LABELS[category]}\n상태: ${CONDITION_LABELS[condition]}\n\n추천가: ${formatPrice(recommendedPrice)}원\n시세범위: ${formatPrice(priceMin)}원 ~ ${formatPrice(priceMax)}원`;
    const url = typeof window !== 'undefined' ? window.location.href : '';

    return { title, text, url };
  };

  // Web Share API 사용 가능 여부
  const canUseWebShare = typeof navigator !== 'undefined' && 'share' in navigator;

  // 네이티브 공유 (Web Share API)
  const handleNativeShare = async () => {
    const { title, text, url } = getShareData();
    try {
      await navigator.share({ title, text, url });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('공유 실패:', err);
      }
    }
    setIsOpen(false);
  };

  // 카카오톡 공유
  const handleKakaoShare = () => {
    const { title, text, url } = getShareData();

    // 카카오 SDK가 로드되어 있는지 확인
    if (typeof window !== 'undefined' && (window as unknown as { Kakao?: { Share?: { sendDefault: (params: unknown) => void } } }).Kakao?.Share) {
      (window as unknown as { Kakao: { Share: { sendDefault: (params: unknown) => void } } }).Kakao.Share.sendDefault({
        objectType: 'text',
        text: `${title}\n\n${text}`,
        link: {
          mobileWebUrl: url,
          webUrl: url,
        },
      });
    } else {
      // 카카오 SDK가 없으면 URL 스킴으로 fallback
      const kakaoUrl = `https://story.kakao.com/share?url=${encodeURIComponent(url)}`;
      window.open(kakaoUrl, '_blank', 'width=600,height=400');
    }
    setIsOpen(false);
  };

  // 트위터(X) 공유
  const handleTwitterShare = () => {
    const { text, url } = getShareData();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  // 페이스북 공유
  const handleFacebookShare = () => {
    const { url } = getShareData();
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  // 링크 복사
  const handleCopyLink = async () => {
    const { text, url } = getShareData();
    const copyText = `${text}\n\n${url}`;

    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
    setIsOpen(false);
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
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${sizeClasses[size]} rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500`}
        aria-label="공유하기"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <svg
          className={`${iconSizes[size]} text-gray-600 dark:text-gray-300`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1"
          role="menu"
          aria-orientation="vertical"
        >
          {/* 네이티브 공유 (모바일) */}
          {canUseWebShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              role="menuitem"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              공유하기
            </button>
          )}

          {/* 카카오톡 */}
          <button
            type="button"
            onClick={handleKakaoShare}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            role="menuitem"
          >
            <div className="w-5 h-5 bg-yellow-400 rounded-md flex items-center justify-center">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#3C1E1E">
                <path d="M12 3C6.477 3 2 6.463 2 10.742c0 2.85 1.893 5.356 4.723 6.741-.147.532-.951 3.42-.985 3.638 0 0-.02.161.085.222.106.061.229.008.229.008.301-.042 3.489-2.281 4.021-2.679.631.088 1.279.134 1.927.134 5.523 0 10-3.462 10-7.742S17.523 3 12 3z"/>
              </svg>
            </div>
            카카오톡
          </button>

          {/* 트위터/X */}
          <button
            type="button"
            onClick={handleTwitterShare}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            role="menuitem"
          >
            <div className="w-5 h-5 bg-black dark:bg-white rounded-md flex items-center justify-center">
              <svg className="w-3 h-3 fill-white dark:fill-black" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            X (트위터)
          </button>

          {/* 페이스북 */}
          <button
            type="button"
            onClick={handleFacebookShare}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            role="menuitem"
          >
            <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center">
              <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            페이스북
          </button>

          {/* 구분선 */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

          {/* 링크 복사 */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            role="menuitem"
          >
            {copied ? (
              <>
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-600 dark:text-green-400">복사됨!</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                링크 복사
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

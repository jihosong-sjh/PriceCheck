'use client';

import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // 에러 로깅 (추후 Sentry 등으로 전송 가능)
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        {/* 에러 아이콘 */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* 에러 메시지 */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          오류가 발생했습니다
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          예상치 못한 오류가 발생했습니다.
          <br />
          잠시 후 다시 시도해주세요.
        </p>

        {/* 에러 상세 (개발 환경에서만) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              에러 상세 정보
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg text-xs text-red-600 dark:text-red-400 overflow-auto max-h-40">
              {error.message}
              {error.digest && `\n\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            다시 시도
          </button>
          <a
            href="/"
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}

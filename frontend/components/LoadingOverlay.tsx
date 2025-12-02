'use client';

import { useIsLoading, useLoadingMessage } from '@/lib/stores/uiStore';

export default function LoadingOverlay() {
  const isLoading = useIsLoading();
  const loadingMessage = useLoadingMessage();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 flex flex-col items-center gap-4 max-w-sm mx-4">
        {/* 스피너 */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin" />
        </div>

        {/* 메시지 */}
        {loadingMessage && (
          <p className="text-center text-gray-700 dark:text-gray-300 font-medium">
            {loadingMessage}
          </p>
        )}

        {/* 기본 메시지 */}
        {!loadingMessage && (
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
            잠시만 기다려주세요...
          </p>
        )}
      </div>
    </div>
  );
}

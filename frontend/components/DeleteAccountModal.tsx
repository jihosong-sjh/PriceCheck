'use client';

import { useState } from 'react';
import { deleteAccount, ApiException } from '@/lib/api';

interface DeleteAccountModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteAccountModal({ onClose, onSuccess }: DeleteAccountModalProps) {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      await deleteAccount(password);
      onSuccess();
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.message || '계정 삭제에 실패했습니다.');
      } else {
        setError('계정 삭제에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
              className="w-6 h-6 text-red-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              회원 탈퇴
            </h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </p>
        </div>

        {/* Warning */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
            삭제되는 데이터:
          </p>
          <ul className="text-sm text-red-700 dark:text-red-400 list-disc list-inside space-y-1">
            <li>저장된 찜 목록</li>
            <li>가격 알림 설정</li>
            <li>알림 히스토리</li>
            <li>가격 조회 히스토리</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Password input */}
          <div className="mb-4">
            <label
              htmlFor="deletePassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              비밀번호 확인
            </label>
            <input
              type="password"
              id="deletePassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                       text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-300
                       text-white font-medium rounded-lg transition-colors"
            >
              {isSubmitting ? '처리 중...' : '탈퇴하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

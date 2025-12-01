'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowSignupPrompt(false);
    setIsLoading(true);

    try {
      // 1. 먼저 백엔드 API를 직접 호출하여 에러 메시지 확인
      const checkResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!checkResponse.ok) {
        const errorData = await checkResponse.json();
        const errorMessage = errorData.error || '로그인에 실패했습니다.';

        // 가입되지 않은 이메일이거나 탈퇴한 계정일 경우 회원가입 유도
        if (errorMessage.includes('가입되지 않은') || errorMessage.includes('탈퇴한')) {
          setError('가입되지 않은 이메일이거나 탈퇴한 계정입니다.');
          setShowSignupPrompt(true);
        } else {
          setError(errorMessage);
        }
        return;
      }

      // 2. 백엔드 인증 성공 시 NextAuth signIn 호출
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('로그인 처리 중 오류가 발생했습니다.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">로그인</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            가격 추천 히스토리를 저장하고 관리하세요
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              <p>{error}</p>
              {showSignupPrompt && (
                <p className="mt-2">
                  <Link
                    href="/signup"
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium underline"
                  >
                    새로 가입하시겠습니까?
                  </Link>
                </p>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="비밀번호를 입력하세요"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                로그인 중...
              </span>
            ) : (
              '로그인'
            )}
          </button>

          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              계정이 없으신가요?{' '}
              <Link href="/signup" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                회원가입
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

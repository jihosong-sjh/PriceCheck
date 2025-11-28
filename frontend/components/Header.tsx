'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container-wide">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2 no-underline">
            <svg
              className="w-8 h-8 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xl font-bold text-gray-900">프라이스체크</span>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/price-guide"
              className="text-gray-600 hover:text-primary-600 font-medium no-underline"
            >
              가격 추천
            </Link>
            <Link
              href="/bookmarks"
              className="text-gray-600 hover:text-primary-600 font-medium no-underline flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              찜 목록
            </Link>
            <Link
              href="/history"
              className="text-gray-600 hover:text-primary-600 font-medium no-underline"
            >
              히스토리
            </Link>
          </nav>

          {/* 데스크톱 버튼 */}
          <div className="hidden md:flex items-center gap-3">
            {status === 'loading' ? (
              <div className="h-9 w-20 bg-gray-200 animate-pulse rounded-lg" />
            ) : session ? (
              <>
                <span className="text-sm text-gray-600">{session.user?.email}</span>
                <button
                  onClick={handleSignOut}
                  className="btn-ghost"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-ghost no-underline">
                  로그인
                </Link>
                <Link href="/signup" className="btn-primary no-underline">
                  회원가입
                </Link>
              </>
            )}
          </div>

          {/* 모바일 메뉴 버튼 */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="메뉴 열기"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col gap-2">
              <Link
                href="/price-guide"
                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg no-underline"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                가격 추천
              </Link>
              <Link
                href="/bookmarks"
                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg no-underline flex items-center gap-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                찜 목록
              </Link>
              <Link
                href="/history"
                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg no-underline"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                히스토리
              </Link>
              <hr className="my-2 border-gray-200" />
              {session ? (
                <>
                  <div className="px-4 py-2 text-sm text-gray-500">
                    {session.user?.email}
                  </div>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="px-4 py-2 text-left text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg no-underline"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    로그인
                  </Link>
                  <Link
                    href="/signup"
                    className="mx-4 btn-primary text-center no-underline"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    회원가입
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

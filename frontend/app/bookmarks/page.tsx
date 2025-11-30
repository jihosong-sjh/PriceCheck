'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { getBookmarkList, deleteBookmark, setAuthToken, ApiException } from '@/lib/api';
import type { BookmarkItem, BookmarkListResponse } from '@/lib/types';

// 가격 포맷 함수
function formatPrice(price: number | null): string {
  if (price === null) return '-';
  return new Intl.NumberFormat('ko-KR').format(price);
}

// 날짜 포맷 함수
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function BookmarksPage() {
  const { data: session, status } = useSession();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    if (!session?.accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      setAuthToken(session.accessToken as string);
      const response: BookmarkListResponse = await getBookmarkList(page, 10);
      setBookmarks(response.items);
      setTotalPages(response.totalPages);
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.data.message || '찜 목록을 불러오는데 실패했습니다.');
      } else {
        setError('서버와 연결할 수 없습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, page]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchBookmarks();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [status, fetchBookmarks]);

  const handleDelete = async (id: string) => {
    if (!confirm('이 항목을 찜 목록에서 삭제하시겠습니까?')) return;

    setDeletingId(id);

    try {
      await deleteBookmark(id);
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error('삭제 실패:', err);
      alert('삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  // 로딩 중
  if (status === 'loading' || (status === 'authenticated' && isLoading)) {
    return (
      <div className="container-narrow py-8 md:py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">찜 목록</h1>
          <p className="text-gray-600 dark:text-gray-300">관심 있는 제품의 시세 정보를 저장해두세요</p>
        </div>
        <div className="card">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // 에러 표시
  if (error) {
    return (
      <div className="container-narrow py-8 md:py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">찜 목록</h1>
        </div>
        <div className="card bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800">
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={fetchBookmarks}
              className="mt-4 btn-primary"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-narrow py-8 md:py-12">
      {/* 페이지 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">찜 목록</h1>
        <p className="text-gray-600 dark:text-gray-300">관심 있는 제품의 시세 정보를 저장해두세요</p>
      </div>

      {/* 찜 목록 */}
      {bookmarks.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              찜한 제품이 없습니다
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              가격 조회 후 하트 버튼을 눌러 찜해보세요
            </p>
            <Link href="/price-guide" className="btn-primary no-underline">
              가격 조회하러 가기
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="card hover:border-primary-200 dark:hover:border-primary-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* 카테고리 & 상태 배지 */}
                  <div className="flex items-center gap-2 mb-2">
                    {bookmark.categoryLabel && (
                      <span className="badge badge-blue">
                        {bookmark.categoryLabel}
                      </span>
                    )}
                    {bookmark.conditionLabel && (
                      <span
                        className={`badge ${
                          bookmark.condition === 'GOOD'
                            ? 'badge-green'
                            : bookmark.condition === 'FAIR'
                              ? 'badge-yellow'
                              : 'badge-red'
                        }`}
                      >
                        {bookmark.conditionLabel}
                      </span>
                    )}
                  </div>

                  {/* 제품명 */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {bookmark.productName || '제품명 없음'}
                  </h3>
                  {bookmark.modelName && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {bookmark.modelName}
                    </p>
                  )}

                  {/* 가격 정보 */}
                  {bookmark.recommendedPrice && (
                    <div className="mt-3">
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {formatPrice(bookmark.recommendedPrice)}원
                      </span>
                      {bookmark.priceMin && bookmark.priceMax && (
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          ({formatPrice(bookmark.priceMin)} ~{' '}
                          {formatPrice(bookmark.priceMax)}원)
                        </span>
                      )}
                    </div>
                  )}

                  {/* 메모 */}
                  {bookmark.memo && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                      {bookmark.memo}
                    </p>
                  )}

                  {/* 날짜 */}
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    찜한 날짜: {formatDate(bookmark.createdAt)}
                  </p>
                </div>

                {/* 액션 버튼 */}
                <div className="flex flex-col gap-2">
                  {bookmark.recommendationId && (
                    <Link
                      href={`/history/${bookmark.recommendationId}`}
                      className="btn-outline text-sm px-3 py-1.5 no-underline"
                    >
                      상세보기
                    </Link>
                  )}
                  <button
                    onClick={() => handleDelete(bookmark.id)}
                    disabled={deletingId === bookmark.id}
                    className="btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 text-sm px-3 py-1.5 disabled:opacity-50"
                  >
                    {deletingId === bookmark.id ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-outline disabled:opacity-50"
              >
                이전
              </button>
              <span className="flex items-center px-4 text-gray-600 dark:text-gray-300">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-outline disabled:opacity-50"
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

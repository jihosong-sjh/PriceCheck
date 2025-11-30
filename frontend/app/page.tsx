import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col">
      {/* 히어로 섹션 */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container-narrow py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            중고 전자제품
            <br />
            <span className="gradient-text">적정 가격</span>을 알려드립니다
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            번개장터, 중고나라의 실시간 시세를 분석하여
            <br className="hidden sm:block" />
            스마트폰, 노트북, 태블릿 등의 추천 판매가를 제공합니다
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/price-guide" className="btn-primary btn-lg no-underline">
              지금 가격 확인하기
            </Link>
          </div>
        </div>
      </section>

      {/* 지원 카테고리 */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container-wide">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            지원 카테고리
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {[
              { name: '스마트폰', icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
              { name: '노트북', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
              { name: '태블릿', icon: 'M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
              { name: '스마트워치', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
              { name: '이어폰/헤드폰', icon: 'M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 0112.728 0' },
            ].map((category) => (
              <Link
                key={category.name}
                href="/price-guide"
                className="card-hover flex flex-col items-center gap-3 py-6 no-underline group"
              >
                <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-primary-800/50 transition-colors">
                  <svg
                    className="w-7 h-7 text-primary-600 dark:text-primary-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d={category.icon}
                    />
                  </svg>
                </div>
                <span className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 기능 소개 */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container-wide">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-12">
            이렇게 도움을 드려요
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-primary-600 dark:text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">시세 조회</h3>
              <p className="text-gray-600 dark:text-gray-400">
                번개장터, 중고나라 등 주요 플랫폼의 최신 시세를 한눈에 확인하세요
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-primary-600 dark:text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">가격 분석</h3>
              <p className="text-gray-600 dark:text-gray-400">
                평균, 중앙값, 가격 범위를 분석하여 합리적인 추천가를 제시합니다
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-primary-600 dark:text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">상태별 조정</h3>
              <p className="text-gray-600 dark:text-gray-400">
                제품 상태(상/중/하)에 따라 적절하게 조정된 가격을 알려드립니다
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-16 bg-primary-600">
        <div className="container-narrow text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-primary-100 mb-8">
            회원가입 없이도 바로 가격을 확인할 수 있습니다
          </p>
          <Link href="/price-guide" className="btn bg-white text-primary-600 hover:bg-primary-50 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white btn-lg no-underline">
            무료로 가격 확인하기
          </Link>
        </div>
      </section>
    </div>
  );
}

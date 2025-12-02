'use client';

/**
 * 스킵 링크 컴포넌트
 * 키보드 사용자가 반복적인 네비게이션을 건너뛰고 메인 콘텐츠로 바로 이동할 수 있게 합니다.
 * WCAG 2.4.1 Bypass Blocks (Level A)
 */
export default function SkipLink() {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView();
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
    >
      메인 콘텐츠로 건너뛰기
    </a>
  );
}

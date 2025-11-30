import { auth } from '@/lib/auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  // 히스토리, 찜 목록 페이지는 로그인 필수
  if (nextUrl.pathname.startsWith('/history') || nextUrl.pathname.startsWith('/bookmarks')) {
    if (!isLoggedIn) {
      return Response.redirect(new URL('/login', nextUrl));
    }
  }

  // 이미 로그인된 사용자가 로그인/회원가입 페이지 접근 시 홈으로 리다이렉트
  if (isLoggedIn && (nextUrl.pathname === '/login' || nextUrl.pathname === '/signup')) {
    return Response.redirect(new URL('/', nextUrl));
  }

  return undefined;
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

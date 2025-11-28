import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: '프라이스체크 - 중고 전자제품 가격 가이드',
  description: '중고 스마트폰, 노트북, 태블릿 등 전자제품의 적정 판매가를 추천받으세요. 번개장터, 중고나라 시세를 분석하여 최적의 가격을 제시합니다.',
  keywords: ['중고', '전자제품', '가격', '시세', '스마트폰', '노트북', '태블릿', '번개장터', '중고나라'],
  authors: [{ name: 'PriceCheck' }],
  openGraph: {
    title: '프라이스체크 - 중고 전자제품 가격 가이드',
    description: '중고 전자제품의 적정 판매가를 추천받으세요.',
    type: 'website',
    locale: 'ko_KR',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

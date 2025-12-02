import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Providers from '@/components/Providers';

// Noto Sans KR 폰트 설정 (next/font로 최적화된 로딩)
const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: true,
  variable: '--font-noto-sans-kr',
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3B82F6' },
    { media: '(prefers-color-scheme: dark)', color: '#1E40AF' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: '프라이스체크 - 중고 전자제품 가격 가이드',
  description: '중고 스마트폰, 노트북, 태블릿 등 전자제품의 적정 판매가를 추천받으세요. 번개장터, 중고나라 시세를 분석하여 최적의 가격을 제시합니다.',
  keywords: ['중고', '전자제품', '가격', '시세', '스마트폰', '노트북', '태블릿', '번개장터', '중고나라'],
  authors: [{ name: 'PriceCheck' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '프라이스체크',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: '프라이스체크 - 중고 전자제품 가격 가이드',
    description: '중고 전자제품의 적정 판매가를 추천받으세요.',
    type: 'website',
    locale: 'ko_KR',
  },
  icons: {
    icon: [
      { url: '/icons/manifest-icon-192.maskable.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/manifest-icon-512.maskable.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning className={notoSansKR.variable}>
      <body className={`min-h-screen flex flex-col ${notoSansKR.className}`}>
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

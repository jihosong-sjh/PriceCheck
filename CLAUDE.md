# PriceCheck Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-28

## Active Technologies

- TypeScript 5.x, Node.js 20 LTS + Next.js 14, Express, Playwright, Cheerio, Prisma, NextAuth.js (001-price-guide)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x, Node.js 20 LTS: Follow standard conventions

## Recent Changes

- 001-price-guide: Added TypeScript 5.x, Node.js 20 LTS + Next.js 14, Express, Playwright, Cheerio, Prisma, NextAuth.js

<!-- MANUAL ADDITIONS START -->

## 앱/웹 서비스 출시 전략 (2025-11-29)

### 2단계 접근 방식
1. **1단계: PWA 웹 서비스 배포** (1-2주)
   - 기존 Next.js 앱에 `next-pwa` 설정 추가
   - 배포: Vercel (프론트) + Railway/Render (백엔드)
   - 목적: 빠르게 실제 유저 피드백 수집

2. **2단계: React Native 네이티브 앱** (2-3개월)
   - 새 프로젝트로 시작 (React Native CLI 사용)
   - 백엔드 API 100% 재사용
   - Play Store 출시

### 재사용 가능 코드
- ✅ 백엔드 API 전체 (Express)
- ✅ 데이터베이스 스키마 (Prisma)
- ✅ API 호출 로직 (`frontend/lib/api.ts`)
- ✅ 타입 정의
- ❌ React 컴포넌트 (네이티브로 재작성)
- ❌ Tailwind CSS (React Native 스타일로 변경)

### PWA 적용 시 수정 필요 파일
- `frontend/next.config.mjs` - PWA 설정 추가
- `frontend/public/manifest.json` - 새로 생성
- `frontend/app/layout.tsx` - 메타데이터 추가

### React Native CLI 환경 (Windows + Android)
- Node.js 20 LTS (설치됨)
- JDK 17 (OpenJDK)
- Android Studio + Android SDK
- Android 에뮬레이터

### 배포 인프라 비용 예상
- 초기: 월 $0-10 (무료 플랜 활용)
- 유저 증가 시: 월 $20-50

### Play Store 출시 준비물
- Google Play Console 계정 ($25 일회성)
- 앱 서명 키 (키스토어)
- 개인정보처리방침 페이지
- 앱 아이콘, 스크린샷

### 상세 계획 파일
- `C:\Users\impri\.claude\plans\velvety-bubbling-pebble.md`

<!-- MANUAL ADDITIONS END -->

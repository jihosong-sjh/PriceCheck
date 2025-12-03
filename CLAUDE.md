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

## 테스트 전략 (2025-12-03)

### 테스트 피라미드 (우선순위)

```
        ▲
       /E2E\        10% - 핵심 유저 플로우만
      /─────\
     /통합   \      30% - API + 외부 서비스 모킹
    /─────────\
   /  단위     \    60% - 순수 비즈니스 로직
  /─────────────\
```

### TDD vs 구현 후 테스트

| 상황 | 접근법 |
|------|--------|
| 요구사항 명확 (가격 계산 등) | TDD 가능 |
| 탐색적 개발 (크롤링 등) | 구현 후 테스트 |
| 외부 의존성 높음 | 통합 테스트 중심 |

### 이 프로젝트의 테스트 우선순위

1. **외부 서비스 실패 시나리오** (통합 테스트) - 가장 중요
   - 네이버 API 실패 → 폴백 동작 확인
   - 크롤링 실패 → 에러 응답 형식 확인

2. **프론트-백엔드 계약** (Contract Test)
   - API 응답 스키마 검증
   - 프론트가 기대하는 필드 누락 방지

3. **핵심 비즈니스 로직** (단위 테스트)
   - `priceCalculator.ts` - 가격 계산
   - 데이터 변환 함수들

4. **E2E** (배포 전 스모크 테스트)
   - 검색 → 결과 → 북마크 플로우

### 테스트 작성 가이드

```typescript
// 1. 통합 테스트 예시 (외부 서비스 실패)
test('네이버 API 실패 시 폴백 응답 반환', async () => {
  // 네이버 API 모킹 → 500 에러
  // 폴백 로직 동작 확인
  // 응답 스키마 검증
});

// 2. Contract Test 예시 (응답 형식 검증)
const expectedSchema = {
  category: expect.any(String),
  crawlStats: expect.objectContaining({ total: expect.any(Number) }),
  items: expect.any(Array)
};

test('검색 API 응답 형식 준수', async () => {
  const response = await request(app).get('/api/search?q=테스트');
  expect(response.body).toMatchObject(expectedSchema);
});

// 3. 단위 테스트 예시 (순수 로직)
test('평균 가격 계산', () => {
  expect(calculateAverage([10000, 20000, 30000])).toBe(20000);
});
```

### 테스트 파일 위치

```
backend/
├── tests/
│   ├── unit/           # 단위 테스트
│   ├── integration/    # 통합 테스트 (API + 모킹)
│   └── contract/       # 응답 스키마 검증
frontend/
├── __tests__/          # 컴포넌트 테스트
├── e2e/                # Playwright E2E
```

### 테스트 실행 명령어

```bash
# 백엔드
cd backend && npm test              # 전체
cd backend && npm test -- --watch   # 워치 모드
cd backend && npm test -- unit      # 단위만
cd backend && npm test -- integration  # 통합만

# 프론트엔드 E2E
cd frontend && npx playwright test
```

### 새 기능 개발 시 체크리스트

- [ ] 외부 API 호출이 있는가? → 실패 시나리오 통합 테스트 필수
- [ ] 새 API 엔드포인트인가? → 응답 스키마 Contract Test 추가
- [ ] 계산/변환 로직인가? → 단위 테스트 추가
- [ ] 핵심 유저 플로우 변경인가? → E2E 업데이트 검토

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

# 작업 목록: 중고 전자제품 가격 가이드

**입력**: `/specs/001-price-guide/` 설계 문서
**필수 조건**: plan.md (필수), spec.md (필수), research.md, data-model.md, quickstart.md

**테스트**: spec.md에 TDD 요청이 없으므로 테스트 작업은 제외됨

**구성**: 사용자 스토리별로 그룹화하여 독립적 구현 및 테스트 가능

## 형식: `[ID] [P?] [Story] 설명`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 해당 사용자 스토리 (예: US1, US2, US3, US4)
- 설명에 정확한 파일 경로 포함

## 경로 규칙

- **백엔드**: `backend/src/`, `backend/prisma/`, `backend/tests/`
- **프론트엔드**: `frontend/app/`, `frontend/components/`, `frontend/lib/`

---

## Phase 1: 설정 (공통 인프라)

**목적**: 프로젝트 초기화 및 기본 구조 생성

- [X] T001 plan.md 구조에 따라 프로젝트 디렉토리 구조 생성
- [X] T002 [P] backend/package.json 생성 및 Express, TypeScript, Prisma, Playwright, Cheerio 의존성 설정
- [X] T003 [P] frontend/package.json 생성 및 Next.js 14, TypeScript, TailwindCSS, NextAuth 의존성 설정
- [X] T004 [P] backend/tsconfig.json TypeScript 설정 구성
- [X] T005 [P] frontend/tsconfig.json TypeScript 설정 구성
- [X] T006 [P] backend/.env.example 환경 변수 템플릿 생성
- [X] T007 [P] frontend/.env.example 환경 변수 템플릿 생성
- [X] T008 [P] ESLint 및 Prettier 설정 (backend, frontend 각각)
- [X] T009 backend/prisma/schema.prisma 데이터베이스 스키마 생성 (data-model.md 기준)

---

## Phase 2: 기반 (사용자 스토리 전 필수 완료)

**목적**: 모든 사용자 스토리 구현 전 완료해야 하는 핵심 인프라

**⚠️ 중요**: 이 단계 완료 전에는 사용자 스토리 작업 시작 불가

- [X] T010 backend/src/app.ts Express 앱 진입점 및 기본 설정 구현
- [X] T011 [P] backend/src/middleware/errorHandler.ts 전역 에러 처리 미들웨어 구현
- [X] T012 [P] backend/src/utils/validators.ts 입력 검증 유틸리티 구현 (Zod 활용)
- [X] T013 [P] frontend/app/layout.tsx 공통 레이아웃 구현 (한국어 설정)
- [X] T014 [P] frontend/app/globals.css TailwindCSS 전역 스타일 설정
- [X] T015 [P] frontend/components/Header.tsx 헤더 컴포넌트 구현
- [X] T016 [P] frontend/components/Footer.tsx 푸터 컴포넌트 구현
- [X] T017 [P] frontend/lib/types.ts 공통 타입 정의 (Category, Condition, Platform 등)
- [X] T018 [P] frontend/lib/api.ts API 클라이언트 유틸리티 구현
- [X] T019 Prisma 마이그레이션 실행 및 클라이언트 생성 설정

**체크포인트**: 기반 완료 - 이제 사용자 스토리 구현 시작 가능

---

## Phase 3: 사용자 스토리 1 - 전자제품 가격 추천 받기 (Priority: P1) 🎯 MVP

**목표**: 비회원 사용자가 제품 정보를 입력하고 추천 가격과 가격 범위를 확인

**독립 테스트**: 비회원이 제품명, 모델명, 상태를 입력하여 추천 가격을 받을 수 있음

### 백엔드 구현 - 크롤러

- [X] T020 [P] [US1] backend/src/services/crawler/bunjang.ts 번개장터 크롤러 구현 (Playwright + Cheerio)
- [X] T021 [P] [US1] backend/src/services/crawler/joongonara.ts 중고나라 크롤러 구현 (Axios + Cheerio)
- [X] T022 [US1] backend/src/services/crawler/index.ts 크롤러 통합 관리자 구현

### 백엔드 구현 - 가격 계산

- [X] T023 [US1] backend/src/services/priceCalculator.ts 시세 분석 및 추천 가격 계산 로직 구현
  - 평균, 중앙값, 가격 범위 계산
  - 상태(상/중/하)에 따른 가격 조정

### 백엔드 구현 - API

- [X] T024 [US1] backend/src/api/price.ts 가격 추천 API 라우트 구현
  - GET /api/price/categories - 카테고리 목록 조회
  - POST /api/price/recommend - 가격 추천 요청
- [X] T025 [US1] backend/src/app.ts에 price 라우트 등록

### 프론트엔드 구현

- [X] T026 [P] [US1] frontend/components/PriceForm.tsx 가격 추천 입력 폼 컴포넌트 구현
  - 카테고리 선택 (스마트폰, 노트북, 태블릿, 스마트워치, 이어폰)
  - 제품명, 모델명 입력
  - 상태(상/중/하) 선택
  - 가격 추천 버튼
- [X] T027 [P] [US1] frontend/components/PriceResult.tsx 추천 결과 표시 컴포넌트 구현
  - 추천 가격 표시
  - 가격 범위(최저~최고) 표시
  - 에러 메시지 표시 (시세 데이터 없음 등)
- [X] T028 [US1] frontend/app/price-guide/page.tsx 가격 추천 메인 페이지 구현
- [X] T029 [US1] frontend/app/page.tsx 홈페이지에서 가격 추천 페이지로 리다이렉트 또는 메인 진입점 설정

**체크포인트**: 사용자 스토리 1 완료 - 비회원이 가격 추천을 받을 수 있음 (MVP 완성)

---

## Phase 4: 사용자 스토리 2 - 시세 비교 정보 확인 (Priority: P2)

**목표**: 추천 가격의 근거가 되는 유사 매물 시세 비교 정보 표시

**독립 테스트**: 가격 추천 결과 화면에서 유사 매물 정보(가격, 상태, 플랫폼, 등록일)를 확인 가능

### 백엔드 구현

- [X] T030 [US2] backend/src/api/price.ts 가격 추천 응답에 marketDataSnapshot 포함 확인
  - 최소 3개 이상 유사 매물 정보 반환
  - 가격, 상태, 플랫폼, 등록일, 원본 URL 포함

### 프론트엔드 구현

- [X] T031 [US2] frontend/components/MarketComparison.tsx 시세 비교 정보 컴포넌트 구현
  - 유사 매물 목록 테이블/카드 형태 표시
  - 플랫폼별 아이콘/색상 구분
  - 원본 링크 클릭 시 새 탭에서 열기
- [X] T032 [US2] frontend/components/PriceResult.tsx에 MarketComparison 컴포넌트 통합

**체크포인트**: 사용자 스토리 2 완료 - 추천 가격 근거 확인 가능

---

## Phase 5: 사용자 스토리 3 - 사진 업로드 (Priority: P3)

**목표**: 제품 사진을 업로드하여 미리보기 표시 (향후 AI 분석 확장 대비)

**독립 테스트**: 사진 업로드 후 미리보기가 정상 표시되고, 삭제가 가능함

### 백엔드 구현

- [X] T033 [P] [US3] backend/src/services/imageUpload.ts S3 이미지 업로드 서비스 구현
  - Multer로 파일 수신
  - Sharp로 이미지 최적화 (리사이징, WebP 변환)
  - S3 업로드 및 URL 반환
  - 파일 형식 검증 (JPG, PNG만 허용)
  - 파일 크기 제한 (10MB)
- [X] T034 [US3] backend/src/api/upload.ts 이미지 업로드 API 라우트 구현
  - POST /api/upload - 이미지 업로드
  - DELETE /api/upload/:key - 이미지 삭제
- [X] T035 [US3] backend/src/app.ts에 upload 라우트 등록

### 프론트엔드 구현

- [X] T036 [US3] frontend/components/ImageUpload.tsx 이미지 업로드 컴포넌트 구현
  - 파일 선택 버튼
  - 이미지 미리보기
  - 삭제 버튼
  - 형식/크기 오류 메시지 표시
- [X] T037 [US3] frontend/components/PriceForm.tsx에 ImageUpload 컴포넌트 통합

**체크포인트**: 사용자 스토리 3 완료 - 사진 업로드 및 미리보기 가능

---

## Phase 6: 사용자 스토리 4 - 회원가입 및 추천 히스토리 조회 (Priority: P4)

**목표**: 회원가입하여 이전 가격 추천 기록을 저장하고 조회

**독립 테스트**: 회원가입 후 히스토리 페이지에서 이전 추천 기록 확인 가능

### 백엔드 구현 - 인증

- [X] T038 [P] [US4] backend/src/services/auth.ts 인증 서비스 구현
  - 회원가입 (bcrypt 비밀번호 해싱)
  - 로그인 (JWT 토큰 발급)
  - 비밀번호 검증
- [X] T039 [P] [US4] backend/src/middleware/auth.ts JWT 인증 미들웨어 구현
- [X] T040 [US4] backend/src/api/auth.ts 인증 API 라우트 구현
  - POST /api/auth/signup - 회원가입
  - POST /api/auth/login - 로그인
  - GET /api/auth/me - 현재 사용자 정보
- [X] T041 [US4] backend/src/app.ts에 auth 라우트 등록

### 백엔드 구현 - 히스토리

- [X] T042 [US4] backend/src/api/history.ts 히스토리 API 라우트 구현
  - GET /api/history - 추천 히스토리 목록 조회
  - GET /api/history/:id - 추천 히스토리 상세 조회
- [X] T043 [US4] backend/src/api/price.ts 가격 추천 시 로그인 사용자인 경우 userId 연결
- [X] T044 [US4] backend/src/app.ts에 history 라우트 등록

### 프론트엔드 구현 - 인증

- [X] T045 [P] [US4] frontend/lib/auth.ts NextAuth.js 설정 구현
  - Credentials Provider (이메일/비밀번호)
  - JWT 세션 전략
- [X] T046 [P] [US4] frontend/app/(auth)/login/page.tsx 로그인 페이지 구현
- [X] T047 [P] [US4] frontend/app/(auth)/signup/page.tsx 회원가입 페이지 구현
- [X] T048 [US4] frontend/components/Header.tsx에 로그인/로그아웃 버튼 추가

### 프론트엔드 구현 - 히스토리

- [X] T049 [US4] frontend/app/history/page.tsx 히스토리 목록 페이지 구현
  - 날짜순 정렬
  - 제품명, 추천가격, 조회일 표시
- [X] T050 [US4] frontend/app/history/[id]/page.tsx 히스토리 상세 페이지 구현
  - 입력했던 제품 정보 표시
  - 추천 결과 표시
  - 당시 시세 비교 정보 표시

**체크포인트**: 사용자 스토리 4 완료 - 회원가입 및 히스토리 조회 가능

---

## Phase 7: 마무리 및 교차 관심사

**목적**: 전체 스토리에 영향을 미치는 개선 사항

- [ ] T051 [P] 엣지 케이스 처리 - 시세 데이터 없는 제품에 대한 안내 메시지 구현
- [ ] T052 [P] 엣지 케이스 처리 - 크롤링 실패 시 재시도 옵션 제공
- [ ] T053 [P] express-rate-limit 적용하여 API 레이트 제한 설정
- [ ] T054 [P] 반응형 디자인 검증 및 모바일 UI 최적화
- [ ] T055 quickstart.md 기준 전체 동작 검증

---

## 의존성 및 실행 순서

### 단계별 의존성

- **설정 (Phase 1)**: 의존성 없음 - 즉시 시작 가능
- **기반 (Phase 2)**: 설정 완료 후 시작 - 모든 사용자 스토리를 차단함
- **사용자 스토리 (Phase 3-6)**: 기반 단계 완료 후 시작 가능
  - 팀 인원에 따라 병렬 또는 우선순위 순서(P1 → P2 → P3 → P4)로 진행
- **마무리 (Phase 7)**: 원하는 사용자 스토리 완료 후 진행

### 사용자 스토리 간 의존성

- **사용자 스토리 1 (P1)**: 기반 단계 완료 후 시작 - 다른 스토리에 의존 없음
- **사용자 스토리 2 (P2)**: 사용자 스토리 1 완료 후 시작 (가격 추천 결과에 시세 정보 추가)
- **사용자 스토리 3 (P3)**: 기반 단계 완료 후 시작 - 독립적으로 구현 가능
- **사용자 스토리 4 (P4)**: 사용자 스토리 1 완료 후 시작 (추천 결과를 히스토리에 저장)

### 병렬 실행 가능 항목

#### Phase 1 설정 단계

```bash
# 동시 실행 가능:
Task: "T002 backend/package.json"
Task: "T003 frontend/package.json"
Task: "T004 backend/tsconfig.json"
Task: "T005 frontend/tsconfig.json"
Task: "T006 backend/.env.example"
Task: "T007 frontend/.env.example"
Task: "T008 ESLint/Prettier 설정"
```

#### Phase 2 기반 단계

```bash
# 동시 실행 가능:
Task: "T011 errorHandler.ts"
Task: "T012 validators.ts"
Task: "T013 layout.tsx"
Task: "T014 globals.css"
Task: "T015 Header.tsx"
Task: "T016 Footer.tsx"
Task: "T017 types.ts"
Task: "T018 api.ts"
```

#### Phase 3 사용자 스토리 1

```bash
# 크롤러 동시 실행 가능:
Task: "T020 bunjang.ts"
Task: "T021 joongonara.ts"

# 프론트엔드 컴포넌트 동시 실행 가능:
Task: "T026 PriceForm.tsx"
Task: "T027 PriceResult.tsx"
```

---

## 구현 전략

### MVP 우선 (사용자 스토리 1만)

1. Phase 1: 설정 완료
2. Phase 2: 기반 완료 (중요 - 모든 스토리 차단)
3. Phase 3: 사용자 스토리 1 완료
4. **중단 및 검증**: 비회원 가격 추천 기능 독립 테스트
5. 준비 완료 시 배포/데모

### 점진적 전달

1. 설정 + 기반 완료 → 기반 준비 완료
2. 사용자 스토리 1 추가 → 독립 테스트 → 배포/데모 (MVP!)
3. 사용자 스토리 2 추가 → 독립 테스트 → 배포/데모
4. 사용자 스토리 3 추가 → 독립 테스트 → 배포/데모
5. 사용자 스토리 4 추가 → 독립 테스트 → 배포/데모
6. 각 스토리는 이전 스토리를 깨뜨리지 않고 가치 추가

### 병렬 팀 전략

여러 개발자와 함께:

1. 팀 전체가 설정 + 기반 완료
2. 기반 완료 후:
   - 개발자 A: 사용자 스토리 1
   - 개발자 B: 사용자 스토리 3 (독립적)
3. 사용자 스토리 1 완료 후:
   - 개발자 A: 사용자 스토리 2
   - 개발자 B: 사용자 스토리 4
4. 각 스토리 독립적으로 완료 및 통합

---

## 참고 사항

- [P] 작업 = 다른 파일, 의존성 없음
- [Story] 레이블은 추적성을 위해 작업을 특정 사용자 스토리에 매핑
- 각 사용자 스토리는 독립적으로 완료 및 테스트 가능해야 함
- 각 작업 또는 논리적 그룹 완료 후 커밋
- 체크포인트에서 중단하여 스토리를 독립적으로 검증 가능
- 피해야 할 것: 모호한 작업, 같은 파일 충돌, 독립성을 깨는 스토리 간 의존성

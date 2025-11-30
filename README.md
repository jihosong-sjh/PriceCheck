# PriceCheck

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)

> AI 이미지 인식과 실시간 크롤링을 통해 중고 전자제품의 적정 가격을 추천해주는 풀스택 웹 서비스

중고 전자제품을 판매하거나 구매할 때 적정 가격을 모르시나요? **PriceCheck**는 번개장터, 중고나라, 헬로마켓 3개 플랫폼의 실시간 시세를 분석하여 신뢰할 수 있는 가격을 추천해 드립니다.

---

## 목차

- [주요 기능](#주요-기능)
- [시스템 아키텍처](#시스템-아키텍처)
- [지원 카테고리](#지원-카테고리)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [시작하기](#시작하기)
- [API 문서](#api-문서)
- [가격 추천 알고리즘](#가격-추천-알고리즘)
- [크롤링 시스템](#크롤링-시스템)
- [데이터베이스 스키마](#데이터베이스-스키마)
- [테스트](#테스트)
- [배포 전략](#배포-전략)
- [라이선스](#라이선스)

---

## 주요 기능

### 1. AI 상품 인식
- **Google Cloud Vision API** 통합
- 제품 사진 업로드만으로 카테고리, 브랜드, 모델명 자동 인식
- 40+ 브랜드 지원 (Apple, Samsung, LG, Sony 등)
- 신뢰도 점수 제공 (0-100%)

### 2. 실시간 시세 크롤링
- **3개 플랫폼 동시 크롤링**: 번개장터, 중고나라, 헬로마켓
- Playwright (동적 페이지) + Cheerio (정적 파싱) 하이브리드 방식
- 플랫폼당 최대 20개 매물 수집
- 평균 크롤링 시간: 8-15초

### 3. 스마트 가격 추천 알고리즘
- **IQR 기반 이상치 제거**로 정확도 향상
- 제품 상태별 가격 조정 (상: 0%, 중: -10%, 하: -20%)
- 카테고리별 합리적 가격 범위 필터링
- 신뢰도 등급 제공 (HIGH/MEDIUM/LOW)

### 4. 데이터 시각화
- **가격 분포 차트**: 수집된 데이터의 가격 분포 시각화
- **플랫폼 비교 차트**: 플랫폼별 평균 가격 비교
- **신뢰도 지표**: 추천 가격의 신뢰성 표시
- **가격 산출 설명**: 추천 가격 도출 과정 투명하게 공개

### 5. 사용자 기능
- **JWT 기반 인증**: 안전한 로그인/회원가입
- **조회 히스토리**: 이전 조회 기록 저장 및 열람
- **북마크 (찜하기)**: 관심 상품 저장

### 6. UI/UX
- **다크모드 지원**: next-themes 기반 테마 전환
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 최적화
- **Tailwind CSS**: 일관된 디자인 시스템

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js 14 + React 18)                    │
│  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────────────┐  │
│  │      Pages        │ │    Components     │ │   Charts (Recharts)       │  │
│  │  ┌─────────────┐  │ │  ┌─────────────┐  │ │  ┌─────────────────────┐  │  │
│  │  │ /           │  │ │  │ PriceForm   │  │ │  │ PriceDistribution   │  │  │
│  │  │ /price-guide│  │ │  │ ImageUpload │  │ │  │ PlatformComparison  │  │  │
│  │  │ /history    │  │ │  │ PriceResult │  │ │  │ ConfidenceIndicator │  │  │
│  │  │ /bookmarks  │  │ │  │ Bookmark    │  │ │  │ PriceExplanation    │  │  │
│  │  │ /login      │  │ │  │ Header      │  │ │  └─────────────────────┘  │  │
│  │  │ /signup     │  │ │  │ Footer      │  │ │                           │  │
│  │  └─────────────┘  │ │  └─────────────┘  │ └───────────────────────────┘  │
│  └───────────────────┘ └───────────────────┘                                │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ lib/: api.ts (API 클라이언트), auth.ts (NextAuth), types.ts (타입)   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │ HTTPS / REST API
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Backend (Express + TypeScript)                    │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ API Routes                                                            │  │
│  │  POST /api/auth/signup     - 회원가입                                 │  │
│  │  POST /api/auth/login      - 로그인                                   │  │
│  │  POST /api/price/recommend - 가격 추천 (핵심 API)                     │  │
│  │  GET  /api/history         - 조회 히스토리                            │  │
│  │  POST /api/bookmarks       - 북마크 추가                              │  │
│  │  POST /api/upload          - 이미지 업로드                            │  │
│  │  POST /api/recognize       - AI 상품 인식                             │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────┐     ┌─────────────────────────────────────┐   │
│  │   Price Calculator      │     │    Crawlers (Playwright + Cheerio) │   │
│  │  ┌───────────────────┐  │     │  ┌─────────────────────────────┐   │   │
│  │  │ 1. 가격 추출      │  │     │  │ 번개장터 (Playwright)       │   │   │
│  │  │ 2. 이상치 제거    │  │     │  │  - 모바일 에뮬레이션        │   │   │
│  │  │ 3. 통계 분석      │  │     │  │  - 동적 콘텐츠 스크롤       │   │   │
│  │  │ 4. 상태별 조정    │  │     │  ├─────────────────────────────┤   │   │
│  │  │ 5. 신뢰도 계산    │  │     │  │ 중고나라 (Cheerio)          │   │   │
│  │  └───────────────────┘  │     │  │  - 정적 HTML 파싱           │   │   │
│  └─────────────────────────┘     │  ├─────────────────────────────┤   │   │
│                                   │  │ 헬로마켓 (Cheerio)          │   │   │
│  ┌─────────────────────────┐     │  │  - 정적 HTML 파싱           │   │   │
│  │   Vision Service        │     │  └─────────────────────────────┘   │   │
│  │  (Google Cloud Vision)  │     └─────────────────────────────────────┘   │
│  │  - 라벨 감지 (20개)     │                                               │
│  │  - OCR 텍스트 추출      │     ┌─────────────────────────────────────┐   │
│  │  - 로고 인식 (5개)      │     │    Image Upload Service            │   │
│  │  - 웹 유사 검색         │     │  - AWS S3 업로드                   │   │
│  └─────────────────────────┘     │  - Sharp 이미지 최적화             │   │
│                                   │  - WebP 변환                       │   │
│                                   └─────────────────────────────────────┘   │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │ Prisma ORM
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PostgreSQL 16 (Docker)                            │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────────────┐  ┌─────────────────────┐  │
│  │     users       │  │  price_recommendations  │  │    market_data      │  │
│  │  - id           │  │  - id                   │  │  - id               │  │
│  │  - email        │  │  - userId               │  │  - productName      │  │
│  │  - password     │  │  - category             │  │  - platform         │  │
│  │  - createdAt    │  │  - productName          │  │  - price            │  │
│  └─────────────────┘  │  - recommendedPrice     │  │  - scrapedAt        │  │
│                       │  - marketDataSnapshot   │  └─────────────────────┘  │
│  ┌─────────────────┐  └─────────────────────────┘                           │
│  │   bookmarks     │  ┌─────────────────────────┐                           │
│  │  - id           │  │    product_images       │                           │
│  │  - userId       │  │  - id                   │                           │
│  │  - recId        │  │  - recommendationId     │                           │
│  │  - memo         │  │  - imageUrl             │                           │
│  └─────────────────┘  └─────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 데이터 흐름

```
사용자 입력                 AI 인식 (선택)              가격 조회
     │                           │                        │
     ▼                           ▼                        ▼
┌─────────┐    ┌───────────────────────────┐    ┌──────────────────┐
│ 이미지  │───▶│ Google Vision API         │───▶│ 자동 입력        │
│ 업로드  │    │ (카테고리/브랜드/모델 인식)│    │ (카테고리, 제품명)│
└─────────┘    └───────────────────────────┘    └────────┬─────────┘
                                                         │
     ┌───────────────────────────────────────────────────┘
     ▼
┌────────────────────────────────────────────────────────────────────┐
│                       가격 추천 프로세스                            │
│                                                                    │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────────────┐│
│  │ 3개 플랫폼│──▶│ 이상치   │──▶│ 통계    │──▶│ 상태별 조정      ││
│  │ 크롤링    │   │ 제거     │   │ 분석    │   │ (상/중/하)       ││
│  └──────────┘   └──────────┘   └──────────┘   └──────────────────┘│
└─────────────────────────────────────────────────────────────────┬──┘
                                                                  │
     ┌────────────────────────────────────────────────────────────┘
     ▼
┌────────────────────────────────────────────────────────────────────┐
│                           결과 표시                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ 추천 가격    │  │ 가격 분포    │  │ 플랫폼별     │              │
│  │ (천원 단위)  │  │ 차트         │  │ 비교 차트    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐                                │
│  │ 신뢰도 지표  │  │ 찜하기/저장  │                                │
│  └──────────────┘  └──────────────┘                                │
└────────────────────────────────────────────────────────────────────┘
```

---

## 지원 카테고리

| 카테고리 | Enum | 가격 범위 | 주요 브랜드 |
|---------|------|----------|------------|
| 스마트폰 | `SMARTPHONE` | 5만 ~ 200만원 | Apple, Samsung, Google, Xiaomi |
| 노트북 | `LAPTOP` | 10만 ~ 500만원 | Apple, Lenovo, HP, Dell, ASUS |
| 태블릿 | `TABLET` | 5만 ~ 200만원 | Apple, Samsung, Lenovo |
| 스마트워치 | `SMARTWATCH` | 3만 ~ 100만원 | Apple, Samsung, Garmin |
| 이어폰/헤드폰 | `EARPHONE` | 1만 ~ 50만원 | Apple, Sony, Samsung, Bose |
| 블루투스 스피커 | `SPEAKER` | 2만 ~ 100만원 | JBL, Bose, Marshall, Harman Kardon |
| 모니터 | `MONITOR` | 5만 ~ 300만원 | LG, Samsung, Dell, ASUS, BenQ |
| 키보드/마우스 | `KEYBOARD_MOUSE` | 1만 ~ 50만원 | Logitech, Razer, Corsair, Ducky |
| TV | `TV` | 10만 ~ 1000만원 | Samsung, LG, Sony |

---

## 기술 스택

### Frontend
| 기술 | 버전 | 용도 |
|-----|------|-----|
| Next.js | 14.2 | React 풀스택 프레임워크 |
| React | 18.3 | UI 라이브러리 |
| TypeScript | 5.6 | 정적 타입 시스템 |
| Tailwind CSS | 3.4 | 유틸리티 CSS 프레임워크 |
| NextAuth.js | 5.0-beta | 인증 라이브러리 |
| Recharts | 3.5 | 차트 라이브러리 |
| next-themes | 0.4 | 다크모드 지원 |

### Backend
| 기술 | 버전 | 용도 |
|-----|------|-----|
| Express | 4.21 | Node.js 웹 프레임워크 |
| TypeScript | 5.6 | 정적 타입 시스템 |
| Prisma | 5.22 | ORM (데이터베이스 접근) |
| Playwright | 1.49 | 동적 웹 크롤링 |
| Cheerio | 1.0 | HTML 파싱 |
| jsonwebtoken | 9.0 | JWT 토큰 생성/검증 |
| bcryptjs | 2.4 | 비밀번호 해싱 |
| Zod | 3.23 | 스키마 검증 |
| Sharp | 0.33 | 이미지 처리/최적화 |
| Axios | 1.7 | HTTP 클라이언트 |

### Database
| 기술 | 버전 | 용도 |
|-----|------|-----|
| PostgreSQL | 16 | 관계형 데이터베이스 |
| Docker | - | 컨테이너 환경 |

### External Services
| 서비스 | 용도 |
|-------|-----|
| Google Cloud Vision API | 이미지 인식 (라벨, OCR, 로고, 웹 검색) |
| AWS S3 | 이미지 저장소 |

### Dev Tools
| 도구 | 용도 |
|-----|-----|
| Jest | 단위/통합 테스트 |
| Supertest | API 테스트 |
| ESLint | 코드 린팅 |
| Prettier | 코드 포맷팅 |

---

## 프로젝트 구조

```
PriceCheck/
├── frontend/                          # Next.js 프론트엔드
│   ├── app/                           # App Router
│   │   ├── (auth)/                    # 인증 페이지 그룹
│   │   │   ├── login/page.tsx         # 로그인
│   │   │   └── signup/page.tsx        # 회원가입
│   │   ├── bookmarks/page.tsx         # 찜 목록
│   │   ├── history/
│   │   │   ├── page.tsx               # 히스토리 목록
│   │   │   └── [id]/page.tsx          # 히스토리 상세
│   │   ├── price-guide/page.tsx       # 가격 추천 (핵심)
│   │   ├── privacy/page.tsx           # 개인정보처리방침
│   │   ├── terms/page.tsx             # 이용약관
│   │   ├── globals.css                # 전역 스타일
│   │   ├── layout.tsx                 # 루트 레이아웃
│   │   └── page.tsx                   # 홈페이지
│   ├── components/                    # React 컴포넌트
│   │   ├── charts/                    # 차트 컴포넌트
│   │   │   ├── ConfidenceIndicator.tsx
│   │   │   ├── PlatformComparisonChart.tsx
│   │   │   ├── PriceDistributionChart.tsx
│   │   │   └── PriceExplanationCard.tsx
│   │   ├── BookmarkButton.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── ImageUpload.tsx
│   │   ├── MarketComparison.tsx
│   │   ├── PriceForm.tsx
│   │   ├── PriceResult.tsx
│   │   └── Providers.tsx
│   ├── lib/                           # 유틸리티
│   │   ├── api.ts                     # API 클라이언트
│   │   ├── auth.ts                    # NextAuth 설정
│   │   ├── chartUtils.ts              # 차트 유틸
│   │   └── types.ts                   # 타입 정의
│   ├── middleware.ts                  # 인증 미들웨어
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   └── package.json
│
├── backend/                           # Express 백엔드
│   ├── src/
│   │   ├── api/                       # API 라우트
│   │   │   ├── auth.ts                # 인증 API
│   │   │   ├── bookmark.ts            # 북마크 API
│   │   │   ├── history.ts             # 히스토리 API
│   │   │   ├── price.ts               # 가격 추천 API
│   │   │   ├── recognize.ts           # 상품 인식 API
│   │   │   └── upload.ts              # 이미지 업로드 API
│   │   ├── services/                  # 비즈니스 로직
│   │   │   ├── crawler/               # 웹 크롤러
│   │   │   │   ├── index.ts           # 크롤러 통합 관리
│   │   │   │   ├── bunjang.ts         # 번개장터
│   │   │   │   ├── joongonara.ts      # 중고나라
│   │   │   │   └── hellomarket.ts     # 헬로마켓
│   │   │   ├── auth.ts                # 인증 서비스
│   │   │   ├── priceCalculator.ts     # 가격 계산
│   │   │   ├── visionService.ts       # Vision API
│   │   │   └── imageUpload.ts         # 이미지 업로드
│   │   ├── middleware/
│   │   │   ├── auth.ts                # JWT 인증
│   │   │   └── errorHandler.ts        # 에러 처리
│   │   ├── utils/
│   │   │   └── validators.ts          # Zod 스키마
│   │   ├── lib/
│   │   │   └── prisma.ts              # Prisma 클라이언트
│   │   └── app.ts                     # Express 앱
│   ├── prisma/
│   │   ├── schema.prisma              # DB 스키마
│   │   ├── migrations/                # 마이그레이션
│   │   └── seed.ts                    # 시드 데이터
│   ├── tests/                         # 테스트
│   │   ├── unit/
│   │   ├── integration/
│   │   └── contract/
│   └── package.json
│
├── docker-compose.yml                 # Docker 설정
├── .env.example                       # 환경 변수 예시
├── CLAUDE.md                          # 개발 가이드라인
└── README.md                          # 프로젝트 문서
```

---

## 시작하기

### 필수 요구사항

- **Node.js** 20 LTS 이상
- **Docker** & **Docker Compose**
- **Google Cloud** 계정 (Vision API 사용)
- **AWS** 계정 (S3 이미지 저장소)

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/PriceCheck.git
cd PriceCheck
```

### 2. 환경 변수 설정

```bash
# 루트 디렉토리
cp .env.example .env
```

**.env 파일 설정:**

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pricecheck

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Frontend URL (CORS)
CORS_ORIGIN=http://localhost:3000

# Google Cloud Vision API
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/credentials.json

# AWS S3
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name

# Server Port
PORT=3001
```

**프론트엔드 환경 변수:**

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

### 3. Docker로 PostgreSQL 실행

```bash
docker-compose up -d
```

### 4. 백엔드 설정

```bash
cd backend

# 의존성 설치
npm install

# Prisma 마이그레이션
npx prisma migrate dev

# 개발 서버 시작
npm run dev
```

### 5. 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

### 6. 접속

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:3001/api
- **API 헬스체크**: http://localhost:3001/api/health

---

## API 문서

### 인증 API

| 메서드 | 엔드포인트 | 설명 | 인증 |
|-------|-----------|------|-----|
| POST | `/api/auth/signup` | 회원가입 | - |
| POST | `/api/auth/login` | 로그인 | - |
| GET | `/api/auth/me` | 현재 사용자 조회 | 필수 |

**회원가입 요청:**
```json
POST /api/auth/signup
{
  "email": "user@example.com",
  "password": "password123"
}
```

**로그인 응답:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "cuid123",
      "email": "user@example.com"
    }
  }
}
```

### 가격 추천 API

| 메서드 | 엔드포인트 | 설명 | 인증 |
|-------|-----------|------|-----|
| GET | `/api/price/categories` | 카테고리 목록 | - |
| GET | `/api/price/conditions` | 상태 목록 | - |
| POST | `/api/price/recommend` | 가격 추천 | 선택 |

**가격 추천 요청:**
```json
POST /api/price/recommend
{
  "category": "SMARTPHONE",
  "productName": "아이폰 15 Pro",
  "modelName": "Pro Max 256GB",
  "condition": "GOOD"
}
```

**가격 추천 응답:**
```json
{
  "success": true,
  "data": {
    "id": "rec_123",
    "input": {
      "category": "SMARTPHONE",
      "categoryName": "스마트폰",
      "productName": "아이폰 15 Pro",
      "modelName": "Pro Max 256GB",
      "condition": "GOOD",
      "conditionName": "상"
    },
    "recommendation": {
      "recommendedPrice": 1250000,
      "priceMin": 1150000,
      "priceMax": 1350000,
      "averagePrice": 1245000,
      "medianPrice": 1250000,
      "confidence": "HIGH",
      "sampleCount": 18
    },
    "marketDataSnapshot": [
      {
        "price": 1200000,
        "platform": "BUNJANG",
        "condition": null,
        "originalUrl": "https://...",
        "scrapedAt": "2025-11-30T10:00:00Z"
      }
    ],
    "crawlStats": {
      "totalItems": 45,
      "itemsByPlatform": {
        "BUNJANG": 18,
        "JOONGONARA": 15,
        "HELLOMARKET": 12
      },
      "crawlDuration": 8234
    }
  }
}
```

### 히스토리 API

| 메서드 | 엔드포인트 | 설명 | 인증 |
|-------|-----------|------|-----|
| GET | `/api/history` | 목록 조회 | 필수 |
| GET | `/api/history/:id` | 상세 조회 | 필수 |
| DELETE | `/api/history/:id` | 삭제 | 필수 |

### 북마크 API

| 메서드 | 엔드포인트 | 설명 | 인증 |
|-------|-----------|------|-----|
| GET | `/api/bookmarks` | 목록 조회 | 필수 |
| POST | `/api/bookmarks` | 추가 | 필수 |
| GET | `/api/bookmarks/check/:id` | 북마크 여부 확인 | 필수 |
| DELETE | `/api/bookmarks/:id` | 삭제 | 필수 |

### 이미지 API

| 메서드 | 엔드포인트 | 설명 | 인증 |
|-------|-----------|------|-----|
| POST | `/api/upload` | 이미지 업로드 | - |
| DELETE | `/api/upload/:key` | 이미지 삭제 | - |
| POST | `/api/recognize` | AI 상품 인식 | 선택 |

**이미지 인식 응답:**
```json
{
  "success": true,
  "data": {
    "category": "SMARTPHONE",
    "brand": "Apple",
    "productName": "Apple iPhone 15 Pro",
    "modelName": "Pro Max",
    "confidence": 95
  }
}
```

---

## 가격 추천 알고리즘

### 처리 과정

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ 1. 데이터   │──▶│ 2. 카테고리 │──▶│ 3. 이상치   │──▶│ 4. 통계     │──▶│ 5. 상태별   │
│    수집     │   │    필터링   │   │    제거     │   │    계산     │   │    조정     │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
      │                 │                 │                 │                 │
      ▼                 ▼                 ▼                 ▼                 ▼
 3개 플랫폼        가격 범위 외       IQR 방식         평균/중앙값       상태에 따라
 병렬 크롤링       데이터 제외       Q1-1.5*IQR ~     최소/최대        가격 조정
                                    Q3+1.5*IQR       표준편차
```

### 1. 데이터 수집
- 번개장터, 중고나라, 헬로마켓 3개 플랫폼 **병렬 크롤링**
- 플랫폼당 최대 20개 매물 수집
- 검색 쿼리: `{제품명} {모델명}`

### 2. 카테고리 필터링
카테고리별 합리적인 가격 범위 검증:
- 스마트폰: 5만원 ~ 200만원
- 노트북: 10만원 ~ 500만원
- TV: 10만원 ~ 1000만원
- 범위 외 데이터 제외

### 3. 이상치 제거 (IQR 방식)
```
Q1 = 25% 분위수
Q3 = 75% 분위수
IQR = Q3 - Q1

유효 범위: [Q1 - 1.5*IQR, Q3 + 1.5*IQR]
```

### 4. 통계 계산
- **추천 가격**: 중앙값 기준 (이상치에 강건)
- **가격 범위**: 최소값 ~ 최대값
- **평균/표준편차**: 신뢰도 계산에 사용

### 5. 상태별 조정

| 상태 | 조정률 | 설명 |
|-----|-------|-----|
| 상 (GOOD) | 0% | 외관 깨끗, 기능 정상 |
| 중 (FAIR) | -10% | 사용감 있음, 기능 정상 |
| 하 (POOR) | -20% | 외관 손상, 일부 기능 이상 |

### 6. 신뢰도 계산

| 등급 | 조건 |
|-----|-----|
| HIGH | 샘플 ≥ 10개 AND 변동계수 < 0.2 |
| MEDIUM | 샘플 ≥ 5개 AND 변동계수 < 0.3 |
| LOW | 그 외 (데이터 부족 또는 가격 변동 큼) |

```
변동계수(CV) = 표준편차 / 평균
```

---

## 크롤링 시스템

### 플랫폼별 구현

| 플랫폼 | 크롤링 방식 | 특징 |
|-------|-----------|------|
| **번개장터** | Playwright (동적) | 모바일 에뮬레이션, 스크롤로 데이터 로드 |
| **중고나라** | Cheerio (정적) | HTML 직접 파싱, API 폴백 지원 |
| **헬로마켓** | Cheerio (정적) | HTML 직접 파싱, API 폴백 지원 |

### 번개장터 크롤링 상세

```typescript
// 모바일 에뮬레이션 설정
viewport: { width: 375, height: 667 }

// 동적 콘텐츠 로드
1. 페이지 접속
2. 2초 대기 (콘텐츠 로드)
3. 3회 스크롤 (추가 데이터 로드)
4. HTML 파싱
```

### 가격 파싱 패턴

```javascript
// 패턴 1: "41만원" → 410,000원
const manwonMatch = /(\d+(?:\.\d+)?)\s*만\s*원?/

// 패턴 2: "150,000원" → 150,000원
const priceMatch = /(\d{1,3}(?:,\d{3})*|\d+)\s*원/

// 유효 범위: 1,000원 ~ 1억원
```

---

## 데이터베이스 스키마

### 테이블 구조

#### users
| 컬럼 | 타입 | 설명 |
|-----|-----|-----|
| id | String | CUID (기본키) |
| email | String | 이메일 (유니크) |
| password | String | bcrypt 해시 |
| createdAt | DateTime | 생성일시 |
| updatedAt | DateTime | 수정일시 |

#### price_recommendations
| 컬럼 | 타입 | 설명 |
|-----|-----|-----|
| id | String | CUID (기본키) |
| userId | String? | 사용자 ID (선택적) |
| category | Category | 카테고리 (Enum) |
| productName | String | 제품명 |
| modelName | String? | 모델명 |
| condition | Condition | 상태 (Enum) |
| recommendedPrice | Int | 추천 가격 |
| priceMin | Int | 최저 가격 |
| priceMax | Int | 최고 가격 |
| marketDataSnapshot | Json | 시장 데이터 스냅샷 |
| createdAt | DateTime | 생성일시 |

#### market_data
| 컬럼 | 타입 | 설명 |
|-----|-----|-----|
| id | String | CUID (기본키) |
| productName | String | 제품명 |
| platform | Platform | 플랫폼 (Enum) |
| price | Int | 가격 |
| originalUrl | String? | 원본 URL |
| scrapedAt | DateTime | 크롤링 시간 |

#### bookmarks
| 컬럼 | 타입 | 설명 |
|-----|-----|-----|
| id | String | CUID (기본키) |
| userId | String | 사용자 ID |
| recommendationId | String? | 추천 ID |
| memo | String? | 메모 |
| createdAt | DateTime | 생성일시 |

### Enum 정의

```prisma
enum Category {
  SMARTPHONE
  LAPTOP
  TABLET
  SMARTWATCH
  EARPHONE
  SPEAKER
  MONITOR
  KEYBOARD_MOUSE
  TV
}

enum Condition {
  GOOD   // 상
  FAIR   // 중
  POOR   // 하
}

enum Platform {
  BUNJANG      // 번개장터
  JOONGONARA   // 중고나라
  HELLOMARKET  // 헬로마켓
}
```

---

## 테스트

### 테스트 실행

```bash
# 백엔드 테스트
cd backend
npm test

# 린트 검사
npm run lint

# 전체 검사
npm test && npm run lint
```

### 테스트 구조

```
backend/tests/
├── unit/                    # 단위 테스트
│   └── services/
│       └── priceCalculator.test.ts
├── integration/             # 통합 테스트
└── contract/               # 계약 테스트
```

---

## 배포 전략

### 1단계: PWA 웹 서비스 (1-2주)

**목표**: 빠르게 실제 사용자 피드백 수집

```bash
# next-pwa 설정 추가
npm install next-pwa

# 배포
- Frontend: Vercel
- Backend: Railway 또는 Render
- Database: Railway PostgreSQL
```

**예상 비용**: 월 $0-10 (무료 플랜 활용)

### 2단계: React Native 네이티브 앱 (2-3개월)

**목표**: Google Play Store 출시

**재사용 가능 코드**:
- ✅ 백엔드 API 전체
- ✅ 데이터베이스 스키마
- ✅ API 호출 로직
- ✅ 타입 정의
- ❌ React 컴포넌트 (네이티브로 재작성)
- ❌ Tailwind CSS

**준비물**:
- Google Play Console 계정 ($25 일회성)
- 앱 서명 키 (키스토어)
- 개인정보처리방침 페이지

---

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

---

## 기여

버그 리포트, 기능 제안, PR 모두 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

# PriceCheck - 중고 전자제품 시세 추천 서비스

[![Live Demo](https://img.shields.io/badge/Demo-Live-brightgreen?style=flat-square)](https://pricecheck.kr)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)

> **AI 이미지 인식 + 실시간 크롤링 기반 중고 전자제품 적정 가격 추천 풀스택 웹 서비스**

중고 전자제품을 사거나 팔 때 적정 가격을 모르시나요? **PriceCheck**는 번개장터, 중고나라 등 주요 플랫폼의 실시간 시세를 분석하여 신뢰할 수 있는 가격을 추천합니다.

---

## 라이브 데모

- **서비스 URL**: https://pricecheck.kr
- **API 서버**: https://api.pricecheck.kr

---

## 프로젝트 개요

### 해결하는 문제
- 중고 거래 시 **적정 가격 판단의 어려움**
- 여러 플랫폼을 직접 검색해야 하는 **시간 낭비**
- 제품 사양/상태에 따른 **가격 차이 파악 어려움**

### 솔루션
1. **AI 이미지 인식**: 제품 사진만 업로드하면 카테고리/브랜드/모델 자동 인식
2. **실시간 시세 크롤링**: 3개 플랫폼 동시 크롤링으로 시장 가격 수집
3. **스마트 가격 추천**: 통계 기반 이상치 제거 + 상태별 가격 조정

---

## 주요 기능

### 1. 가격 추천 (검색 기반)
- **자동완성 검색**: 상품명 입력 시 DB + 네이버 쇼핑 API 기반 제안
- **상태별 가격 조정**: 상/중/하 상태에 따른 가격 보정
- **실시간 크롤링**: 번개장터, 중고나라, 헬로마켓 동시 수집

### 2. AI 상품 인식
- **Google Cloud Vision API** 통합
- 제품 사진 → 카테고리, 브랜드, 모델명 자동 추출
- 40+ 브랜드 지원 (Apple, Samsung, LG, Sony 등)

### 3. 데이터 시각화
- **가격 분포 차트**: 수집된 매물의 가격 분포
- **플랫폼 비교 차트**: 플랫폼별 평균 가격 비교
- **신뢰도 지표**: 추천 가격의 신뢰성 등급 (HIGH/MEDIUM/LOW)

### 4. 사용자 기능
- **JWT 인증**: 회원가입/로그인
- **조회 히스토리**: 이전 검색 기록 저장
- **북마크**: 관심 상품 찜하기 (최대 10개)
- **가격 알림**: 목표 가격 도달 시 알림

### 5. PWA 지원
- **모바일 설치**: 홈 화면에 앱처럼 추가 가능
- **오프라인 캐싱**: 기본 리소스 캐싱
- **반응형 디자인**: 모바일/태블릿/데스크톱 최적화

---

## 기술 스택

### Frontend
| 기술 | 버전 | 용도 |
|-----|------|-----|
| Next.js | 14.2 | React 풀스택 프레임워크 |
| React | 18.3 | UI 라이브러리 |
| TypeScript | 5.6 | 정적 타입 시스템 |
| Tailwind CSS | 3.4 | 유틸리티 CSS |
| NextAuth.js | 5.0-beta | 인증 |
| Recharts | 3.5 | 차트 시각화 |
| next-pwa | 5.6 | PWA 지원 |
| next-themes | 0.4 | 다크모드 |

### Backend
| 기술 | 버전 | 용도 |
|-----|------|-----|
| Express | 4.21 | Node.js 웹 프레임워크 |
| TypeScript | 5.6 | 정적 타입 시스템 |
| Prisma | 5.22 | ORM |
| Playwright | 1.49 | 동적 웹 크롤링 |
| Cheerio | 1.0 | HTML 파싱 |
| Zod | 3.23 | 스키마 검증 |
| Sharp | 0.33 | 이미지 처리 |

### Database & Infrastructure
| 서비스 | 용도 |
|-------|-----|
| PostgreSQL 16 | 관계형 데이터베이스 |
| Supabase | DB 호스팅 (프로덕션) |
| Vercel | 프론트엔드 호스팅 |
| Railway | 백엔드 호스팅 |
| AWS S3 | 이미지 저장소 |

### External APIs
| 서비스 | 용도 |
|-------|-----|
| Google Cloud Vision API | 이미지 인식 |
| 네이버 쇼핑 API | 상품 검색 자동완성 |

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                            │
│                    Next.js 14 + PWA                             │
│   pricecheck.kr                                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS / REST API
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Railway)                            │
│                    Express + TypeScript                         │
│   api.pricecheck.kr                                             │
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│   │ Price API   │  │ Auth API    │  │ Crawlers                │ │
│   │ /recommend  │  │ /login      │  │ - 번개장터 (Playwright) │ │
│   │ /search     │  │ /signup     │  │ - 중고나라 (Cheerio)    │ │
│   └─────────────┘  └─────────────┘  │ - 헬로마켓 (Cheerio)    │ │
│                                      └─────────────────────────┘ │
│   ┌─────────────┐  ┌─────────────┐                              │
│   │ Vision API  │  │ Upload API  │                              │
│   │ (Google)    │  │ (AWS S3)    │                              │
│   └─────────────┘  └─────────────┘                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Prisma ORM
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database (Supabase)                          │
│                    PostgreSQL 16                                │
│   users, price_recommendations, bookmarks, alerts, market_data  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 지원 카테고리

| 카테고리 | 가격 범위 | 주요 브랜드 |
|---------|----------|------------|
| 스마트폰 | 5만 ~ 200만원 | Apple, Samsung, Google |
| 노트북 | 10만 ~ 500만원 | Apple, Lenovo, HP, Dell |
| 태블릿 | 5만 ~ 200만원 | Apple, Samsung |
| 스마트워치 | 3만 ~ 100만원 | Apple, Samsung, Garmin |
| 이어폰/헤드폰 | 1만 ~ 50만원 | Apple, Sony, Bose |
| 블루투스 스피커 | 2만 ~ 100만원 | JBL, Bose, Marshall |
| 모니터 | 5만 ~ 300만원 | LG, Samsung, Dell |
| 키보드/마우스 | 1만 ~ 50만원 | Logitech, Razer |
| TV | 10만 ~ 1000만원 | Samsung, LG, Sony |

---

## 프로젝트 구조

```
PriceCheck/
├── frontend/                    # Next.js 프론트엔드
│   ├── app/                     # App Router 페이지
│   │   ├── page.tsx             # 홈
│   │   ├── price-guide/         # 가격 추천 (핵심)
│   │   ├── history/             # 조회 히스토리
│   │   ├── bookmarks/           # 찜 목록
│   │   ├── alerts/              # 가격 알림
│   │   └── (auth)/              # 로그인/회원가입
│   ├── components/              # React 컴포넌트
│   │   └── charts/              # 차트 컴포넌트
│   ├── lib/                     # API 클라이언트, 타입
│   └── public/                  # PWA 에셋
│
├── backend/                     # Express 백엔드
│   ├── src/
│   │   ├── api/                 # API 라우트
│   │   ├── services/            # 비즈니스 로직
│   │   │   ├── crawler/         # 웹 크롤러
│   │   │   ├── priceCalculator.ts
│   │   │   └── visionService.ts
│   │   └── middleware/          # 인증, 에러 처리
│   ├── prisma/                  # DB 스키마
│   └── railway.json             # Railway 배포 설정
│
├── docker-compose.yml           # 로컬 DB 설정
├── DEPLOY.md                    # 배포 가이드
└── README.md
```

---

## 로컬 개발 환경 설정

### 필수 요구사항
- Node.js 20 LTS
- Docker (PostgreSQL용)
- Google Cloud 계정 (Vision API)
- AWS 계정 (S3)

### 1. 저장소 클론
```bash
git clone https://github.com/jihosong-sjh/PriceCheck.git
cd PriceCheck
```

### 2. 환경 변수 설정

**backend/.env**
```env
DATABASE_URL=postgresql://pricecheck:pricecheck123@localhost:5433/pricecheck
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=pricecheck-images
NAVER_CLIENT_ID=your-naver-id
NAVER_CLIENT_SECRET=your-naver-secret
```

**frontend/.env**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
AUTH_SECRET=your-auth-secret
```

### 3. 데이터베이스 실행
```bash
docker-compose up -d
```

### 4. 백엔드 실행
```bash
cd backend
npm install
npx prisma db push
npm run dev
```

### 5. 프론트엔드 실행
```bash
cd frontend
npm install
npm run dev
```

### 6. 접속
- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:3001/api
- 헬스체크: http://localhost:3001/api/health

---

## 배포 정보

### 프로덕션 환경

| 서비스 | 플랫폼 | URL |
|-------|--------|-----|
| Frontend | Vercel | https://pricecheck.kr |
| Backend | Railway | https://api.pricecheck.kr |
| Database | Supabase | PostgreSQL (ap-southeast-2) |

### 배포 비용 (월간)
| 서비스 | 플랜 | 비용 |
|-------|------|------|
| Vercel | Hobby (무료) | $0 |
| Railway | Starter ($5 크레딧) | ~$5 |
| Supabase | Free | $0 |
| **합계** | | **$0~5** |

### CI/CD
- **Frontend**: GitHub → Vercel 자동 배포
- **Backend**: GitHub → Railway 자동 배포

---

## API 엔드포인트

### 인증
| 메서드 | 경로 | 설명 |
|-------|------|------|
| POST | `/api/auth/signup` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| GET | `/api/auth/me` | 현재 사용자 |

### 가격 추천
| 메서드 | 경로 | 설명 |
|-------|------|------|
| GET | `/api/price/categories` | 카테고리 목록 |
| POST | `/api/price/recommend` | 가격 추천 (카테고리 지정) |
| POST | `/api/price/quick-recommend` | 빠른 추천 (자동 카테고리) |

### 검색
| 메서드 | 경로 | 설명 |
|-------|------|------|
| GET | `/api/search/autocomplete` | 자동완성 |
| GET | `/api/search/popular` | 인기 검색어 |

### 히스토리 & 북마크
| 메서드 | 경로 | 설명 |
|-------|------|------|
| GET | `/api/history` | 조회 기록 |
| GET/POST/DELETE | `/api/bookmarks` | 북마크 관리 |
| GET/POST/DELETE | `/api/alerts` | 가격 알림 관리 |

### 이미지
| 메서드 | 경로 | 설명 |
|-------|------|------|
| POST | `/api/upload` | 이미지 업로드 (S3) |
| POST | `/api/recognize` | AI 상품 인식 |

---

## 가격 추천 알고리즘

```
1. 데이터 수집     → 3개 플랫폼 병렬 크롤링 (최대 60개 매물)
2. 카테고리 필터링  → 합리적 가격 범위 외 데이터 제거
3. 이상치 제거     → IQR 방식 (Q1-1.5*IQR ~ Q3+1.5*IQR)
4. 통계 계산      → 중앙값 기반 추천가, 평균, 최소/최대
5. 상태별 조정    → 상(0%), 중(-10%), 하(-20%)
6. 신뢰도 계산    → 샘플 수 + 변동계수 기반
```

### 신뢰도 등급
| 등급 | 조건 |
|-----|-----|
| HIGH | 샘플 ≥ 10개, 변동계수 < 0.2 |
| MEDIUM | 샘플 ≥ 5개, 변동계수 < 0.3 |
| LOW | 그 외 |

---

## 스크린샷

### 메인 페이지
- 서비스 소개 및 주요 기능 안내

### 가격 추천 페이지
- 검색/AI 인식 탭 전환
- 자동완성 검색
- 상태 선택 (상/중/하)
- 결과: 추천 가격, 차트, 플랫폼별 비교

### 마이페이지
- 조회 히스토리
- 찜 목록
- 가격 알림 설정

---

## 향후 계획

- [ ] React Native 앱 개발 (Play Store 출시)
- [ ] 가격 변동 추이 그래프
- [ ] 알림 기능 고도화 (이메일, 푸시)
- [ ] 더 많은 플랫폼 지원

---

## 라이선스

MIT License

---

## 문의

프로젝트에 대한 문의는 GitHub Issues를 통해 남겨주세요.

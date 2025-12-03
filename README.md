# PriceCheck - 중고 전자제품 시세 추천 서비스

[![Live Demo](https://img.shields.io/badge/Demo-Live-brightgreen?style=flat-square)](https://pricecheck.kr)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat-square&logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54-000020?style=flat-square&logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)

> **AI 이미지 인식 + 실시간 크롤링 기반 중고 전자제품 적정 가격 추천 풀스택 서비스 (웹 + 모바일 앱)**

중고 전자제품을 사거나 팔 때 적정 가격을 모르시나요? **PriceCheck**는 번개장터, 중고나라 등 주요 플랫폼의 실시간 시세를 분석하여 신뢰할 수 있는 가격을 추천합니다.

---

## 라이브 데모

- **웹 서비스**: https://pricecheck.kr
- **API 서버**: https://api.pricecheck.kr
- **모바일 앱**: 개발 완료 (Play Store 출시 준비 중)

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

### 5. 멀티 플랫폼
- **PWA 웹앱**: 홈 화면에 앱처럼 추가 가능
- **React Native 앱**: Android/iOS 네이티브 앱
- **반응형 디자인**: 모바일/태블릿/데스크톱 최적화

---

## 기술 스택

### Frontend (Web)
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

### Mobile App (React Native)
| 기술 | 버전 | 용도 |
|-----|------|-----|
| React Native | 0.81 | 크로스플랫폼 모바일 프레임워크 |
| Expo | 54 | React Native 개발 플랫폼 |
| React Navigation | 7.x | 네비게이션 |
| React Query | 5.x | 서버 상태 관리 |
| Zustand | 5.x | 클라이언트 상태 관리 |
| NativeWind | 4.x | Tailwind CSS for React Native |
| React Hook Form | 7.x | 폼 관리 |
| Zod | 4.x | 스키마 검증 |
| react-native-chart-kit | 6.x | 차트 시각화 |

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
│                         Clients                                  │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │   Web (Vercel)      │    │   Mobile App (React Native)     │ │
│  │   Next.js 14 + PWA  │    │   Expo + React Navigation       │ │
│  │   pricecheck.kr     │    │   Android / iOS                 │ │
│  └──────────┬──────────┘    └───────────────┬─────────────────┘ │
└─────────────┼───────────────────────────────┼───────────────────┘
              │         HTTPS / REST API      │
              └───────────────┬───────────────┘
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
PriceCheck/                         # 메인 저장소 (Web)
├── frontend/                       # Next.js 웹 프론트엔드
│   ├── app/                        # App Router 페이지
│   │   ├── page.tsx                # 홈
│   │   ├── price-guide/            # 가격 추천 (핵심)
│   │   ├── history/                # 조회 히스토리
│   │   ├── bookmarks/              # 찜 목록
│   │   ├── alerts/                 # 가격 알림
│   │   └── (auth)/                 # 로그인/회원가입
│   ├── components/                 # React 컴포넌트
│   │   └── charts/                 # 차트 컴포넌트
│   ├── lib/                        # API 클라이언트, 타입
│   └── public/                     # PWA 에셋
│
├── backend/                        # Express 백엔드
│   ├── src/
│   │   ├── api/                    # API 라우트
│   │   ├── services/               # 비즈니스 로직
│   │   │   ├── crawler/            # 웹 크롤러
│   │   │   ├── priceCalculator.ts
│   │   │   └── visionService.ts
│   │   └── middleware/             # 인증, 에러 처리
│   ├── prisma/                     # DB 스키마
│   └── railway.json                # Railway 배포 설정
│
├── docker-compose.yml              # 로컬 DB 설정
├── DEPLOY.md                       # 배포 가이드
└── README.md

PriceCheckApp/                      # 별도 저장소 (Mobile)
├── App.tsx                         # 앱 진입점
├── src/
│   ├── screens/                    # 화면 컴포넌트
│   │   ├── HomeScreen.tsx          # 홈
│   │   ├── PriceGuideScreen.tsx    # 가격 추천
│   │   ├── ResultScreen.tsx        # 결과 화면
│   │   ├── HistoryScreen.tsx       # 히스토리
│   │   ├── BookmarksScreen.tsx     # 북마크
│   │   ├── AlertsScreen.tsx        # 가격 알림
│   │   ├── MyPageScreen.tsx        # 마이페이지
│   │   ├── LoginScreen.tsx         # 로그인
│   │   └── SignupScreen.tsx        # 회원가입
│   ├── components/                 # 재사용 컴포넌트
│   │   ├── charts/                 # 차트 컴포넌트
│   │   ├── common/                 # 공통 UI
│   │   ├── search/                 # 검색 관련
│   │   └── modals/                 # 모달
│   ├── navigation/                 # 네비게이션
│   │   ├── RootNavigator.tsx       # 루트 네비게이터
│   │   ├── AuthNavigator.tsx       # 인증 네비게이터
│   │   └── MainNavigator.tsx       # 메인 네비게이터
│   ├── contexts/                   # Context API
│   │   ├── AuthContext.tsx         # 인증 상태
│   │   └── ToastContext.tsx        # 토스트 알림
│   ├── lib/                        # 유틸리티
│   │   ├── api.ts                  # API 클라이언트
│   │   ├── types.ts                # 타입 정의
│   │   └── storage.ts              # 로컬 저장소
│   └── utils/                      # 헬퍼 함수
├── assets/                         # 이미지, 아이콘
├── app.json                        # Expo 설정
├── eas.json                        # EAS Build 설정
└── tailwind.config.js              # NativeWind 설정
```

---

## 로컬 개발 환경 설정

### 필수 요구사항
- Node.js 20 LTS
- Docker (PostgreSQL용)
- Google Cloud 계정 (Vision API)
- AWS 계정 (S3)
- Android Studio (모바일 앱 개발 시)

### 1. 저장소 클론
```bash
# 웹 프로젝트
git clone https://github.com/jihosong-sjh/PriceCheck.git
cd PriceCheck

# 모바일 앱 (별도)
git clone https://github.com/jihosong-sjh/PriceCheckApp.git
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

**PriceCheckApp/.env**
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001/api  # Android 에뮬레이터
# EXPO_PUBLIC_API_URL=http://localhost:3001/api  # iOS 시뮬레이터
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

### 5. 프론트엔드 실행 (Web)
```bash
cd frontend
npm install
npm run dev
```

### 6. 모바일 앱 실행
```bash
cd PriceCheckApp
npm install
npm start          # Expo 개발 서버
# 또는
npm run android    # Android 에뮬레이터
npm run ios        # iOS 시뮬레이터 (macOS만)
```

### 7. 접속
- 웹 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:3001/api
- 헬스체크: http://localhost:3001/api/health
- Expo 개발 서버: http://localhost:8081

---

## 배포 정보

### 프로덕션 환경

| 서비스 | 플랫폼 | URL/상태 |
|-------|--------|---------|
| Web Frontend | Vercel | https://pricecheck.kr |
| Backend | Railway | https://api.pricecheck.kr |
| Database | Supabase | PostgreSQL (ap-southeast-2) |
| Mobile App | Play Store | 출시 준비 중 |

### 배포 비용 (월간)
| 서비스 | 플랜 | 비용 |
|-------|------|------|
| Vercel | Hobby (무료) | $0 |
| Railway | Starter ($5 크레딧) | ~$5 |
| Supabase | Free | $0 |
| Play Store | 개발자 계정 | $25 (일회성) |
| **합계** | | **$0~5** |

### CI/CD
- **Frontend**: GitHub → Vercel 자동 배포
- **Backend**: GitHub → Railway 자동 배포
- **Mobile**: EAS Build → Play Store

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

## 모바일 앱 특징

### 주요 화면
- **홈**: 빠른 검색 및 서비스 소개
- **가격 추천**: 검색/AI 인식 기반 시세 조회
- **결과**: 추천 가격, 차트, 플랫폼별 비교
- **히스토리**: 이전 검색 기록
- **북마크**: 관심 상품 관리
- **알림**: 목표가 도달 알림
- **마이페이지**: 계정 관리

### 기술적 특징
- **인증 상태 관리**: Context API + Expo SecureStore
- **서버 상태 관리**: React Query (캐싱, 리페치)
- **클라이언트 상태**: Zustand
- **스타일링**: NativeWind (Tailwind CSS)
- **폼 검증**: React Hook Form + Zod
- **차트**: react-native-chart-kit + react-native-svg
- **네비게이션**: React Navigation (Stack + Bottom Tab)

### 빌드 & 배포
```bash
# 개발 빌드
eas build --profile development --platform android

# 프로덕션 빌드
eas build --profile production --platform android

# Play Store 제출
eas submit --platform android
```

---

## 향후 계획

- [x] React Native 앱 개발
- [ ] Play Store 출시
- [ ] iOS 앱 출시
- [ ] 푸시 알림 (FCM)
- [ ] 가격 변동 추이 그래프
- [ ] 알림 기능 고도화 (이메일)
- [ ] 더 많은 플랫폼 지원

---

## 라이선스

MIT License

---

## 문의

프로젝트에 대한 문의는 GitHub Issues를 통해 남겨주세요.

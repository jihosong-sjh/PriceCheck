# 기술 리서치: 중고 전자제품 가격 가이드

**날짜**: 2025-11-28
**브랜치**: `001-price-guide`

## 1. 프론트엔드 프레임워크

### 결정: Next.js 14 + TypeScript

**근거**:
- SSR/SSG 지원으로 SEO 최적화 가능
- API Routes로 간단한 백엔드 로직 처리 가능
- 이미지 최적화 기능 내장 (next/image)
- 한국어 i18n 지원 (next-i18next)
- 활발한 한국 개발자 커뮤니티

**대안 검토**:
| 대안 | 장점 | 제외 이유 |
|------|------|----------|
| React + Vite | 빠른 빌드 | 백엔드 분리 필요, 배포 복잡 |
| Vue 3 | 낮은 학습곡선 | 한국 생태계 상대적으로 약함 |

---

## 2. 백엔드 프레임워크

### 결정: Node.js + Express + TypeScript

**근거**:
- 프론트엔드와 동일 언어로 개발 효율성 향상
- Playwright/Cheerio와 완벽 호환 (크롤링)
- REST API 구성에 최적화
- 대부분의 호스팅 플랫폼 지원

**대안 검토**:
| 대안 | 장점 | 제외 이유 |
|------|------|----------|
| FastAPI (Python) | 빠른 성능, 자동 문서화 | 언어 분리로 복잡도 증가 |
| Django | 풍부한 패키지 | MVP 단계에서 과도한 기능 |
| Go (Gin) | 빠른 성능 | 크롤링 라이브러리 생태계 약함 |

---

## 3. 데이터베이스

### 결정: PostgreSQL + Prisma ORM

**근거**:
- ACID 준수로 사용자 정보 일관성 보장
- JSON/JSONB 지원으로 유연한 시세 데이터 저장
- 향후 복잡한 분석 쿼리 지원
- AWS RDS 서울 리전 지원
- Prisma ORM으로 타입 안전한 쿼리

**대안 검토**:
| 대안 | 장점 | 제외 이유 |
|------|------|----------|
| MySQL | 가볍고 빠름 | JSON 지원 상대적 약함 |
| MongoDB | 유연한 스키마 | 사용자 정보에 ACID 필수 |

---

## 4. 크롤링 도구

### 결정: Playwright + Cheerio (혼합 방식)

**근거**:
- Playwright: JavaScript 렌더링 필요한 사이트(번개장터) 처리
- Cheerio: 정적 페이지(중고나라) 빠른 파싱
- TypeScript 완벽 지원
- 크로스 플랫폼 지원

**크롤링 전략**:
```
번개장터: Playwright (동적 렌더링) + Cheerio (HTML 파싱)
중고나라: Axios + Cheerio (정적 페이지)
```

**대안 검토**:
| 대안 | 장점 | 제외 이유 |
|------|------|----------|
| Puppeteer | 성숙한 라이브러리 | Playwright보다 느림 |
| Scrapy | Python 최고의 크롤러 | Node.js 스택과 부조화 |
| Selenium | 최고의 호환성 | 느린 성능 |

---

## 5. 인증 시스템

### 결정: NextAuth.js v5 (Credentials + 선택적 OAuth)

**근거**:
- Next.js와 완벽 통합
- 이메일/비밀번호 인증 지원
- Naver, Kakao OAuth 확장 가능
- 자동 CSRF 방지, 세션 관리
- JWT 기반 세션 전략

**대안 검토**:
| 대안 | 장점 | 제외 이유 |
|------|------|----------|
| JWT 직접 구현 | 가볍고 유연함 | 보안 구현 복잡 |
| 세션 기반 | 서버 제어 우수 | 분산 시스템 확장 시 부적합 |

---

## 6. 이미지 저장소

### 결정: AWS S3 (서울 리전)

**근거**:
- 무제한 용량, 높은 확장성
- 서울 리전(ap-northeast-2) 저지연
- CloudFront CDN 연동 가능
- 비용 효율적

**이미지 처리 전략**:
```
1. Multer로 파일 수신
2. Sharp로 최적화 (WebP 변환, 리사이징)
3. S3 업로드
4. CloudFront URL 반환
```

**대안 검토**:
| 대안 | 장점 | 제외 이유 |
|------|------|----------|
| Cloudinary | 자동 최적화 | 가격 예측 어려움 |
| 로컬 저장소 | 구현 간단 | 프로덕션 환경 부적합 |

---

## 7. 테스트 프레임워크

### 결정: Jest + Supertest + Playwright Test

**근거**:
- Jest: 단위 테스트
- Supertest: API 통합 테스트
- Playwright Test: E2E 테스트
- 모두 TypeScript 지원

---

## 8. 배포 전략

### 결정: Vercel (프론트엔드) + Railway/AWS EC2 (백엔드)

**근거**:
- Vercel: Next.js 최적화 호스팅, 자동 배포
- Railway/EC2: Node.js 서버, 크롤러 스케줄링

**대안 검토**:
| 대안 | 장점 | 제외 이유 |
|------|------|----------|
| AWS Amplify | 풀스택 통합 | 설정 복잡 |
| Heroku | 간단한 배포 | 가격 정책 변경 |

---

## 기술 스택 요약

| 계층 | 기술 | 버전 |
|------|------|------|
| 프론트엔드 | Next.js + TypeScript | 14.x |
| UI 라이브러리 | React + TailwindCSS | 18.x + 3.x |
| 백엔드 | Node.js + Express | 20 LTS |
| ORM | Prisma | 5.x |
| 데이터베이스 | PostgreSQL | 15+ |
| 크롤링 | Playwright + Cheerio | 1.40+ |
| 인증 | NextAuth.js | 5.x |
| 이미지 처리 | Sharp + Multer | 0.32+ |
| 저장소 | AWS S3 | - |
| 테스트 | Jest + Supertest | 29.x |
| 배포 | Vercel + Railway | - |

---

## 성능 요구사항

| 지표 | 목표 |
|------|------|
| 가격 추천 응답 시간 | < 3초 (크롤링 포함) |
| 페이지 로드 시간 | < 2초 |
| 동시 사용자 | 100명 |
| 이미지 업로드 | < 10MB, < 5초 |

---

## 보안 고려사항

- HTTPS 필수 (Vercel 자동)
- SQL 인젝션 방지 (Prisma ORM)
- XSS 방지 (React 자동)
- CSRF 토큰 (NextAuth.js)
- 비밀번호 해싱 (bcryptjs)
- API 레이트 제한 (express-rate-limit)
- 환경 변수 보호 (.env)

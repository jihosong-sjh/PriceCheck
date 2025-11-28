# 빠른 시작 가이드: 중고 전자제품 가격 가이드

**날짜**: 2025-11-28
**브랜치**: `001-price-guide`

## 사전 요구사항

다음 도구들이 설치되어 있어야 합니다:

- **Node.js**: 20 LTS 이상
- **npm**: 10 이상 (또는 pnpm/yarn)
- **PostgreSQL**: 15 이상
- **Docker**: (선택) 데이터베이스 컨테이너용
- **Git**: 버전 관리

```bash
# 버전 확인
node --version  # v20.x.x
npm --version   # 10.x.x
psql --version  # 15.x
```

---

## 1. 프로젝트 클론

```bash
git clone https://github.com/your-org/PriceCheck.git
cd PriceCheck
git checkout 001-price-guide
```

---

## 2. 환경 설정

### 2.1 데이터베이스 설정

**Option A: Docker 사용 (권장)**

```bash
# PostgreSQL 컨테이너 실행
docker run --name pricecheck-db \
  -e POSTGRES_USER=pricecheck \
  -e POSTGRES_PASSWORD=pricecheck123 \
  -e POSTGRES_DB=pricecheck \
  -p 5432:5432 \
  -d postgres:15

# 컨테이너 상태 확인
docker ps
```

**Option B: 로컬 PostgreSQL**

```bash
# 데이터베이스 생성
psql -U postgres
CREATE DATABASE pricecheck;
CREATE USER pricecheck WITH PASSWORD 'pricecheck123';
GRANT ALL PRIVILEGES ON DATABASE pricecheck TO pricecheck;
\q
```

### 2.2 환경 변수 설정

**백엔드 환경 변수** (`backend/.env`)

```bash
cd backend
cp .env.example .env
```

```env
# 데이터베이스
DATABASE_URL=postgresql://pricecheck:pricecheck123@localhost:5432/pricecheck

# JWT 시크릿 (임의의 문자열 생성)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# AWS S3 (이미지 업로드용)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=pricecheck-images
AWS_REGION=ap-northeast-2

# 서버 설정
PORT=3001
NODE_ENV=development
```

**프론트엔드 환경 변수** (`frontend/.env.local`)

```bash
cd frontend
cp .env.example .env.local
```

```env
# API 서버 URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# NextAuth 설정
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-change-in-production
```

---

## 3. 의존성 설치

```bash
# 백엔드 의존성
cd backend
npm install

# 프론트엔드 의존성
cd ../frontend
npm install
```

---

## 4. 데이터베이스 마이그레이션

```bash
cd backend

# Prisma 클라이언트 생성
npx prisma generate

# 마이그레이션 실행
npx prisma migrate dev --name init

# (선택) 시드 데이터 삽입
npx prisma db seed
```

---

## 5. 개발 서버 실행

**터미널 1: 백엔드 서버**

```bash
cd backend
npm run dev
# ✓ Server running on http://localhost:3001
```

**터미널 2: 프론트엔드 서버**

```bash
cd frontend
npm run dev
# ✓ Ready on http://localhost:3000
```

---

## 6. 동작 확인

### 6.1 API 헬스체크

```bash
curl http://localhost:3001/api/health
# {"status":"ok"}
```

### 6.2 카테고리 조회

```bash
curl http://localhost:3001/api/price/categories
# {"categories":[{"code":"SMARTPHONE","name":"스마트폰"},...]
```

### 6.3 가격 추천 테스트

```bash
curl -X POST http://localhost:3001/api/price/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "category": "SMARTPHONE",
    "productName": "iPhone 14 Pro",
    "modelName": "128GB",
    "condition": "GOOD"
  }'
```

### 6.4 웹 인터페이스

브라우저에서 `http://localhost:3000` 접속

---

## 7. 테스트 실행

```bash
# 백엔드 테스트
cd backend
npm test              # 전체 테스트
npm run test:unit     # 단위 테스트
npm run test:int      # 통합 테스트

# 프론트엔드 테스트
cd frontend
npm test              # 전체 테스트
npm run test:e2e      # E2E 테스트 (Playwright)
```

---

## 8. 유용한 명령어

### Prisma Studio (데이터베이스 GUI)

```bash
cd backend
npx prisma studio
# ✓ Prisma Studio is up on http://localhost:5555
```

### API 문서 확인

```bash
# OpenAPI 스펙 파일
cat specs/001-price-guide/contracts/api.yaml

# Swagger UI (설치 필요)
npx swagger-ui-express
```

### 데이터베이스 리셋

```bash
cd backend
npx prisma migrate reset --force
```

---

## 9. 프로젝트 구조

```
PriceCheck/
├── backend/                 # 백엔드 (Express + TypeScript)
│   ├── src/
│   │   ├── api/            # API 라우트
│   │   ├── services/       # 비즈니스 로직
│   │   ├── middleware/     # 미들웨어
│   │   └── app.ts          # 앱 진입점
│   ├── prisma/
│   │   └── schema.prisma   # 데이터베이스 스키마
│   └── tests/              # 백엔드 테스트
│
├── frontend/               # 프론트엔드 (Next.js)
│   ├── app/               # 페이지 라우트
│   ├── components/        # React 컴포넌트
│   ├── lib/               # 유틸리티
│   └── tests/             # 프론트엔드 테스트
│
└── specs/                  # 스펙 문서
    └── 001-price-guide/
        ├── spec.md         # 기능 명세
        ├── plan.md         # 구현 계획
        ├── research.md     # 기술 리서치
        ├── data-model.md   # 데이터 모델
        ├── quickstart.md   # 이 파일
        └── contracts/      # API 계약
```

---

## 10. 문제 해결

### 데이터베이스 연결 오류

```bash
# PostgreSQL 서비스 확인
docker ps | grep pricecheck-db

# 연결 테스트
psql postgresql://pricecheck:pricecheck123@localhost:5432/pricecheck
```

### Playwright 브라우저 설치

```bash
cd backend
npx playwright install chromium
```

### 포트 충돌

```bash
# 포트 사용 프로세스 확인
lsof -i :3000
lsof -i :3001

# 프로세스 종료
kill -9 <PID>
```

### 캐시 정리

```bash
# npm 캐시
npm cache clean --force

# Next.js 캐시
rm -rf frontend/.next
```

---

## 다음 단계

1. `/speckit.tasks` 명령어로 구현 작업 목록 생성
2. P1 기능(가격 추천)부터 순차적으로 구현
3. 테스트 작성 → 구현 → 리팩토링 (TDD 사이클)

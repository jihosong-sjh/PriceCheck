# PriceCheck 배포 가이드

## 아키텍처 개요

```
[사용자] -> [Vercel (프론트엔드)] -> [Railway (백엔드 API)] -> [PostgreSQL]
              Next.js + PWA            Express.js              Prisma
```

## 1. 데이터베이스 설정 (Railway PostgreSQL)

### Railway에서 PostgreSQL 생성
1. https://railway.app 접속 후 로그인
2. "New Project" → "Provision PostgreSQL"
3. PostgreSQL 서비스 클릭 → "Variables" 탭
4. `DATABASE_URL` 복사

## 2. 백엔드 배포 (Railway)

### 환경 변수 설정
Railway 프로젝트에서 "Variables" 탭에 추가:

```env
DATABASE_URL=<PostgreSQL URL>
JWT_SECRET=<강력한 랜덤 문자열>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-vercel-domain.vercel.app
NODE_ENV=production

# AWS S3 (이미지 업로드)
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
AWS_S3_BUCKET=<bucket-name>
AWS_REGION=ap-northeast-2

# Google Vision API
GOOGLE_APPLICATION_CREDENTIALS=/app/google-credentials.json
```

### 배포 단계
1. GitHub 저장소 연결
2. "Add New Service" → "GitHub Repo" 선택
3. Root Directory: `backend`
4. Build Command: `npm run build`
5. Start Command: `npm run start`
6. 환경 변수 설정 후 Deploy

### 데이터베이스 마이그레이션
Railway Shell에서 실행:
```bash
npx prisma migrate deploy
```

## 3. 프론트엔드 배포 (Vercel)

### Vercel 프로젝트 설정
1. https://vercel.com 접속 후 로그인
2. "Add New Project" → GitHub 저장소 Import
3. Root Directory: `frontend`
4. Framework Preset: Next.js (자동 감지)

### 환경 변수 설정
Vercel 프로젝트 Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app/api
AUTH_URL=https://your-vercel-domain.vercel.app
AUTH_SECRET=<강력한 랜덤 문자열>
NODE_ENV=production
```

### 빌드 설정
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

## 4. PWA 설정 확인

### 필수 파일
- [x] `frontend/public/manifest.json` - PWA 매니페스트
- [x] `frontend/next.config.mjs` - next-pwa 설정
- [ ] `frontend/public/icons/` - 앱 아이콘 (생성 필요)

### 아이콘 생성
`frontend/public/icons/README.md` 참조하여 아이콘 생성

### PWA 테스트
1. Chrome DevTools → Application → Manifest 확인
2. Lighthouse PWA 감사 실행
3. "설치" 버튼 동작 확인

## 5. 도메인 설정 (선택)

### Vercel 커스텀 도메인
1. Settings → Domains
2. 도메인 추가 후 DNS 레코드 설정

### Railway 커스텀 도메인
1. Settings → Networking → Custom Domain
2. CNAME 레코드 설정

## 6. 배포 후 체크리스트

- [ ] 헬스체크 확인: `GET /api/health`
- [ ] 로그인/회원가입 테스트
- [ ] 가격 조회 기능 테스트
- [ ] 이미지 업로드 테스트
- [ ] PWA 설치 테스트
- [ ] 가격 알림 등록 테스트
- [ ] 모바일 반응형 확인

## 7. 모니터링

### Railway 로그
- Dashboard → 서비스 선택 → "Observability" 탭

### Vercel 로그
- Dashboard → 프로젝트 → "Logs" 탭

### 에러 모니터링 (권장)
- Sentry 연동 고려

## 비용 예상

### 무료 플랜 활용 시
- Vercel: Hobby 플랜 무료
- Railway: $5 크레딧/월 (초과 시 과금)
- PostgreSQL: Railway 내 포함

### 예상 월 비용
- 초기: $0 ~ $10
- 사용자 증가 시: $20 ~ $50

## 트러블슈팅

### CORS 오류
- Railway 환경 변수 `CORS_ORIGIN`이 Vercel 도메인과 일치하는지 확인

### 데이터베이스 연결 실패
- `DATABASE_URL` 형식 확인: `postgresql://user:pass@host:port/db`
- Railway PostgreSQL 서비스가 활성 상태인지 확인

### PWA 서비스 워커 오류
- HTTPS 환경에서만 동작
- 개발 환경에서는 비활성화 (`disable: process.env.NODE_ENV === 'development'`)

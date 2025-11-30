# PriceCheck 배포 가이드

이 문서는 PriceCheck 서비스를 외부에서 접속 가능하도록 배포하는 방법을 안내합니다.

## 배포 아키텍처

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Vercel      │     │    Railway      │     │    Supabase     │
│   (Frontend)    │────▶│   (Backend)     │────▶│   (PostgreSQL)  │
│   Next.js PWA   │     │   Express API   │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**예상 비용**: 월 $0~5 (무료 플랜 범위 내)

---

## 1단계: 데이터베이스 배포 (Supabase)

### 1.1 Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 가입
2. **New Project** 클릭
3. 프로젝트 정보 입력:
   - Name: `pricecheck`
   - Database Password: 강력한 비밀번호 생성 (저장해둘 것!)
   - Region: **Northeast Asia (Tokyo)** 선택
4. **Create new project** 클릭

### 1.2 Database URL 복사

1. 프로젝트 생성 완료 후 **Settings** > **Database** 이동
2. **Connection string** > **URI** 복사
3. `[YOUR-PASSWORD]` 부분을 실제 비밀번호로 교체

```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

---

## 2단계: 백엔드 배포 (Railway)

### 2.1 Railway 프로젝트 생성

1. [Railway](https://railway.app) 가입 (GitHub 계정으로 로그인)
2. **New Project** > **Deploy from GitHub repo** 선택
3. PriceCheck 저장소 선택
4. **Add variables** 클릭 후 환경변수 설정

### 2.2 Railway 설정

**Settings 탭:**
- Root Directory: `backend`
- Watch Paths: `/backend/**`

### 2.3 환경변수 설정

Railway Dashboard > **Variables** 탭에서 추가:

```env
# 데이터베이스 (Supabase에서 복사)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# 인증 (강력한 랜덤 문자열 생성: https://generate-secret.vercel.app/32)
JWT_SECRET=[32자 이상 랜덤 문자열]
JWT_EXPIRES_IN=7d

# AWS S3 (기존 로컬 .env에서 복사)
AWS_ACCESS_KEY_ID=[기존값]
AWS_SECRET_ACCESS_KEY=[기존값]
AWS_S3_BUCKET=pricecheck-images
AWS_REGION=ap-northeast-2

# 서버
PORT=3001
NODE_ENV=production

# CORS (Vercel 배포 후 업데이트 필요)
CORS_ORIGIN=https://your-frontend-domain.vercel.app

# Google Vision API (JSON을 한 줄로 변환하여 입력)
GOOGLE_CREDENTIALS_JSON={"type":"service_account","project_id":"...",...}

# 네이버 API (기존 .env에서 복사)
NAVER_CLIENT_ID=[기존값]
NAVER_CLIENT_SECRET=[기존값]

# 가격 알림 작업
ENABLE_ALERT_JOB=true
```

**Google Credentials JSON 변환 방법:**
```bash
# 로컬에서 실행 (PowerShell)
(Get-Content google-credentials.json -Raw) -replace "`r`n", "" -replace "`n", "" -replace "  ", ""

# 또는 Node.js로
node -e "console.log(JSON.stringify(require('./google-credentials.json')))"
```

### 2.4 Prisma 마이그레이션

Railway 배포 후, 로컬에서 실행:

```bash
cd backend

# Supabase DATABASE_URL로 마이그레이션
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres" npx prisma db push
```

### 2.5 배포 확인

Railway Dashboard에서 **Deploy** 탭 확인:
- 빌드 로그에서 에러 없는지 확인
- 배포 완료 후 제공되는 URL 복사 (예: `https://pricecheck-backend.up.railway.app`)

**헬스 체크:**
```
https://pricecheck-backend.up.railway.app/api/health
```

---

## 3단계: 프론트엔드 배포 (Vercel)

### 3.1 Vercel 프로젝트 생성

1. [Vercel](https://vercel.com) 가입 (GitHub 계정으로 로그인)
2. **Add New...** > **Project** 클릭
3. PriceCheck 저장소 **Import**
4. 설정:
   - Framework Preset: **Next.js** (자동 감지)
   - Root Directory: `frontend`

### 3.2 환경변수 설정

**Settings** > **Environment Variables**:

```env
# API 서버 URL (Railway에서 복사)
NEXT_PUBLIC_API_URL=https://pricecheck-backend.up.railway.app/api

# NextAuth (강력한 랜덤 문자열 생성)
AUTH_SECRET=[32자 이상 랜덤 문자열]
AUTH_URL=https://your-project.vercel.app

# 환경
NODE_ENV=production
```

### 3.3 배포

**Deploy** 클릭 후 빌드 완료 대기 (약 1-2분)

배포 완료 후 제공되는 URL로 접속 테스트:
```
https://your-project.vercel.app
```

---

## 4단계: 환경변수 최종 업데이트

프론트엔드와 백엔드 배포 후, **CORS 설정 업데이트 필수!**

### 4.1 Railway (Backend) 환경변수 수정

```env
CORS_ORIGIN=https://your-project.vercel.app
```

### 4.2 Vercel (Frontend) 환경변수 수정

```env
AUTH_URL=https://your-project.vercel.app
```

**주의:** 환경변수 변경 후 **Redeploy** 필요!

---

## 5단계: 커스텀 도메인 연결 (선택사항)

### 5.1 도메인 구매

추천 사이트:
- [Namecheap](https://namecheap.com) - 저렴
- [Google Domains](https://domains.google) - 간편
- [가비아](https://gabia.com) - 한국 도메인(.kr)

### 5.2 Vercel 도메인 설정 (프론트엔드)

1. Vercel Dashboard > **Settings** > **Domains**
2. 커스텀 도메인 입력 (예: `pricecheck.kr`)
3. DNS 설정 안내에 따라 레코드 추가:
   - **A Record**: `76.76.19.19`
   - 또는 **CNAME**: `cname.vercel-dns.com`

### 5.3 Railway 도메인 설정 (백엔드 API)

1. Railway Dashboard > **Settings** > **Networking** > **Domains**
2. **Generate Domain** 또는 커스텀 도메인 추가
3. API 서브도메인 설정 (예: `api.pricecheck.kr`)

### 5.4 환경변수 최종 업데이트

**Railway:**
```env
CORS_ORIGIN=https://pricecheck.kr
```

**Vercel:**
```env
NEXT_PUBLIC_API_URL=https://api.pricecheck.kr/api
AUTH_URL=https://pricecheck.kr
```

---

## 6단계: 배포 검증 체크리스트

- [ ] 헬스체크: `https://[backend-url]/api/health`
- [ ] 회원가입 테스트
- [ ] 로그인 테스트
- [ ] 가격 추천 기능 테스트 (검색 탭)
- [ ] AI 인식 기능 테스트 (이미지 업로드)
- [ ] 북마크 추가/삭제 테스트
- [ ] PWA 설치 테스트 (모바일 크롬에서 "홈 화면에 추가")

---

## 문제 해결

### CORS 에러

```
Access to fetch at 'https://...' has been blocked by CORS policy
```

**해결:** Railway의 `CORS_ORIGIN` 환경변수가 프론트엔드 URL과 정확히 일치하는지 확인
- `https://` 포함 필수
- 마지막 `/` 없이 입력

### Database 연결 실패

```
Can't reach database server
```

**해결:**
1. Supabase DATABASE_URL이 정확한지 확인
2. 비밀번호에 특수문자가 있다면 URL 인코딩 필요
3. Supabase 프로젝트가 활성 상태인지 확인

### Google Vision API 에러

```
Could not load the default credentials
```

**해결:** `GOOGLE_CREDENTIALS_JSON` 환경변수가 올바른 JSON 형식인지 확인
- 줄바꿈 없이 한 줄로 입력
- 따옴표 이스케이프 확인

---

## 비용 정리

| 서비스 | 무료 한도 | 초과 시 |
|--------|----------|---------|
| Vercel | 100GB 대역폭/월, 무제한 배포 | $20/월~ |
| Railway | $5 크레딧/월 | 사용량 비례 |
| Supabase | 500MB DB, 2GB 대역폭 | $25/월~ |
| **합계** | **$0~5/월** | 트래픽에 따라 증가 |

---

## 다음 단계

배포 완료 후 고려사항:

1. **모니터링 설정**: Railway/Vercel 대시보드에서 로그 확인
2. **에러 추적**: Sentry 연동 (선택)
3. **성능 모니터링**: Vercel Analytics 활성화
4. **백업**: Supabase 자동 백업 확인

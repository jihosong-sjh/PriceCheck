# 데이터 모델: 중고 전자제품 가격 가이드

**날짜**: 2025-11-28
**브랜치**: `001-price-guide`

## 엔티티 관계도 (ERD)

```
┌─────────────────┐       ┌──────────────────────┐       ┌─────────────────┐
│      User       │       │  PriceRecommendation │       │   MarketData    │
├─────────────────┤       ├──────────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)              │    ┌──│ id (PK)         │
│ email           │  │    │ userId (FK)          │────┘  │ productName     │
│ password        │  └───>│ category             │       │ modelName       │
│ createdAt       │       │ productName          │       │ platform        │
│ updatedAt       │       │ modelName            │       │ price           │
└─────────────────┘       │ condition            │       │ condition       │
                          │ recommendedPrice     │       │ originalUrl     │
                          │ priceMin             │       │ scrapedAt       │
                          │ priceMax             │       │ metadata        │
                          │ marketDataSnapshot   │       └─────────────────┘
                          │ createdAt            │
                          └──────────────────────┘
                                    │
                                    │ 1:N
                                    ▼
                          ┌──────────────────────┐
                          │    ProductImage      │
                          ├──────────────────────┤
                          │ id (PK)              │
                          │ recommendationId(FK) │
                          │ imageUrl             │
                          │ uploadedAt           │
                          └──────────────────────┘
```

---

## 1. User (사용자)

서비스 회원 정보를 저장합니다.

| 필드 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | String (CUID) | PK | 고유 식별자 |
| email | String | UNIQUE, NOT NULL | 이메일 (로그인 ID) |
| password | String | NOT NULL | 해시된 비밀번호 (bcrypt) |
| createdAt | DateTime | DEFAULT NOW | 가입일시 |
| updatedAt | DateTime | AUTO UPDATE | 수정일시 |

**관계**:
- `recommendations`: PriceRecommendation[] (1:N)

**인덱스**:
- `email` (UNIQUE)

**검증 규칙**:
- email: 이메일 형식 검증
- password: 최소 8자, 영문+숫자 조합

---

## 2. PriceRecommendation (가격 추천)

사용자가 받은 가격 추천 결과를 저장합니다.

| 필드 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | String (CUID) | PK | 고유 식별자 |
| userId | String | FK (nullable) | 회원 ID (비회원은 NULL) |
| category | String | NOT NULL | 제품 카테고리 |
| productName | String | NOT NULL | 제품명 (예: iPhone 14 Pro) |
| modelName | String | NULL | 모델명 (예: 128GB) |
| condition | Enum | NOT NULL | 제품 상태 (GOOD/FAIR/POOR) |
| recommendedPrice | Int | NOT NULL | 추천 가격 (원) |
| priceMin | Int | NOT NULL | 최저 가격 (원) |
| priceMax | Int | NOT NULL | 최고 가격 (원) |
| marketDataSnapshot | JSON | NOT NULL | 분석에 사용된 시세 데이터 스냅샷 |
| createdAt | DateTime | DEFAULT NOW | 생성일시 |

**관계**:
- `user`: User (N:1, optional)
- `images`: ProductImage[] (1:N)

**인덱스**:
- `userId, createdAt DESC` (복합 인덱스)
- `productName`
- `category`

**검증 규칙**:
- category: SMARTPHONE, LAPTOP, TABLET, SMARTWATCH, EARPHONE 중 하나
- condition: GOOD(상), FAIR(중), POOR(하) 중 하나
- recommendedPrice, priceMin, priceMax: 양수

---

## 3. MarketData (시세 데이터)

중고거래 플랫폼에서 크롤링한 시세 데이터를 저장합니다.

| 필드 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | String (CUID) | PK | 고유 식별자 |
| productName | String | NOT NULL | 제품명 |
| modelName | String | NULL | 모델명 |
| platform | Enum | NOT NULL | 플랫폼 (BUNJANG/JOONGONARA) |
| price | Int | NOT NULL | 판매 가격 (원) |
| condition | String | NULL | 제품 상태 (원문) |
| originalUrl | String | NULL | 원본 게시글 URL |
| scrapedAt | DateTime | NOT NULL | 크롤링 일시 |
| metadata | JSON | NULL | 추가 정보 (판매자 정보 등) |

**인덱스**:
- `productName, platform, scrapedAt DESC` (복합 인덱스)
- `scrapedAt DESC`

**검증 규칙**:
- platform: BUNJANG, JOONGONARA 중 하나
- price: 양수
- originalUrl: URL 형식

---

## 4. ProductImage (제품 이미지)

사용자가 업로드한 제품 사진을 저장합니다.

| 필드 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | String (CUID) | PK | 고유 식별자 |
| recommendationId | String | FK | 추천 ID |
| imageUrl | String | NOT NULL | S3 이미지 URL |
| uploadedAt | DateTime | DEFAULT NOW | 업로드 일시 |

**관계**:
- `recommendation`: PriceRecommendation (N:1)

**인덱스**:
- `recommendationId`

**검증 규칙**:
- imageUrl: S3 URL 형식

---

## Enum 정의

### Category (제품 카테고리)
```typescript
enum Category {
  SMARTPHONE = "SMARTPHONE"    // 스마트폰
  LAPTOP = "LAPTOP"            // 노트북
  TABLET = "TABLET"            // 태블릿
  SMARTWATCH = "SMARTWATCH"    // 스마트워치
  EARPHONE = "EARPHONE"        // 이어폰/헤드폰
}
```

### Condition (제품 상태)
```typescript
enum Condition {
  GOOD = "GOOD"   // 상 (외관 깨끗, 기능 정상)
  FAIR = "FAIR"   // 중 (사용감 있음, 기능 정상)
  POOR = "POOR"   // 하 (외관 손상 있음, 일부 기능 이상)
}
```

### Platform (중고거래 플랫폼)
```typescript
enum Platform {
  BUNJANG = "BUNJANG"         // 번개장터
  JOONGONARA = "JOONGONARA"   // 중고나라
}
```

---

## Prisma 스키마

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Category {
  SMARTPHONE
  LAPTOP
  TABLET
  SMARTWATCH
  EARPHONE
}

enum Condition {
  GOOD
  FAIR
  POOR
}

enum Platform {
  BUNJANG
  JOONGONARA
}

model User {
  id              String   @id @default(cuid())
  email           String   @unique
  password        String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  recommendations PriceRecommendation[]

  @@map("users")
}

model PriceRecommendation {
  id                 String    @id @default(cuid())
  userId             String?   @map("user_id")
  category           Category
  productName        String    @map("product_name")
  modelName          String?   @map("model_name")
  condition          Condition
  recommendedPrice   Int       @map("recommended_price")
  priceMin           Int       @map("price_min")
  priceMax           Int       @map("price_max")
  marketDataSnapshot Json      @map("market_data_snapshot")
  createdAt          DateTime  @default(now()) @map("created_at")

  user               User?     @relation(fields: [userId], references: [id])
  images             ProductImage[]

  @@index([userId, createdAt(sort: Desc)])
  @@index([productName])
  @@index([category])
  @@map("price_recommendations")
}

model MarketData {
  id          String   @id @default(cuid())
  productName String   @map("product_name")
  modelName   String?  @map("model_name")
  platform    Platform
  price       Int
  condition   String?
  originalUrl String?  @map("original_url")
  scrapedAt   DateTime @map("scraped_at")
  metadata    Json?

  @@index([productName, platform, scrapedAt(sort: Desc)])
  @@index([scrapedAt(sort: Desc)])
  @@map("market_data")
}

model ProductImage {
  id               String   @id @default(cuid())
  recommendationId String   @map("recommendation_id")
  imageUrl         String   @map("image_url")
  uploadedAt       DateTime @default(now()) @map("uploaded_at")

  recommendation   PriceRecommendation @relation(fields: [recommendationId], references: [id], onDelete: Cascade)

  @@index([recommendationId])
  @@map("product_images")
}
```

---

## 상태 전이 다이어그램

### 가격 추천 프로세스

```
[사용자 입력] → [시세 데이터 크롤링] → [가격 계산] → [결과 저장]
     │                                                    │
     │                                                    ▼
     │                                            [PriceRecommendation 생성]
     │                                                    │
     │                                                    │ (회원인 경우)
     │                                                    ▼
     │                                            [userId 연결]
     │
     │ (이미지 업로드 시)
     ▼
[S3 업로드] → [ProductImage 생성]
```

### 시세 데이터 수집 프로세스

```
[스케줄러 트리거] → [번개장터 크롤링] → [MarketData 저장]
        │                   │
        │                   ▼
        │          [중고나라 크롤링] → [MarketData 저장]
        │
        └─────→ [오래된 데이터 정리] (30일 이상)
```

---

## 데이터 보존 정책

| 데이터 | 보존 기간 | 정리 방법 |
|--------|----------|----------|
| User | 영구 | 회원 탈퇴 시 삭제 |
| PriceRecommendation | 90일 | 스케줄러 배치 삭제 |
| MarketData | 30일 | 스케줄러 배치 삭제 |
| ProductImage | PriceRecommendation과 동일 | CASCADE 삭제 |

---

## 마이그레이션 전략

1. **초기 마이그레이션**: `prisma migrate dev --name init`
2. **프로덕션 마이그레이션**: `prisma migrate deploy`
3. **시드 데이터**: `prisma db seed` (개발 환경 전용)

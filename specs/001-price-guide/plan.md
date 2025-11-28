# Implementation Plan: 중고 전자제품 가격 가이드

**Branch**: `001-price-guide` | **Date**: 2025-11-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-price-guide/spec.md`

## Summary

중고 전자제품(스마트폰, 노트북, 태블릿 등)의 적정 판매가를 추천하는 웹 서비스입니다. 사용자가 제품명, 모델명, 상태를 입력하면 번개장터, 중고나라 등 주요 중고거래 플랫폼의 시세 데이터를 크롤링하여 분석하고, 추천 가격과 가격 범위를 제시합니다.

**기술 접근 방식**:
- Next.js + TypeScript 풀스택 아키텍처
- Playwright + Cheerio 하이브리드 크롤링
- PostgreSQL + Prisma ORM 데이터 관리
- NextAuth.js 인증 시스템

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20 LTS
**Primary Dependencies**: Next.js 14, Express, Playwright, Cheerio, Prisma, NextAuth.js
**Storage**: PostgreSQL 15+ (AWS RDS 서울 리전), AWS S3 (이미지 저장)
**Testing**: Jest + Supertest (단위/통합), Playwright Test (E2E)
**Target Platform**: 웹 브라우저 (반응형, 모바일 우선)
**Project Type**: Web Application (프론트엔드 + 백엔드 분리)
**Performance Goals**: 가격 추천 < 3초, 페이지 로드 < 2초, 동시 사용자 100명
**Constraints**: 한국어 전용, 한국 시장 대상, 10MB 이미지 제한
**Scale/Scope**: 초기 1,000명 사용자, 5개 전자제품 카테고리, 6개 주요 화면

## Constitution Check

*GATE: Constitution이 템플릿 상태이므로 기본 원칙 적용*

| 원칙 | 상태 | 비고 |
|------|------|------|
| 테스트 우선 | PASS | Jest + Supertest + Playwright Test 적용 |
| 단순성 | PASS | MVP 범위 내 최소 기능 구현 |
| 관심사 분리 | PASS | 프론트엔드/백엔드/데이터베이스 분리 |

## Project Structure

### Documentation (this feature)

```text
specs/001-price-guide/
├── plan.md              # 이 파일 (구현 계획)
├── research.md          # 기술 리서치 결과
├── data-model.md        # 데이터 모델 설계
├── quickstart.md        # 빠른 시작 가이드
├── contracts/           # API 계약 (OpenAPI)
│   └── api.yaml
└── tasks.md             # 구현 작업 목록 (/speckit.tasks 생성)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── auth.ts          # 인증 라우트
│   │   ├── price.ts         # 가격 추천 라우트
│   │   ├── history.ts       # 히스토리 라우트
│   │   └── upload.ts        # 이미지 업로드 라우트
│   ├── services/
│   │   ├── crawler/
│   │   │   ├── bunjang.ts   # 번개장터 크롤러
│   │   │   └── joongonara.ts # 중고나라 크롤러
│   │   ├── priceCalculator.ts # 가격 계산 로직
│   │   ├── imageUpload.ts   # S3 업로드
│   │   └── auth.ts          # 인증 서비스
│   ├── middleware/
│   │   ├── auth.ts          # JWT 검증
│   │   └── errorHandler.ts  # 에러 처리
│   ├── utils/
│   │   └── validators.ts    # 입력 검증
│   └── app.ts               # Express 앱
├── prisma/
│   ├── schema.prisma        # 데이터베이스 스키마
│   └── seed.ts              # 초기 데이터
└── tests/
    ├── unit/
    ├── integration/
    └── contract/

frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx   # 로그인 페이지
│   │   └── signup/page.tsx  # 회원가입 페이지
│   ├── price-guide/
│   │   └── page.tsx         # 가격 추천 페이지 (메인)
│   ├── history/
│   │   ├── page.tsx         # 히스토리 목록
│   │   └── [id]/page.tsx    # 히스토리 상세
│   ├── layout.tsx           # 공통 레이아웃
│   └── globals.css          # 전역 스타일
├── components/
│   ├── PriceForm.tsx        # 가격 추천 폼
│   ├── PriceResult.tsx      # 추천 결과 표시
│   ├── MarketComparison.tsx # 시세 비교 정보
│   ├── ImageUpload.tsx      # 이미지 업로드
│   ├── Header.tsx           # 헤더
│   └── Footer.tsx           # 푸터
├── lib/
│   ├── api.ts               # API 클라이언트
│   ├── auth.ts              # NextAuth 설정
│   └── types.ts             # 공통 타입
└── tests/
    └── e2e/

database/
├── schema.prisma            # Prisma 스키마 (심볼릭 링크)
└── migrations/              # 마이그레이션 파일
```

**Structure Decision**: 웹 애플리케이션 구조 선택. 프론트엔드(Next.js)와 백엔드(Express)를 분리하여 각각 독립적으로 배포 가능하도록 구성. 크롤링 서비스는 백엔드에서 실행하여 브라우저 자동화 문제를 방지.

## Complexity Tracking

> Constitution Check에 위반 사항 없음 - 이 섹션은 비워둠.

/**
 * Swagger/OpenAPI 설정
 * Phase 2: API 문서화
 */

import swaggerJsdoc from 'swagger-jsdoc';
import type { Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PriceCheck API',
      version: '1.0.0',
      description: `
중고 전자제품 시세 조회 및 가격 추천 서비스 API

## 개요
PriceCheck는 중고 전자제품의 적정 판매/구매 가격을 추천해주는 서비스입니다.
번개장터, 중고나라, 헬로마켓 등의 실시간 시세 데이터를 수집하여 분석합니다.

## 인증
일부 API는 JWT 토큰 인증이 필요합니다.
- 로그인 후 받은 accessToken을 Authorization 헤더에 Bearer 토큰으로 전송
- 토큰 만료 시 refreshToken으로 갱신 가능

## 에러 응답
모든 에러는 통일된 형식으로 응답됩니다:
\`\`\`json
{
  "success": false,
  "error": {
    "code": "E3000",
    "message": "에러 메시지",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "details": {}
  }
}
\`\`\`

## Rate Limiting
- 일반 API: 분당 100회
- 인증 API: 분당 5회 (로그인, 회원가입)
- 가격 조회: 분당 30회
      `,
      contact: {
        name: 'PriceCheck Team',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: '개발 서버',
      },
      {
        url: 'https://api.pricecheck.example.com',
        description: '운영 서버',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT 액세스 토큰',
        },
      },
      schemas: {
        // 공통 응답
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'E3000' },
                message: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
                details: { type: 'object' },
              },
            },
          },
        },
        // 페이지네이션
        Pagination: {
          type: 'object',
          properties: {
            currentPage: { type: 'integer', example: 1 },
            totalPages: { type: 'integer', example: 10 },
            totalCount: { type: 'integer', example: 100 },
            limit: { type: 'integer', example: 10 },
            hasNextPage: { type: 'boolean' },
            hasPrevPage: { type: 'boolean' },
          },
        },
        // 카테고리
        Category: {
          type: 'string',
          enum: [
            'SMARTPHONE',
            'LAPTOP',
            'TABLET',
            'SMARTWATCH',
            'EARPHONE',
            'SPEAKER',
            'MONITOR',
            'KEYBOARD_MOUSE',
            'TV',
          ],
          description: '제품 카테고리',
        },
        // 상태
        Condition: {
          type: 'string',
          enum: ['GOOD', 'FAIR', 'POOR'],
          description: '제품 상태 (상/중/하)',
        },
        // 사용자
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clxyz123...' },
            email: { type: 'string', format: 'email' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // 가격 추천 결과
        PriceRecommendation: {
          type: 'object',
          properties: {
            recommendedPrice: { type: 'integer', example: 350000 },
            priceMin: { type: 'integer', example: 300000 },
            priceMax: { type: 'integer', example: 400000 },
            averagePrice: { type: 'integer', example: 345000 },
            medianPrice: { type: 'integer', example: 350000 },
            confidence: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
            },
            sampleCount: { type: 'integer', example: 25 },
          },
        },
        // 시세 데이터
        MarketDataItem: {
          type: 'object',
          properties: {
            price: { type: 'integer' },
            platform: { type: 'string' },
            condition: { type: 'string' },
            originalUrl: { type: 'string' },
            scrapedAt: { type: 'string', format: 'date-time' },
          },
        },
        // 알림
        PriceAlert: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            category: { $ref: '#/components/schemas/Category' },
            categoryLabel: { type: 'string' },
            productName: { type: 'string' },
            modelName: { type: 'string', nullable: true },
            condition: { $ref: '#/components/schemas/Condition' },
            conditionLabel: { type: 'string' },
            targetPrice: { type: 'integer' },
            currentPrice: { type: 'integer', nullable: true },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // 북마크
        Bookmark: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: ['recommendation', 'standalone'] },
            category: { type: 'string', nullable: true },
            productName: { type: 'string', nullable: true },
            recommendedPrice: { type: 'integer', nullable: true },
            memo: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: '인증 필요',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                error: {
                  code: 'E2000',
                  message: '로그인이 필요합니다.',
                  timestamp: '2024-01-01T00:00:00.000Z',
                },
              },
            },
          },
        },
        ValidationError: {
          description: '입력값 검증 실패',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                error: {
                  code: 'E3000',
                  message: '입력값이 올바르지 않습니다.',
                  timestamp: '2024-01-01T00:00:00.000Z',
                  details: [
                    { field: 'email', message: '올바른 이메일 형식이 아닙니다.' },
                  ],
                },
              },
            },
          },
        },
        NotFoundError: {
          description: '리소스 없음',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        RateLimitError: {
          description: '요청 한도 초과',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                error: {
                  code: 'E7000',
                  message: '요청 한도를 초과했습니다.',
                  timestamp: '2024-01-01T00:00:00.000Z',
                },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: '인증 관련 API' },
      { name: 'Price', description: '가격 추천 API' },
      { name: 'History', description: '검색 히스토리 API' },
      { name: 'Bookmarks', description: '북마크(찜) API' },
      { name: 'Alerts', description: '가격 알림 API' },
      { name: 'Notifications', description: '알림 API' },
      { name: 'Upload', description: '이미지 업로드 API' },
      { name: 'Search', description: '검색 API' },
    ],
  },
  apis: ['./src/api/*.ts', './src/docs/*.yaml'],
};

export const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

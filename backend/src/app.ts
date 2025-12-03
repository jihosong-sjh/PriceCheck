/**
 * PriceCheck Backend Application
 * 중고 전자제품 시세 조회 및 가격 추천 서비스
 */

import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';

// 미들웨어
import { errorHandler, notFoundHandler, setupProcessErrorHandlers } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { simpleRequestLogger } from './middleware/requestLogger.js';

// 라우터
import priceRouter from './api/price.js';
import uploadRouter from './api/upload.js';
import authRouter from './api/auth.js';
import historyRouter from './api/history.js';
import bookmarkRouter from './api/bookmark.js';
import recognizeRouter from './api/recognize.js';
import alertRouter from './api/alert.js';
import notificationRouter from './api/notification.js';
import searchRouter from './api/search.js';
import shareRouter from './api/share.js';

// 유틸
import { startPriceAlertJob } from './jobs/priceAlertJob.js';
import { swaggerSpec } from './lib/swagger.js';
import logger from './lib/logger.js';

// 환경별 .env 파일 로드
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
const envPath = path.resolve(__dirname, '..', envFile);
logger.info(`Loading environment: ${process.env.NODE_ENV || 'development'}`);
logger.info(`Loading env file: ${envPath}`);
dotenv.config({ path: envPath });

// 프로세스 에러 핸들러 설정
setupProcessErrorHandlers();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// 보안 헤더 설정 (helmet)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS 설정
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// 요청 본문 파싱
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 요청 로깅 미들웨어 (헬스체크 제외)
app.use(simpleRequestLogger(['/api/health', '/api/docs']));

// Swagger UI (개발 환경에서만 또는 명시적으로 활성화된 경우)
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'PriceCheck API 문서',
    })
  );

  // OpenAPI JSON 스펙 엔드포인트
  app.get('/api/docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  logger.info('Swagger UI enabled at /api/docs');
}

// 전역 Rate Limiting (모든 API 요청에 적용)
app.use('/api', generalLimiter);

// 헬스체크 엔드포인트
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// API 라우트 등록
app.use('/api/price', priceRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/auth', authRouter);
app.use('/api/history', historyRouter);
app.use('/api/bookmarks', bookmarkRouter);
app.use('/api/recognize', recognizeRouter);
app.use('/api/alerts', alertRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/search', searchRouter);
app.use('/api/share', shareRouter);

// 404 처리
app.use(notFoundHandler);

// 전역 에러 핸들러
app.use(errorHandler);

// 서버 시작
app.listen(PORT, () => {
  logger.info(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
  logger.info(`API 문서: http://localhost:${PORT}/api/docs`);

  // 가격 알림 체커 작업 시작 (프로덕션 환경에서만)
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_ALERT_JOB === 'true') {
    startPriceAlertJob();
    logger.info('가격 알림 체커 작업이 시작되었습니다.');
  }
});

export default app;

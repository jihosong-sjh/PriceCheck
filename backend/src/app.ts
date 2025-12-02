import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import priceRouter from './api/price.js';
import uploadRouter from './api/upload.js';
import authRouter from './api/auth.js';
import historyRouter from './api/history.js';
import bookmarkRouter from './api/bookmark.js';
import recognizeRouter from './api/recognize.js';
import alertRouter from './api/alert.js';
import notificationRouter from './api/notification.js';
import searchRouter from './api/search.js';
import { startPriceAlertJob } from './jobs/priceAlertJob.js';

// 환경별 .env 파일 로드 (환경별 파일만 사용, .env는 로드하지 않음)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
const envPath = path.resolve(__dirname, '..', envFile);
console.log(`Loading environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Loading env file: ${envPath}`);
dotenv.config({ path: envPath });

const app: Express = express();
const PORT = process.env.PORT || 3001;

// 보안 헤더 설정 (helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS 설정
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(o => o.trim());
app.use(cors({
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
}));

// 요청 본문 파싱
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 전역 Rate Limiting (모든 API 요청에 적용)
app.use('/api', generalLimiter);

// 헬스체크 엔드포인트
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

// 404 처리
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: '요청한 리소스를 찾을 수 없습니다.' });
});

// 전역 에러 핸들러
app.use(errorHandler);

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);

  // 가격 알림 체커 작업 시작 (프로덕션 환경에서만)
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_ALERT_JOB === 'true') {
    startPriceAlertJob();
  }
});

export default app;

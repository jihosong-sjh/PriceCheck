/**
 * 요청/응답 로깅 미들웨어
 * Phase 2: HTTP 요청 추적 및 성능 모니터링
 */

import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logRequest, logResponse, logPerformance } from '../lib/logger.js';

// Express Request 타입 확장
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

/**
 * 요청 ID 할당 및 로깅 미들웨어
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // 요청 ID 할당 (기존 헤더가 있으면 사용)
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  req.requestId = requestId;
  req.startTime = Date.now();

  // 응답 헤더에 요청 ID 추가
  res.setHeader('X-Request-Id', requestId);

  // 요청 로깅
  logRequest({
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    userId: req.user?.userId,
  });

  // 응답 완료 시 로깅
  res.on('finish', () => {
    const duration = req.startTime ? Date.now() - req.startTime : 0;

    logResponse({
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.userId,
    });

    // 느린 요청 경고 (3초 이상)
    if (duration > 3000) {
      logPerformance(`Slow request: ${req.method} ${req.path}`, duration, {
        requestId,
        statusCode: res.statusCode,
      });
    }
  });

  next();
}

/**
 * 간단한 요청 로깅 (헬스체크 등 제외)
 */
export function simpleRequestLogger(excludePaths: string[] = ['/api/health']) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // 제외 경로는 로깅하지 않음
    if (excludePaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    requestLogger(req, res, next);
  };
}

export default requestLogger;

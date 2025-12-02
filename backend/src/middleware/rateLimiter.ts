/**
 * Rate Limiting 미들웨어
 * API 요청 속도 제한으로 브루트포스 공격 방어
 */

import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

/**
 * 일반 API 요청용 Rate Limiter
 * 100 requests per 15 minutes
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 15분당 최대 100개 요청
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
    },
  },
  standardHeaders: true, // RateLimit-* 헤더 반환
  legacyHeaders: false, // X-RateLimit-* 헤더 비활성화
});

/**
 * 로그인/회원가입 요청용 Rate Limiter (더 엄격)
 * 5 requests per 15 minutes (실패 시에만 카운트)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 15분당 최대 5회 시도
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_AUTH_ATTEMPTS',
      message: '로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // 성공한 요청은 카운트하지 않음
  keyGenerator: (req: Request) => {
    // IP + 이메일로 식별 (같은 이메일에 대한 공격 방어)
    const email = (req.body as { email?: string })?.email || '';
    return `${req.ip}-${email}`;
  },
});

/**
 * 비밀번호 변경 요청용 Rate Limiter
 * 3 requests per hour
 */
export const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 3, // 1시간당 최대 3회
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_PASSWORD_ATTEMPTS',
      message: '비밀번호 변경 시도가 너무 많습니다. 1시간 후 다시 시도해주세요.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * API 검색/크롤링 요청용 Rate Limiter
 * 30 requests per minute
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 30, // 1분당 최대 30회
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_SEARCH_REQUESTS',
      message: '검색 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 토큰 갱신 요청용 Rate Limiter
 * 10 requests per minute
 */
export const refreshTokenLimiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 10, // 1분당 최대 10회
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REFRESH_ATTEMPTS',
      message: '토큰 갱신 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 특정 IP 차단 (심각한 악용 시)
 */
export const createBlockedIpHandler = (blockedIps: Set<string>) => {
  return (req: Request, res: Response, next: () => void) => {
    if (blockedIps.has(req.ip || '')) {
      res.status(403).json({
        success: false,
        error: {
          code: 'IP_BLOCKED',
          message: '접근이 차단되었습니다.',
        },
      });
      return;
    }
    next();
  };
};

export default {
  generalLimiter,
  authLimiter,
  passwordChangeLimiter,
  searchLimiter,
  refreshTokenLimiter,
};

import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// 커스텀 에러 클래스
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// 에러 응답 인터페이스
interface ErrorResponse {
  error: string;
  message: string;
  details?: unknown;
  stack?: string;
}

// Zod 유효성 검증 에러 포맷팅
function formatZodError(error: ZodError): string {
  return error.errors
    .map((err) => `${err.path.join('.')}: ${err.message}`)
    .join(', ');
}

// 전역 에러 핸들러 미들웨어
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // 기본 에러 응답
  const response: ErrorResponse = {
    error: '서버 오류가 발생했습니다.',
    message: isDevelopment ? err.message : '잠시 후 다시 시도해주세요.',
  };

  // Zod 유효성 검증 에러 처리
  if (err instanceof ZodError) {
    response.error = '입력값이 올바르지 않습니다.';
    response.message = formatZodError(err);
    response.details = err.errors;
    res.status(400).json(response);
    return;
  }

  // 커스텀 AppError 처리
  if (err instanceof AppError) {
    response.error = err.message;
    response.message = err.message;
    res.status(err.statusCode).json(response);
    return;
  }

  // SyntaxError (JSON 파싱 에러 등)
  if (err instanceof SyntaxError && 'body' in err) {
    response.error = '잘못된 요청 형식입니다.';
    response.message = '올바른 JSON 형식으로 요청해주세요.';
    res.status(400).json(response);
    return;
  }

  // 개발 환경에서 스택 트레이스 포함
  if (isDevelopment) {
    response.stack = err.stack;
  }

  // 프로덕션 환경에서 예상치 못한 에러 로깅
  if (!isDevelopment) {
    console.error('Unexpected error:', err);
  }

  res.status(500).json(response);
}

// 비동기 핸들러 래퍼 (try-catch 자동화)
export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

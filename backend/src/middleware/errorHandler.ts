/**
 * 전역 에러 핸들러 미들웨어
 * Phase 2: 통일된 에러 처리 및 로깅
 */

import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import {
  AppError,
  ErrorCodes,
  ErrorMessages,
  type ErrorResponse,
  isOperationalError,
} from '../utils/errors.js';
import logger, { logError } from '../lib/logger.js';

// ========== Zod 에러 포맷팅 ==========

interface ZodErrorDetail {
  field: string;
  message: string;
  code: string;
}

function formatZodError(error: ZodError): ZodErrorDetail[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
}

// ========== Prisma 에러 처리 ==========

function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): AppError {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      return new AppError(ErrorCodes.DUPLICATE_RESOURCE, {
        message: '이미 존재하는 항목입니다.',
        details: { field: error.meta?.target },
      });

    case 'P2025':
      // Record not found
      return new AppError(ErrorCodes.RESOURCE_NOT_FOUND, {
        message: '요청한 리소스를 찾을 수 없습니다.',
      });

    case 'P2003':
      // Foreign key constraint violation
      return new AppError(ErrorCodes.VALIDATION_ERROR, {
        message: '관련 데이터가 존재하지 않습니다.',
        details: { field: error.meta?.field_name },
      });

    case 'P2014':
      // Required relation violation
      return new AppError(ErrorCodes.VALIDATION_ERROR, {
        message: '필수 관계가 누락되었습니다.',
      });

    default:
      return new AppError(ErrorCodes.DATABASE_ERROR, {
        message: '데이터베이스 오류가 발생했습니다.',
        cause: error,
        isOperational: false,
      });
  }
}

// ========== 전역 에러 핸들러 ==========

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const requestId = req.headers['x-request-id'] as string | undefined;

  // 로깅 컨텍스트
  const logContext = {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.user?.userId,
  };

  // 1. Zod 유효성 검증 에러
  if (err instanceof ZodError) {
    const appError = new AppError(ErrorCodes.VALIDATION_ERROR, {
      details: formatZodError(err),
    });

    logError(appError, { ...logContext, errorCode: appError.code });

    const response = appError.toResponse(isDevelopment);
    res.status(appError.statusCode).json(response);
    return;
  }

  // 2. Prisma 에러
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const appError = handlePrismaError(err);

    logError(appError, { ...logContext, errorCode: appError.code, prismaCode: err.code });

    const response = appError.toResponse(isDevelopment);
    res.status(appError.statusCode).json(response);
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    const appError = new AppError(ErrorCodes.VALIDATION_ERROR, {
      message: '데이터 유효성 검증에 실패했습니다.',
      cause: err,
    });

    logError(appError, { ...logContext, errorCode: appError.code });

    const response = appError.toResponse(isDevelopment);
    res.status(appError.statusCode).json(response);
    return;
  }

  // 3. AppError (커스텀 에러)
  if (err instanceof AppError) {
    logError(err, { ...logContext, errorCode: err.code });

    const response = err.toResponse(isDevelopment);
    res.status(err.statusCode).json(response);
    return;
  }

  // 4. SyntaxError (JSON 파싱 에러 등)
  if (err instanceof SyntaxError && 'body' in err) {
    const appError = new AppError(ErrorCodes.INVALID_FORMAT, {
      message: '잘못된 요청 형식입니다. 올바른 JSON 형식으로 요청해주세요.',
    });

    logError(appError, logContext);

    const response = appError.toResponse(isDevelopment);
    res.status(appError.statusCode).json(response);
    return;
  }

  // 5. TypeError (일반적인 프로그래밍 에러)
  if (err instanceof TypeError) {
    const appError = new AppError(ErrorCodes.INTERNAL_ERROR, {
      message: isDevelopment ? err.message : ErrorMessages[ErrorCodes.INTERNAL_ERROR],
      cause: err,
      isOperational: false,
    });

    logError(err, { ...logContext, errorCode: appError.code, errorType: 'TypeError' });

    const response = appError.toResponse(isDevelopment);
    res.status(appError.statusCode).json(response);
    return;
  }

  // 6. 알 수 없는 에러
  const unknownError = new AppError(ErrorCodes.UNKNOWN_ERROR, {
    message: isDevelopment ? err.message : ErrorMessages[ErrorCodes.UNKNOWN_ERROR],
    cause: err,
    isOperational: false,
  });

  // 예상치 못한 에러는 항상 로깅
  logError(err, {
    ...logContext,
    errorCode: unknownError.code,
    errorType: err.constructor.name,
    originalMessage: err.message,
  });

  // 프로덕션에서 예상치 못한 에러는 상세 정보 숨김
  const response = unknownError.toResponse(isDevelopment);
  res.status(unknownError.statusCode).json(response);
}

// ========== 비동기 핸들러 래퍼 ==========

type AsyncRequestHandler<T = void> = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<T>;

export function asyncHandler<T>(fn: AsyncRequestHandler<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ========== 404 핸들러 ==========

export function notFoundHandler(req: Request, res: Response): void {
  const response: ErrorResponse = {
    success: false,
    error: {
      code: ErrorCodes.NOT_FOUND,
      message: `요청한 리소스를 찾을 수 없습니다: ${req.method} ${req.path}`,
      timestamp: new Date().toISOString(),
    },
  };

  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  res.status(404).json(response);
}

// ========== 프로세스 에러 핸들링 ==========

export function setupProcessErrorHandlers(): void {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack,
    });

    // 운영 에러가 아니면 프로세스 종료
    if (!isOperationalError(error)) {
      logger.error('Non-operational error, shutting down...');
      process.exit(1);
    }
  });

  process.on('unhandledRejection', (reason: unknown, _promise: Promise<unknown>) => {
    logger.error('Unhandled Rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully...');
    process.exit(0);
  });
}

// 레거시 export (기존 코드 호환성)
export { AppError } from '../utils/errors.js';

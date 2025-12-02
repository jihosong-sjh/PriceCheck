/**
 * 로깅 시스템 - Winston 기반
 * Phase 2: 구조화된 로깅
 */

import winston from 'winston';
import path from 'path';

// 환경 설정
const isDevelopment = process.env.NODE_ENV !== 'production';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

// 로그 디렉토리 설정 (프로젝트 루트 기준)
const logDir = process.env.LOG_DIR || path.resolve(process.cwd(), 'logs');

// 커스텀 포맷: 타임스탬프 + 레벨 + 메시지 + 메타데이터
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    // 메타데이터가 있으면 JSON으로 추가
    const metaKeys = Object.keys(meta);
    if (metaKeys.length > 0) {
      // stack은 별도 라인으로 출력
      if (meta.stack) {
        log += `\n${meta.stack}`;
        delete meta.stack;
      }
      const remainingMeta = Object.keys(meta);
      if (remainingMeta.length > 0) {
        log += ` ${JSON.stringify(meta)}`;
      }
    }

    return log;
  })
);

// JSON 포맷 (프로덕션 파일 로그용)
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// 콘솔 출력 포맷 (컬러링)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  customFormat
);

// Transport 설정
const transports: winston.transport[] = [
  // 콘솔 출력 (개발/프로덕션 공통)
  new winston.transports.Console({
    format: consoleFormat,
    level: logLevel,
  }),
];

// 프로덕션 환경에서만 파일 로깅
if (!isDevelopment) {
  transports.push(
    // 에러 로그 파일
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    // 전체 로그 파일
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    })
  );
}

// 로거 인스턴스 생성
const logger = winston.createLogger({
  level: logLevel,
  defaultMeta: { service: 'pricecheck-api' },
  transports,
  // 예외 및 거부 처리
  exceptionHandlers: isDevelopment
    ? []
    : [
        new winston.transports.File({
          filename: path.join(logDir, 'exceptions.log'),
          format: jsonFormat,
        }),
      ],
  rejectionHandlers: isDevelopment
    ? []
    : [
        new winston.transports.File({
          filename: path.join(logDir, 'rejections.log'),
          format: jsonFormat,
        }),
      ],
});

// ========== 로깅 유틸리티 함수 ==========

export interface LogContext {
  requestId?: string;
  userId?: string;
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
  duration?: number;
  statusCode?: number;
  [key: string]: unknown;
}

/**
 * 요청 로깅
 */
export function logRequest(context: LogContext): void {
  logger.info('Request received', context);
}

/**
 * 응답 로깅
 */
export function logResponse(context: LogContext): void {
  const level = context.statusCode && context.statusCode >= 400 ? 'warn' : 'info';
  logger.log(level, 'Response sent', context);
}

/**
 * 에러 로깅
 */
export function logError(
  error: Error,
  context?: LogContext & { errorCode?: string }
): void {
  logger.error(error.message, {
    ...context,
    errorName: error.name,
    stack: error.stack,
  });
}

/**
 * 비즈니스 로직 로깅
 */
export function logBusiness(
  action: string,
  data?: Record<string, unknown>
): void {
  logger.info(`[Business] ${action}`, data);
}

/**
 * 외부 서비스 호출 로깅
 */
export function logExternal(
  service: string,
  action: string,
  data?: Record<string, unknown>
): void {
  logger.info(`[External:${service}] ${action}`, data);
}

/**
 * 보안 관련 로깅
 */
export function logSecurity(
  event: string,
  context?: LogContext
): void {
  logger.warn(`[Security] ${event}`, context);
}

/**
 * 성능 로깅
 */
export function logPerformance(
  operation: string,
  durationMs: number,
  context?: Record<string, unknown>
): void {
  const level = durationMs > 5000 ? 'warn' : 'debug';
  logger.log(level, `[Performance] ${operation}`, {
    ...context,
    durationMs,
  });
}

/**
 * 디버그 로깅
 */
export function logDebug(message: string, data?: Record<string, unknown>): void {
  logger.debug(message, data);
}

// 기본 export
export default logger;

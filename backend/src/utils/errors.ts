/**
 * 에러 코드 및 커스텀 에러 클래스 정의
 * Phase 2: 통일된 에러 처리 시스템
 */

// ========== 에러 코드 상수 ==========

export const ErrorCodes = {
  // 일반 에러 (1xxx)
  INTERNAL_ERROR: 'E1000',
  UNKNOWN_ERROR: 'E1001',
  SERVICE_UNAVAILABLE: 'E1002',

  // 인증/인가 에러 (2xxx)
  UNAUTHORIZED: 'E2000',
  INVALID_TOKEN: 'E2001',
  TOKEN_EXPIRED: 'E2002',
  FORBIDDEN: 'E2003',
  INVALID_CREDENTIALS: 'E2004',
  USER_NOT_FOUND: 'E2005',
  SESSION_EXPIRED: 'E2006',

  // 입력값 검증 에러 (3xxx)
  VALIDATION_ERROR: 'E3000',
  INVALID_INPUT: 'E3001',
  MISSING_REQUIRED_FIELD: 'E3002',
  INVALID_FORMAT: 'E3003',
  VALUE_OUT_OF_RANGE: 'E3004',

  // 리소스 에러 (4xxx)
  NOT_FOUND: 'E4000',
  RESOURCE_NOT_FOUND: 'E4001',
  USER_ALREADY_EXISTS: 'E4002',
  DUPLICATE_RESOURCE: 'E4003',
  RESOURCE_DELETED: 'E4004',

  // 비즈니스 로직 에러 (5xxx)
  NO_MARKET_DATA: 'E5000',
  PRICE_CALCULATION_FAILED: 'E5001',
  CATEGORY_DETECTION_FAILED: 'E5002',
  CRAWLING_FAILED: 'E5003',
  IMAGE_PROCESSING_FAILED: 'E5004',
  QUOTA_EXCEEDED: 'E5005',

  // 외부 서비스 에러 (6xxx)
  EXTERNAL_API_ERROR: 'E6000',
  NAVER_API_ERROR: 'E6001',
  VISION_API_ERROR: 'E6002',
  S3_ERROR: 'E6003',
  DATABASE_ERROR: 'E6004',

  // Rate Limiting (7xxx)
  RATE_LIMIT_EXCEEDED: 'E7000',
  TOO_MANY_REQUESTS: 'E7001',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// ========== 에러 메시지 매핑 ==========

export const ErrorMessages: Record<ErrorCode, string> = {
  // 일반 에러
  [ErrorCodes.INTERNAL_ERROR]: '서버 내부 오류가 발생했습니다.',
  [ErrorCodes.UNKNOWN_ERROR]: '알 수 없는 오류가 발생했습니다.',
  [ErrorCodes.SERVICE_UNAVAILABLE]: '서비스를 일시적으로 사용할 수 없습니다.',

  // 인증/인가 에러
  [ErrorCodes.UNAUTHORIZED]: '로그인이 필요합니다.',
  [ErrorCodes.INVALID_TOKEN]: '유효하지 않은 토큰입니다.',
  [ErrorCodes.TOKEN_EXPIRED]: '토큰이 만료되었습니다.',
  [ErrorCodes.FORBIDDEN]: '접근 권한이 없습니다.',
  [ErrorCodes.INVALID_CREDENTIALS]: '이메일 또는 비밀번호가 올바르지 않습니다.',
  [ErrorCodes.USER_NOT_FOUND]: '사용자를 찾을 수 없습니다.',
  [ErrorCodes.SESSION_EXPIRED]: '세션이 만료되었습니다. 다시 로그인해주세요.',

  // 입력값 검증 에러
  [ErrorCodes.VALIDATION_ERROR]: '입력값이 올바르지 않습니다.',
  [ErrorCodes.INVALID_INPUT]: '잘못된 입력입니다.',
  [ErrorCodes.MISSING_REQUIRED_FIELD]: '필수 항목이 누락되었습니다.',
  [ErrorCodes.INVALID_FORMAT]: '형식이 올바르지 않습니다.',
  [ErrorCodes.VALUE_OUT_OF_RANGE]: '값이 허용 범위를 벗어났습니다.',

  // 리소스 에러
  [ErrorCodes.NOT_FOUND]: '요청한 리소스를 찾을 수 없습니다.',
  [ErrorCodes.RESOURCE_NOT_FOUND]: '리소스를 찾을 수 없습니다.',
  [ErrorCodes.USER_ALREADY_EXISTS]: '이미 등록된 이메일입니다.',
  [ErrorCodes.DUPLICATE_RESOURCE]: '이미 존재하는 항목입니다.',
  [ErrorCodes.RESOURCE_DELETED]: '삭제된 리소스입니다.',

  // 비즈니스 로직 에러
  [ErrorCodes.NO_MARKET_DATA]: '해당 제품의 시세 데이터를 찾을 수 없습니다.',
  [ErrorCodes.PRICE_CALCULATION_FAILED]:
    '유효한 시세 데이터가 부족하여 가격을 계산할 수 없습니다.',
  [ErrorCodes.CATEGORY_DETECTION_FAILED]: '제품 카테고리를 추정할 수 없습니다.',
  [ErrorCodes.CRAWLING_FAILED]: '시세 정보 수집에 실패했습니다.',
  [ErrorCodes.IMAGE_PROCESSING_FAILED]: '이미지 처리에 실패했습니다.',
  [ErrorCodes.QUOTA_EXCEEDED]: '사용 한도를 초과했습니다.',

  // 외부 서비스 에러
  [ErrorCodes.EXTERNAL_API_ERROR]: '외부 서비스 연동 중 오류가 발생했습니다.',
  [ErrorCodes.NAVER_API_ERROR]: '네이버 API 연동 중 오류가 발생했습니다.',
  [ErrorCodes.VISION_API_ERROR]: '이미지 인식 서비스 오류가 발생했습니다.',
  [ErrorCodes.S3_ERROR]: '파일 저장소 오류가 발생했습니다.',
  [ErrorCodes.DATABASE_ERROR]: '데이터베이스 오류가 발생했습니다.',

  // Rate Limiting
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: '요청 한도를 초과했습니다.',
  [ErrorCodes.TOO_MANY_REQUESTS]:
    '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.',
};

// ========== HTTP 상태 코드 매핑 ==========

export const ErrorHttpStatus: Record<ErrorCode, number> = {
  // 일반 에러
  [ErrorCodes.INTERNAL_ERROR]: 500,
  [ErrorCodes.UNKNOWN_ERROR]: 500,
  [ErrorCodes.SERVICE_UNAVAILABLE]: 503,

  // 인증/인가 에러
  [ErrorCodes.UNAUTHORIZED]: 401,
  [ErrorCodes.INVALID_TOKEN]: 401,
  [ErrorCodes.TOKEN_EXPIRED]: 401,
  [ErrorCodes.FORBIDDEN]: 403,
  [ErrorCodes.INVALID_CREDENTIALS]: 401,
  [ErrorCodes.USER_NOT_FOUND]: 404,
  [ErrorCodes.SESSION_EXPIRED]: 401,

  // 입력값 검증 에러
  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.INVALID_INPUT]: 400,
  [ErrorCodes.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCodes.INVALID_FORMAT]: 400,
  [ErrorCodes.VALUE_OUT_OF_RANGE]: 400,

  // 리소스 에러
  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.RESOURCE_NOT_FOUND]: 404,
  [ErrorCodes.USER_ALREADY_EXISTS]: 409,
  [ErrorCodes.DUPLICATE_RESOURCE]: 409,
  [ErrorCodes.RESOURCE_DELETED]: 410,

  // 비즈니스 로직 에러
  [ErrorCodes.NO_MARKET_DATA]: 404,
  [ErrorCodes.PRICE_CALCULATION_FAILED]: 422,
  [ErrorCodes.CATEGORY_DETECTION_FAILED]: 422,
  [ErrorCodes.CRAWLING_FAILED]: 502,
  [ErrorCodes.IMAGE_PROCESSING_FAILED]: 422,
  [ErrorCodes.QUOTA_EXCEEDED]: 429,

  // 외부 서비스 에러
  [ErrorCodes.EXTERNAL_API_ERROR]: 502,
  [ErrorCodes.NAVER_API_ERROR]: 502,
  [ErrorCodes.VISION_API_ERROR]: 502,
  [ErrorCodes.S3_ERROR]: 502,
  [ErrorCodes.DATABASE_ERROR]: 500,

  // Rate Limiting
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCodes.TOO_MANY_REQUESTS]: 429,
};

// ========== 유틸리티 함수 ==========

/**
 * HTTP 상태 코드로 에러 코드 추론 (레거시 호환용)
 */
function statusCodeToErrorCode(statusCode: number): ErrorCode {
  switch (statusCode) {
    case 400:
      return ErrorCodes.VALIDATION_ERROR;
    case 401:
      return ErrorCodes.UNAUTHORIZED;
    case 403:
      return ErrorCodes.FORBIDDEN;
    case 404:
      return ErrorCodes.NOT_FOUND;
    case 409:
      return ErrorCodes.DUPLICATE_RESOURCE;
    case 422:
      return ErrorCodes.VALIDATION_ERROR;
    case 429:
      return ErrorCodes.RATE_LIMIT_EXCEEDED;
    case 500:
      return ErrorCodes.INTERNAL_ERROR;
    case 502:
      return ErrorCodes.EXTERNAL_API_ERROR;
    case 503:
      return ErrorCodes.SERVICE_UNAVAILABLE;
    default:
      return ErrorCodes.UNKNOWN_ERROR;
  }
}

// ========== 커스텀 에러 클래스 ==========

export interface AppErrorOptions {
  code?: ErrorCode;
  message?: string;
  details?: unknown;
  cause?: Error;
  isOperational?: boolean;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;
  public readonly timestamp: string;

  /**
   * AppError 생성자
   * @param codeOrMessage - 에러 코드(ErrorCodes) 또는 에러 메시지
   * @param optionsOrStatusCode - AppErrorOptions 객체 또는 HTTP 상태 코드(레거시 호환)
   * @param isOperational - 운영 에러 여부 (레거시 호환)
   */
  constructor(
    codeOrMessage: ErrorCode | string,
    optionsOrStatusCode?: AppErrorOptions | number,
    isOperational?: boolean
  ) {
    // 레거시 시그니처 지원: new AppError(message, statusCode, isOperational)
    if (typeof optionsOrStatusCode === 'number') {
      const statusCode = optionsOrStatusCode;
      const message = codeOrMessage as string;

      // HTTP 상태 코드로 에러 코드 추론
      const code = statusCodeToErrorCode(statusCode);

      super(message);

      this.name = 'AppError';
      this.code = code;
      this.statusCode = statusCode;
      this.isOperational = isOperational ?? true;
      this.timestamp = new Date().toISOString();

      Object.setPrototypeOf(this, AppError.prototype);
      Error.captureStackTrace(this, this.constructor);
      return;
    }

    // 새로운 시그니처: new AppError(ErrorCode, options) 또는 new AppError(message, options)
    const options: AppErrorOptions = optionsOrStatusCode || {};

    // 에러 코드인지 메시지인지 판단
    const isErrorCode = Object.values(ErrorCodes).includes(
      codeOrMessage as ErrorCode
    );

    const code = isErrorCode
      ? (codeOrMessage as ErrorCode)
      : options.code || ErrorCodes.INTERNAL_ERROR;

    const message = isErrorCode
      ? options.message || ErrorMessages[code]
      : codeOrMessage;

    super(message);

    this.name = 'AppError';
    this.code = code;
    this.statusCode = ErrorHttpStatus[code];
    this.isOperational = options.isOperational ?? true;
    this.details = options.details;
    this.timestamp = new Date().toISOString();

    if (options.cause) {
      this.cause = options.cause;
    }

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  // 에러 응답 객체 생성
  toResponse(includeStack = false): ErrorResponse {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        timestamp: this.timestamp,
      },
    };

    if (this.details) {
      response.error.details = this.details;
    }

    if (includeStack && this.stack) {
      response.error.stack = this.stack;
    }

    return response;
  }

  // 정적 팩토리 메서드
  static badRequest(message?: string, details?: unknown): AppError {
    return new AppError(ErrorCodes.VALIDATION_ERROR, { message, details });
  }

  static unauthorized(message?: string): AppError {
    return new AppError(ErrorCodes.UNAUTHORIZED, { message });
  }

  static forbidden(message?: string): AppError {
    return new AppError(ErrorCodes.FORBIDDEN, { message });
  }

  static notFound(message?: string): AppError {
    return new AppError(ErrorCodes.NOT_FOUND, { message });
  }

  static conflict(message?: string): AppError {
    return new AppError(ErrorCodes.DUPLICATE_RESOURCE, { message });
  }

  static internal(message?: string, cause?: Error): AppError {
    return new AppError(ErrorCodes.INTERNAL_ERROR, {
      message,
      cause,
      isOperational: false,
    });
  }
}

// ========== 에러 응답 타입 ==========

export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    timestamp: string;
    details?: unknown;
    stack?: string;
  };
}

// ========== 에러 유틸리티 함수 ==========

/**
 * 에러가 운영 에러(예측 가능한 에러)인지 확인
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * 에러 코드로 메시지 조회
 */
export function getErrorMessage(code: ErrorCode): string {
  return ErrorMessages[code] || ErrorMessages[ErrorCodes.UNKNOWN_ERROR];
}

/**
 * 에러 코드로 HTTP 상태 코드 조회
 */
export function getHttpStatus(code: ErrorCode): number {
  return ErrorHttpStatus[code] || 500;
}

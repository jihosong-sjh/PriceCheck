import { z } from 'zod';

// ========== Enum 정의 ==========

// 제품 카테고리 (Prisma 스키마와 일치)
export const CategoryEnum = z.enum([
  'SMARTPHONE',
  'LAPTOP',
  'TABLET',
  'SMARTWATCH',
  'EARPHONE',
]);
export type Category = z.infer<typeof CategoryEnum>;

// 카테고리 한국어 레이블
export const CATEGORY_LABELS: Record<Category, string> = {
  SMARTPHONE: '스마트폰',
  LAPTOP: '노트북',
  TABLET: '태블릿',
  SMARTWATCH: '스마트워치',
  EARPHONE: '이어폰/헤드폰',
};

// 제품 상태 (Prisma 스키마와 일치)
export const ConditionEnum = z.enum(['GOOD', 'FAIR', 'POOR']);
export type Condition = z.infer<typeof ConditionEnum>;

// 상태 한국어 레이블
export const CONDITION_LABELS: Record<Condition, string> = {
  GOOD: '상',
  FAIR: '중',
  POOR: '하',
};

// 플랫폼 (Prisma 스키마와 일치)
export const PlatformEnum = z.enum(['BUNJANG', 'JOONGONARA']);
export type Platform = z.infer<typeof PlatformEnum>;

// 플랫폼 한국어 레이블
export const PLATFORM_LABELS: Record<Platform, string> = {
  BUNJANG: '번개장터',
  JOONGONARA: '중고나라',
};

// ========== 사용자 관련 스키마 ==========

// 이메일 검증
export const emailSchema = z
  .string()
  .email('올바른 이메일 형식이 아닙니다.')
  .max(255, '이메일은 255자를 초과할 수 없습니다.');

// 비밀번호 검증 (최소 8자, 영문+숫자 조합)
export const passwordSchema = z
  .string()
  .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
  .max(128, '비밀번호는 128자를 초과할 수 없습니다.')
  .regex(
    /^(?=.*[A-Za-z])(?=.*\d)/,
    '비밀번호는 영문과 숫자를 포함해야 합니다.'
  );

// 회원가입 요청 스키마
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export type SignupInput = z.infer<typeof signupSchema>;

// 로그인 요청 스키마
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ========== 가격 추천 관련 스키마 ==========

// 제품명 검증
export const productNameSchema = z
  .string()
  .min(1, '제품명을 입력해주세요.')
  .max(200, '제품명은 200자를 초과할 수 없습니다.')
  .trim();

// 모델명 검증 (선택)
export const modelNameSchema = z
  .string()
  .max(100, '모델명은 100자를 초과할 수 없습니다.')
  .trim()
  .optional()
  .transform((val) => (val === '' ? undefined : val));

// 가격 추천 요청 스키마
export const priceRecommendRequestSchema = z.object({
  category: CategoryEnum,
  productName: productNameSchema,
  modelName: modelNameSchema,
  condition: ConditionEnum,
});
export type PriceRecommendRequest = z.infer<typeof priceRecommendRequestSchema>;

// 가격 검증 (양수)
export const priceSchema = z
  .number()
  .int('가격은 정수여야 합니다.')
  .positive('가격은 양수여야 합니다.')
  .max(999999999, '가격이 너무 큽니다.');

// ========== 페이지네이션 스키마 ==========

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => Math.max(1, parseInt(val, 10) || 1)),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => Math.min(100, Math.max(1, parseInt(val, 10) || 10))),
});
export type PaginationInput = z.infer<typeof paginationSchema>;

// ========== 이미지 업로드 검증 ==========

// 허용되는 이미지 MIME 타입
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// 최대 이미지 크기 (10MB)
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

// 이미지 메타데이터 검증
export const imageUploadSchema = z.object({
  mimetype: z.string().refine(
    (type) => ALLOWED_IMAGE_TYPES.includes(type),
    'JPG, PNG, WebP 형식만 업로드 가능합니다.'
  ),
  size: z
    .number()
    .max(MAX_IMAGE_SIZE, '이미지 크기는 10MB를 초과할 수 없습니다.'),
});

// ========== ID 검증 ==========

// CUID 형식 검증
export const cuidSchema = z
  .string()
  .min(1, 'ID가 필요합니다.')
  .regex(/^c[a-z0-9]{24}$/, '올바르지 않은 ID 형식입니다.');

// 히스토리 상세 조회 파라미터
export const historyParamsSchema = z.object({
  id: cuidSchema,
});
export type HistoryParams = z.infer<typeof historyParamsSchema>;

// ========== 유틸리티 함수 ==========

// 요청 body 검증 헬퍼
export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

// 요청 query 검증 헬퍼
export function validateQuery<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

// 요청 params 검증 헬퍼
export function validateParams<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

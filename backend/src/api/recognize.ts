/**
 * 이미지 인식 API 라우트
 * POST /api/recognize - 이미지에서 제품 정보 인식
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { optionalAuth } from '../middleware/auth.js';
import visionService, { type RecognitionResult } from '../services/visionService.js';

const router = Router();

// 이미지 인식 요청 스키마
const recognizeRequestSchema = z.object({
  imageUrl: z.string().url('유효한 이미지 URL을 입력해주세요.'),
});

// 응답 타입
interface RecognizeResponse {
  success: boolean;
  data: RecognitionResult;
}

/**
 * POST /api/recognize
 * 이미지 URL에서 제품 정보를 인식합니다.
 */
router.post(
  '/',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response<RecognizeResponse>) => {
    // 요청 검증
    const { imageUrl } = recognizeRequestSchema.parse(req.body);

    console.log(`[인식 API] 요청 - URL: ${imageUrl.substring(0, 50)}...`);

    // Vision API 호출
    const result = await visionService.recognizeProduct(imageUrl);

    // 인식 실패 확인
    if (!result.category && !result.brand && !result.productName) {
      throw new AppError(
        '제품을 인식할 수 없습니다. 제품이 잘 보이는 다른 이미지를 사용해주세요.',
        400
      );
    }

    console.log(`[인식 API] 완료 - 제품: ${result.productName}, 신뢰도: ${result.confidence}%`);

    res.json({
      success: true,
      data: result,
    });
  })
);

export default router;

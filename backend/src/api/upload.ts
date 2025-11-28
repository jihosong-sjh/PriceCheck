/**
 * 이미지 업로드 API 라우트
 * - POST /api/upload - 이미지 업로드
 * - DELETE /api/upload/:key - 이미지 삭제
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { upload, processAndUploadImage, deleteFromS3 } from '../services/imageUpload.js';
import { z } from 'zod';

const router = Router();

// 이미지 업로드 응답 스키마
interface UploadResponse {
  success: boolean;
  data?: {
    key: string;
    url: string;
  };
  error?: string;
}

// 이미지 삭제 요청 파라미터 스키마
const deleteParamsSchema = z.object({
  key: z.string().min(1, '이미지 키가 필요합니다.'),
});

/**
 * POST /api/upload
 * 이미지 업로드
 */
router.post(
  '/',
  upload.single('image'),
  async (req: Request, res: Response<UploadResponse>, next: NextFunction) => {
    try {
      // 파일 존재 여부 확인
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: '업로드할 이미지 파일이 없습니다.',
        });
        return;
      }

      // 이미지 처리 및 S3 업로드
      const result = await processAndUploadImage(req.file);

      res.status(201).json({
        success: true,
        data: {
          key: result.key,
          url: result.url,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/upload/:key
 * 이미지 삭제
 * key는 URL 인코딩된 S3 객체 키 (예: uploads/uuid.webp -> uploads%2Fuuid.webp)
 */
router.delete(
  '/:key(*)',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 파라미터 검증
      const parseResult = deleteParamsSchema.safeParse({ key: req.params.key });

      if (!parseResult.success) {
        res.status(400).json({
          success: false,
          error: parseResult.error.errors[0].message,
        });
        return;
      }

      const { key } = parseResult.data;

      // uploads/ 경로 검증 (보안을 위해 uploads 디렉토리 내 파일만 삭제 가능)
      if (!key.startsWith('uploads/')) {
        res.status(403).json({
          success: false,
          error: '삭제 권한이 없는 파일입니다.',
        });
        return;
      }

      // S3에서 이미지 삭제
      await deleteFromS3(key);

      res.status(200).json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Multer 에러 처리 미들웨어
router.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (error instanceof Error) {
    // Multer 파일 크기 제한 에러
    if (error.message.includes('File too large')) {
      res.status(413).json({
        success: false,
        error: '파일 크기가 너무 큽니다. 최대 10MB까지 업로드 가능합니다.',
      });
      return;
    }

    // Multer 파일 형식 에러 (fileFilter에서 발생)
    if (
      error.message.includes('지원하지 않는 파일') ||
      error.message.includes('지원하지 않는 파일 확장자')
    ) {
      res.status(415).json({
        success: false,
        error: error.message,
      });
      return;
    }
  }

  next(error);
});

export default router;

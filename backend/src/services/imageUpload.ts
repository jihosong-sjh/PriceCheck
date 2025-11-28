/**
 * S3 이미지 업로드 서비스
 * - Multer로 파일 수신
 * - Sharp로 이미지 최적화 (리사이징, WebP 변환)
 * - S3 업로드 및 URL 반환
 * - 파일 형식 검증 (JPG, PNG만 허용)
 * - 파일 크기 제한 (10MB)
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import multer, { type FileFilterCallback } from 'multer';
import { type Request } from 'express';
import { randomUUID } from 'crypto';

// S3 클라이언트 지연 초기화 (dotenv.config() 이후에 환경 변수 읽기)
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-northeast-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return s3Client;
}

function getS3Bucket(): string {
  return process.env.AWS_S3_BUCKET || 'pricecheck-images';
}
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

// 이미지 최적화 설정
const IMAGE_MAX_WIDTH = 1920;
const IMAGE_MAX_HEIGHT = 1080;
const WEBP_QUALITY = 85;

/**
 * 허용된 파일 형식인지 검증
 */
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  // MIME 타입 검사
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(new Error('지원하지 않는 파일 형식입니다. JPG, PNG 파일만 업로드 가능합니다.'));
    return;
  }

  // 확장자 검사
  const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    cb(new Error('지원하지 않는 파일 확장자입니다. .jpg, .jpeg, .png 파일만 업로드 가능합니다.'));
    return;
  }

  cb(null, true);
};

/**
 * Multer 설정 - 메모리 저장소 사용 (Sharp 처리를 위해)
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

/**
 * 이미지 최적화 (리사이징 + WebP 변환)
 */
export async function optimizeImage(buffer: Buffer): Promise<Buffer> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  let pipeline = image;

  // 이미지가 최대 크기보다 크면 리사이징
  if (metadata.width && metadata.height) {
    if (metadata.width > IMAGE_MAX_WIDTH || metadata.height > IMAGE_MAX_HEIGHT) {
      pipeline = pipeline.resize(IMAGE_MAX_WIDTH, IMAGE_MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
  }

  // WebP로 변환
  const optimizedBuffer = await pipeline
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  return optimizedBuffer;
}

/**
 * S3에 이미지 업로드
 * @returns S3 객체 키와 URL
 */
export async function uploadToS3(
  buffer: Buffer,
  originalFilename: string
): Promise<{ key: string; url: string }> {
  // 고유한 파일명 생성
  const uuid = randomUUID();
  const key = `uploads/${uuid}.webp`;

  // S3 업로드
  const bucket = getS3Bucket();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: 'image/webp',
    Metadata: {
      originalFilename: encodeURIComponent(originalFilename),
    },
  });

  await getS3Client().send(command);

  // CloudFront URL 또는 S3 URL 반환
  const cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN;
  const url = cloudFrontDomain
    ? `https://${cloudFrontDomain}/${key}`
    : `https://${bucket}.s3.${process.env.AWS_REGION || 'ap-northeast-2'}.amazonaws.com/${key}`;

  return { key, url };
}

/**
 * S3에서 이미지 삭제
 */
export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: getS3Bucket(),
    Key: key,
  });

  await getS3Client().send(command);
}

/**
 * 전체 이미지 업로드 프로세스
 * 1. 이미지 최적화
 * 2. S3 업로드
 * 3. URL 반환
 */
export async function processAndUploadImage(
  file: Express.Multer.File
): Promise<{ key: string; url: string }> {
  // 이미지 최적화
  const optimizedBuffer = await optimizeImage(file.buffer);

  // S3 업로드
  const result = await uploadToS3(optimizedBuffer, file.originalname);

  return result;
}

/**
 * 파일 크기 검증 유틸리티
 */
export function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

/**
 * MIME 타입 검증 유틸리티
 */
export function validateMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

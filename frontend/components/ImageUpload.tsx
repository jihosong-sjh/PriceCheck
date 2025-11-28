'use client';

/**
 * 이미지 업로드 컴포넌트
 * - 파일 선택 버튼
 * - 이미지 미리보기
 * - 삭제 버튼
 * - 형식/크기 오류 메시지 표시
 */
import { useState, useRef, useCallback } from 'react';
import { uploadImage, deleteImage } from '@/lib/api';

// 허용된 파일 형식
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadedImage {
  key: string;
  url: string;
  file?: File;
}

interface ImageUploadProps {
  onImageChange?: (images: UploadedImage[]) => void;
  maxImages?: number;
  className?: string;
}

export default function ImageUpload({
  onImageChange,
  maxImages = 5,
  className = '',
}: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 검증
  const validateFile = useCallback((file: File): string | null => {
    // 파일 형식 검사
    if (!ALLOWED_TYPES.includes(file.type)) {
      return '지원하지 않는 파일 형식입니다. JPG, PNG 파일만 업로드 가능합니다.';
    }

    // 확장자 검사
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return '지원하지 않는 파일 확장자입니다. .jpg, .jpeg, .png 파일만 업로드 가능합니다.';
    }

    // 파일 크기 검사
    if (file.size > MAX_FILE_SIZE) {
      return `파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE / 1024 / 1024}MB까지 업로드 가능합니다.`;
    }

    return null;
  }, []);

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      // 최대 이미지 수 확인
      if (images.length + files.length > maxImages) {
        setError(`최대 ${maxImages}개의 이미지만 업로드할 수 있습니다.`);
        return;
      }

      setError(null);
      setIsUploading(true);

      const newImages: UploadedImage[] = [];

      for (const file of Array.from(files)) {
        // 파일 검증
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          continue;
        }

        try {
          // 업로드 수행
          const result = await uploadImage(file);
          console.log('업로드 결과:', result);
          newImages.push({
            key: result.key,
            url: result.url,
            file,
          });
        } catch (err) {
          console.error('이미지 업로드 실패:', err);
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('이미지 업로드 중 오류가 발생했습니다.');
          }
        }
      }

      if (newImages.length > 0) {
        const updatedImages = [...images, ...newImages];
        console.log('업데이트할 이미지들:', updatedImages);
        setImages(updatedImages);
        onImageChange?.(updatedImages);
      }

      setIsUploading(false);

      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [images, maxImages, onImageChange, validateFile]
  );

  // 이미지 삭제 핸들러
  const handleRemoveImage = useCallback(
    async (key: string) => {
      try {
        await deleteImage(key);
        const updatedImages = images.filter((img) => img.key !== key);
        setImages(updatedImages);
        onImageChange?.(updatedImages);
        setError(null);
      } catch (err) {
        console.error('이미지 삭제 실패:', err);
        // 삭제 실패해도 UI에서는 제거 (로컬 상태만 업데이트)
        const updatedImages = images.filter((img) => img.key !== key);
        setImages(updatedImages);
        onImageChange?.(updatedImages);
      }
    },
    [images, onImageChange]
  );

  // 파일 선택 버튼 클릭
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        // 파일 입력에 파일을 설정하고 change 이벤트 트리거
        const dataTransfer = new DataTransfer();
        Array.from(files).forEach((file) => dataTransfer.items.add(file));
        if (fileInputRef.current) {
          fileInputRef.current.files = dataTransfer.files;
          fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    },
    []
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 에러 메시지 */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 업로드 영역 */}
      {images.length < maxImages && (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
          onClick={handleButtonClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-gray-600">업로드 중...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <svg
                className="w-12 h-12 text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-600 mb-1">이미지를 드래그하거나 클릭하여 업로드</p>
              <p className="text-xs text-gray-400">
                JPG, PNG 파일 (최대 10MB, {maxImages}개까지)
              </p>
            </div>
          )}
        </div>
      )}

      {/* 이미지 미리보기 */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((image) => (
            <div key={image.key} className="relative group aspect-square">
              <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt="업로드된 이미지"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* 삭제 버튼 */}
              <button
                type="button"
                onClick={() => handleRemoveImage(image.key)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                title="이미지 삭제"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 업로드 개수 표시 */}
      {images.length > 0 && (
        <p className="text-sm text-gray-500 text-right">
          {images.length} / {maxImages}개 이미지
        </p>
      )}
    </div>
  );
}

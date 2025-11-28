'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import PriceForm from '@/components/PriceForm';
import PriceResult from '@/components/PriceResult';
import ImageUpload, { type UploadedImage } from '@/components/ImageUpload';
import { requestPriceRecommend, recognizeProduct, ApiException, setAuthToken } from '@/lib/api';
import type { PriceRecommendRequest, PriceRecommendResponse, Category } from '@/lib/types';

type ViewState = 'form' | 'result';

export default function PriceGuidePage() {
  const { data: session } = useSession();
  const [viewState, setViewState] = useState<ViewState>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PriceRecommendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 이미지 업로드 상태
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  // AI 인식 상태
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [recognitionSuccess, setRecognitionSuccess] = useState<string | null>(null);

  // AI 인식 결과 (폼 초기값으로 전달)
  const [recognizedValues, setRecognizedValues] = useState<{
    category?: Category;
    productName?: string;
    modelName?: string;
  } | null>(null);

  // 세션의 accessToken을 API 클라이언트에 설정
  useEffect(() => {
    if (session?.accessToken) {
      setAuthToken(session.accessToken);
    }
  }, [session?.accessToken]);

  // 이미지 변경 핸들러
  const handleImageChange = useCallback((images: UploadedImage[]) => {
    setUploadedImages(images);
    // 이미지가 변경되면 이전 인식 결과 초기화
    if (images.length === 0) {
      setRecognitionSuccess(null);
      setRecognitionError(null);
    }
  }, []);

  // AI 제품 인식 핸들러
  const handleRecognize = useCallback(async () => {
    if (uploadedImages.length === 0) {
      setRecognitionError('인식할 이미지를 먼저 업로드해주세요.');
      return;
    }

    const imageUrl = uploadedImages[0].url;

    setIsRecognizing(true);
    setRecognitionError(null);
    setRecognitionSuccess(null);

    try {
      const result = await recognizeProduct(imageUrl);

      if (result.productName || result.category) {
        // 인식 결과를 폼 초기값으로 설정
        setRecognizedValues({
          category: result.category || undefined,
          productName: result.productName || undefined,
          modelName: result.modelName || undefined,
        });

        const recognizedFields: string[] = [];
        if (result.category) recognizedFields.push('카테고리');
        if (result.productName) recognizedFields.push('제품명');
        if (result.modelName) recognizedFields.push('모델명');

        setRecognitionSuccess(
          `인식 완료! ${recognizedFields.join(', ')}이(가) 자동으로 입력되었습니다. (신뢰도: ${result.confidence}%)`
        );
      } else {
        setRecognitionError('제품을 인식할 수 없습니다. 다른 이미지를 사용하거나 직접 입력해주세요.');
      }
    } catch (err) {
      console.error('제품 인식 실패:', err);
      if (err instanceof ApiException) {
        setRecognitionError(err.data.message || '제품 인식에 실패했습니다.');
      } else {
        setRecognitionError('제품 인식 중 오류가 발생했습니다.');
      }
    } finally {
      setIsRecognizing(false);
    }
  }, [uploadedImages]);

  const handleSubmit = async (data: PriceRecommendRequest, _imageKeys?: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await requestPriceRecommend(data);
      setResult(response);
      setViewState('result');
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.status === 404) {
          setError('시세 데이터를 찾을 수 없습니다. 제품명을 다시 확인해주세요.');
        } else if (err.status === 400) {
          setError(err.data.message || '입력 정보를 확인해주세요.');
        } else {
          setError(err.data.message || '가격 조회 중 오류가 발생했습니다.');
        }
      } else {
        setError('서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
      }
      setViewState('result');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setViewState('form');
    // 인식 상태도 초기화
    setRecognizedValues(null);
    setRecognitionSuccess(null);
    setRecognitionError(null);
    setUploadedImages([]);
  };

  // 이미지 키 배열 생성
  const imageKeys = uploadedImages.map((img) => img.key);

  return (
    <div className="container-narrow py-8 md:py-12">
      {/* 페이지 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">중고 전자제품 가격 가이드</h1>
        <p className="text-gray-600 dark:text-gray-300">
          제품 사진을 업로드하면 AI가 자동으로 제품을 인식합니다
          <br className="hidden sm:block" />
          또는 직접 제품 정보를 입력해주세요
        </p>
      </div>

      {/* 메인 컨텐츠 */}
      {viewState === 'form' ? (
        <div className="space-y-6">
          {/* 이미지 업로드 섹션 */}
          <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border-blue-200 dark:border-gray-600">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                사진으로 빠른 입력
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                제품 사진을 업로드하고 AI 인식 버튼을 누르면 제품 정보가 자동으로 입력됩니다
              </p>
            </div>

            {/* 이미지 업로드 컴포넌트 */}
            <ImageUpload
              onImageChange={handleImageChange}
              maxImages={5}
              showRecognizeButton={false}
            />

            {/* AI 인식 버튼 */}
            {uploadedImages.length > 0 && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleRecognize}
                  disabled={isRecognizing}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  {isRecognizing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>AI가 제품을 인식하는 중...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                      <span>AI로 제품 인식하기</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* 인식 결과 메시지 */}
            {recognitionSuccess && (
              <div className="mt-4 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700 flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {recognitionSuccess}
              </div>
            )}

            {recognitionError && (
              <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {recognitionError}
              </div>
            )}
          </div>

          {/* 구분선 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">또는 직접 입력</span>
            </div>
          </div>

          {/* 제품 정보 폼 */}
          <div className="card">
            <PriceForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
              initialValues={recognizedValues || undefined}
              imageKeys={imageKeys.length > 0 ? imageKeys : undefined}
            />
          </div>
        </div>
      ) : (
        <div className="card">
          <PriceResult
            result={result}
            error={error}
            onReset={handleReset}
            recommendationId={result?.id}
          />
        </div>
      )}

      {/* 사용 안내 */}
      {viewState === 'form' && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-primary-600 dark:text-primary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">AI 제품 인식</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                사진만 올리면 AI가 제품을 자동으로 인식합니다
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-primary-600 dark:text-primary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">실시간 시세 분석</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                주요 중고거래 플랫폼의 최신 시세를 분석합니다
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-primary-600 dark:text-primary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">가격 범위 제공</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                최저-최고 가격 범위로 협상 여지를 파악합니다
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

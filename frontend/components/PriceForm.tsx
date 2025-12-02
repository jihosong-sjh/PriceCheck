'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  type Category,
  type Condition,
  type PriceRecommendRequest,
  CATEGORIES,
  CONDITIONS,
} from '@/lib/types';

// Zod 스키마 정의 (Zod v4 API)
const categoryValues = ['SMARTPHONE', 'LAPTOP', 'TABLET', 'SMARTWATCH', 'EARPHONE', 'SPEAKER', 'MONITOR', 'KEYBOARD_MOUSE', 'TV'] as const;
const conditionValues = ['GOOD', 'FAIR', 'POOR'] as const;

const priceFormSchema = z.object({
  category: z.enum(categoryValues, { message: '카테고리를 선택해주세요' }),
  productName: z
    .string()
    .min(1, '제품명을 입력해주세요')
    .min(2, '제품명은 최소 2자 이상이어야 합니다'),
  modelName: z.string().optional(),
  condition: z.enum(conditionValues, { message: '상태를 선택해주세요' }),
});

type PriceFormData = z.infer<typeof priceFormSchema>;

interface PriceFormProps {
  onSubmit: (data: PriceRecommendRequest, imageKeys?: string[]) => void;
  isLoading?: boolean;
  initialValues?: {
    category?: Category;
    productName?: string;
    modelName?: string;
  };
  imageKeys?: string[];
}

export default function PriceForm({
  onSubmit,
  isLoading = false,
  initialValues,
  imageKeys,
}: PriceFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<PriceFormData>({
    resolver: zodResolver(priceFormSchema),
    defaultValues: {
      category: undefined,
      productName: '',
      modelName: '',
      condition: 'FAIR',
    },
  });

  // initialValues가 변경되면 폼 값 업데이트 (AI 인식 결과 적용)
  useEffect(() => {
    if (initialValues) {
      if (initialValues.category) {
        setValue('category', initialValues.category, { shouldValidate: true });
      }
      if (initialValues.productName) {
        setValue('productName', initialValues.productName, { shouldValidate: true });
      }
      if (initialValues.modelName) {
        setValue('modelName', initialValues.modelName);
      }
    }
  }, [initialValues, setValue]);

  const onFormSubmit = (data: PriceFormData) => {
    onSubmit(
      {
        category: data.category as Category,
        productName: data.productName.trim(),
        modelName: data.modelName?.trim() || undefined,
        condition: data.condition as Condition,
      },
      imageKeys && imageKeys.length > 0 ? imageKeys : undefined
    );
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* 카테고리 선택 */}
      <div className="input-group">
        <label htmlFor="category" className="input-label">
          카테고리 <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          {...register('category')}
          className={`select-field ${errors.category ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
          disabled={isLoading}
        >
          <option value="">카테고리를 선택하세요</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.code} value={cat.code}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.category && <p className="input-error">{errors.category.message}</p>}
      </div>

      {/* 제품명 입력 */}
      <div className="input-group">
        <label htmlFor="productName" className="input-label">
          제품명 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="productName"
          {...register('productName')}
          placeholder="예: 아이폰 15 프로, 갤럭시 S24"
          className={`form-field ${errors.productName ? 'form-field-error' : ''}`}
          disabled={isLoading}
        />
        {errors.productName && <p className="input-error">{errors.productName.message}</p>}
      </div>

      {/* 모델명 입력 (선택) */}
      <div className="input-group">
        <label htmlFor="modelName" className="input-label">
          모델명 <span className="text-gray-400">(선택)</span>
        </label>
        <input
          type="text"
          id="modelName"
          {...register('modelName')}
          placeholder="예: MU7A3KH/A, SM-S921N"
          className="form-field"
          disabled={isLoading}
        />
        <p className="input-help">정확한 모델명을 입력하면 더 정확한 시세를 확인할 수 있습니다</p>
      </div>

      {/* 상태 선택 */}
      <div className="input-group">
        <label className="input-label">
          제품 상태 <span className="text-red-500">*</span>
        </label>
        <Controller
          name="condition"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-3">
              {CONDITIONS.map((cond) => (
                <button
                  type="button"
                  key={cond.code}
                  onClick={() => field.onChange(cond.code)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    field.value === cond.code
                      ? 'border-primary-600 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-900/50 dark:text-primary-300'
                      : 'border-gray-200 hover:border-gray-300 bg-white dark:border-gray-600 dark:hover:border-gray-500 dark:bg-gray-800'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  disabled={isLoading}
                >
                  <div className={`font-semibold text-lg ${field.value === cond.code ? '' : 'dark:text-white'}`}>
                    {cond.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{cond.description}</div>
                </button>
              ))}
            </div>
          )}
        />
        {errors.condition && <p className="input-error mt-2">{errors.condition.message}</p>}
      </div>

      {/* 제출 버튼 */}
      <button
        type="submit"
        className="btn-primary w-full btn-lg"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="spinner" />
            시세 조회 중...
          </span>
        ) : (
          '가격 추천 받기'
        )}
      </button>
    </form>
  );
}

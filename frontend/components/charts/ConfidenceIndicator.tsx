'use client';

import { getConfidenceInfo, type ConfidenceLevel } from '@/lib/chartUtils';

interface ConfidenceIndicatorProps {
  sampleCount: number;
  confidence?: ConfidenceLevel;
  coefficientOfVariation?: number;
}

export default function ConfidenceIndicator({
  sampleCount,
  confidence,
  coefficientOfVariation,
}: ConfidenceIndicatorProps) {
  // 신뢰도 정보 계산
  const info = confidence
    ? getConfidenceInfo(
        sampleCount,
        confidence === 'HIGH' ? 0.1 : confidence === 'MEDIUM' ? 0.25 : 0.4
      )
    : getConfidenceInfo(sampleCount, coefficientOfVariation);

  // 변동계수 백분율
  const cvPercent = coefficientOfVariation
    ? Math.round(coefficientOfVariation * 100)
    : null;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">시세 신뢰도</h3>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${info.color} ${
            info.level === 'HIGH'
              ? 'bg-green-100'
              : info.level === 'MEDIUM'
              ? 'bg-amber-100'
              : 'bg-red-100'
          }`}
        >
          {info.label}
        </span>
      </div>

      {/* 프로그레스 바 */}
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out ${info.bgColor}`}
          style={{ width: `${info.percentage}%` }}
        />
        {/* 구간 표시 */}
        <div className="absolute left-1/3 top-0 h-full w-px bg-gray-300" />
        <div className="absolute left-2/3 top-0 h-full w-px bg-gray-300" />
      </div>

      {/* 상세 정보 */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{sampleCount}</div>
          <div className="text-sm text-gray-500">분석 매물 수</div>
        </div>
        {cvPercent !== null && (
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{cvPercent}%</div>
            <div className="text-sm text-gray-500">가격 편차</div>
          </div>
        )}
        {cvPercent === null && (
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className={`text-2xl font-bold ${info.color}`}>{info.label}</div>
            <div className="text-sm text-gray-500">신뢰 수준</div>
          </div>
        )}
      </div>

      {/* 설명 */}
      <p className="text-sm text-gray-600 flex items-start gap-2">
        <svg
          className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {info.description}
      </p>
    </div>
  );
}

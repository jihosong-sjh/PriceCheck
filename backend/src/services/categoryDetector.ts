/**
 * 카테고리 자동 추정 서비스
 * 제품명에서 키워드를 분석하여 카테고리를 추정합니다.
 */

import type { Category } from '../utils/validators.js';

// 카테고리별 키워드 매핑 (대소문자 무시, 한글/영문 포함)
const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  SMARTPHONE: [
    // 브랜드 + 제품
    '아이폰', 'iphone',
    '갤럭시 s', '갤럭시 z', '갤럭시s', '갤럭시z', 'galaxy s', 'galaxy z',
    '갤럭시 노트', 'galaxy note',
    '픽셀', 'pixel',
    '샤오미', 'xiaomi', 'redmi',
    // 일반 키워드
    '스마트폰', 'smartphone',
    '휴대폰', '핸드폰', '폰',
  ],
  LAPTOP: [
    // 브랜드 + 제품
    '맥북', 'macbook',
    '그램', 'gram',
    '갤럭시북', 'galaxy book',
    '씽크패드', 'thinkpad',
    'xps', '레노버', 'lenovo',
    // 일반 키워드
    '노트북', 'laptop', 'notebook',
  ],
  TABLET: [
    // 브랜드 + 제품
    '아이패드', 'ipad',
    '갤럭시탭', '갤럭시 탭', 'galaxy tab',
    // 일반 키워드
    '태블릿', 'tablet',
  ],
  SMARTWATCH: [
    // 브랜드 + 제품
    '애플워치', '애플 워치', 'apple watch',
    '갤럭시워치', '갤럭시 워치', 'galaxy watch',
    '미밴드', 'mi band',
    '핏빗', 'fitbit',
    '가민', 'garmin',
    // 일반 키워드
    '스마트워치', 'smartwatch', 'smart watch',
    '워치', 'watch',
  ],
  EARPHONE: [
    // 브랜드 + 제품
    '에어팟', 'airpods', 'airpod',
    '갤럭시버즈', '갤럭시 버즈', 'galaxy buds',
    '비츠', 'beats',
    '소니 wf', 'sony wf', 'wf-1000',
    '젠하이저', 'sennheiser',
    '보스 qc', 'bose qc',
    // 일반 키워드
    '이어폰', 'earphone', 'earbuds',
    '헤드폰', 'headphone',
    '무선이어폰', '블루투스 이어폰',
  ],
  SPEAKER: [
    // 브랜드 + 제품
    'jbl', '제이비엘',
    '홈팟', 'homepod',
    '마샬', 'marshall',
    '뱅앤올룹슨', 'b&o', 'bang & olufsen',
    '소노스', 'sonos',
    '하만카돈', 'harman kardon',
    // 일반 키워드
    '스피커', 'speaker',
    '사운드바', 'soundbar',
    '블루투스 스피커', 'bluetooth speaker',
  ],
  MONITOR: [
    // 브랜드 + 제품
    'lg 모니터', 'lg 울트라', 'ultragear', '울트라기어',
    '삼성 모니터', '오디세이', 'odyssey',
    '델 모니터', 'dell monitor', 'ultrasharp',
    'asus 모니터', 'asus monitor', 'rog',
    '벤큐', 'benq',
    // 일반 키워드
    '모니터', 'monitor',
    '디스플레이', 'display',
    '게이밍 모니터', 'gaming monitor',
  ],
  KEYBOARD_MOUSE: [
    // 브랜드 + 제품
    '매직키보드', '매직 키보드', 'magic keyboard',
    '매직마우스', '매직 마우스', 'magic mouse',
    '로지텍', 'logitech', 'mx keys', 'mx master',
    '레이저', 'razer',
    '커세어', 'corsair',
    '레오폴드', 'leopold',
    '리얼포스', 'realforce',
    '해피해킹', 'hhkb',
    // 일반 키워드
    '키보드', 'keyboard',
    '마우스', 'mouse',
    '기계식 키보드', 'mechanical keyboard',
    '무선 마우스', 'wireless mouse',
  ],
  TV: [
    // 브랜드 + 제품
    'lg tv', 'lg 티비', 'lg 올레드', 'lg oled',
    '삼성 tv', '삼성 티비', '삼성 qled', 'samsung qled',
    '소니 tv', 'sony tv', 'bravia',
    // 일반 키워드
    'tv', '티비', '텔레비전', 'television',
    'oled', 'qled', 'neo qled',
    '스마트tv', 'smart tv',
  ],
};

// 키워드 우선순위 가중치 (더 긴 키워드가 더 정확함)
function getKeywordWeight(keyword: string): number {
  // 공백 포함 복합 키워드는 더 높은 가중치
  if (keyword.includes(' ')) return keyword.length * 2;
  return keyword.length;
}

/**
 * 제품명에서 카테고리를 추정합니다.
 * @param productName 제품명
 * @returns 추정된 카테고리 또는 null (추정 실패 시)
 */
export function detectCategory(productName: string): Category | null {
  const lowerName = productName.toLowerCase();

  // 각 카테고리별 매칭 점수 계산
  const scores: Record<Category, number> = {
    SMARTPHONE: 0,
    LAPTOP: 0,
    TABLET: 0,
    SMARTWATCH: 0,
    EARPHONE: 0,
    SPEAKER: 0,
    MONITOR: 0,
    KEYBOARD_MOUSE: 0,
    TV: 0,
  };

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerName.includes(keyword.toLowerCase())) {
        scores[category as Category] += getKeywordWeight(keyword);
      }
    }
  }

  // 최고 점수 카테고리 찾기
  let maxScore = 0;
  let bestCategory: Category | null = null;

  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category as Category;
    }
  }

  // 최소 점수 임계값 (너무 낮은 점수는 신뢰할 수 없음)
  const MIN_SCORE_THRESHOLD = 2;

  if (maxScore < MIN_SCORE_THRESHOLD) {
    return null;
  }

  return bestCategory;
}

/**
 * 카테고리 추정 결과와 신뢰도를 반환합니다.
 */
export interface CategoryDetectionResult {
  category: Category | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
  score: number;
}

export function detectCategoryWithConfidence(productName: string): CategoryDetectionResult {
  const lowerName = productName.toLowerCase();

  const scores: Record<Category, number> = {
    SMARTPHONE: 0,
    LAPTOP: 0,
    TABLET: 0,
    SMARTWATCH: 0,
    EARPHONE: 0,
    SPEAKER: 0,
    MONITOR: 0,
    KEYBOARD_MOUSE: 0,
    TV: 0,
  };

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerName.includes(keyword.toLowerCase())) {
        scores[category as Category] += getKeywordWeight(keyword);
      }
    }
  }

  let maxScore = 0;
  let secondMaxScore = 0;
  let bestCategory: Category | null = null;

  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      secondMaxScore = maxScore;
      maxScore = score;
      bestCategory = category as Category;
    } else if (score > secondMaxScore) {
      secondMaxScore = score;
    }
  }

  // 신뢰도 계산
  let confidence: 'high' | 'medium' | 'low' | 'none';

  if (maxScore === 0) {
    confidence = 'none';
    bestCategory = null;
  } else if (maxScore >= 10 && maxScore > secondMaxScore * 2) {
    // 높은 점수이고, 2위와 큰 차이가 있으면 high
    confidence = 'high';
  } else if (maxScore >= 5) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return {
    category: bestCategory,
    confidence,
    score: maxScore,
  };
}

export default {
  detectCategory,
  detectCategoryWithConfidence,
};

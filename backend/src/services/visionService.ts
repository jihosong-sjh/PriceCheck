/**
 * Google Cloud Vision API 서비스
 * 이미지에서 제품 정보(카테고리, 브랜드, 모델명)를 인식합니다.
 */

import vision from '@google-cloud/vision';
import type { Category } from '@prisma/client';

/**
 * URL에서 이미지를 다운로드하여 base64로 변환합니다.
 */
async function downloadImageAsBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`이미지 다운로드 실패: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}

// Vision API 클라이언트 (환경변수 GOOGLE_APPLICATION_CREDENTIALS로 자동 인증)
const client = new vision.ImageAnnotatorClient();

// 인식 결과 타입
export interface RecognitionResult {
  category: Category | null;
  brand: string | null;
  productName: string | null;
  modelName: string | null;
  confidence: number;
  rawLabels: string[];
  rawTexts: string[];
}

// 카테고리별 키워드 매핑 (Vision API가 반환하는 영문 라벨 포함)
const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  SMARTPHONE: [
    // 영문 (Vision API 라벨)
    'phone', 'smartphone', 'mobile phone', 'cell phone', 'cellular phone',
    'mobile device', 'communication device', 'portable communications device',
    'iphone', 'galaxy', 'pixel', 'android',
    // 한글
    '스마트폰', '핸드폰', '휴대폰', '아이폰', '갤럭시',
  ],
  LAPTOP: [
    // 영문
    'laptop', 'notebook', 'macbook', 'ultrabook', 'netbook',
    'portable computer', 'personal computer', 'computer',
    // 한글
    '노트북', '맥북', '랩탑', '컴퓨터',
  ],
  TABLET: [
    // 영문
    'tablet', 'tablet computer', 'ipad', 'tab', 'slate',
    // 한글
    '태블릿', '아이패드', '탭',
  ],
  SMARTWATCH: [
    // 영문
    'watch', 'smartwatch', 'smart watch', 'wearable', 'wrist watch',
    'apple watch', 'galaxy watch', 'fitness tracker',
    // 한글
    '시계', '스마트워치', '워치', '애플워치', '갤럭시워치',
  ],
  EARPHONE: [
    // 영문
    'earphone', 'headphone', 'earbuds', 'airpods', 'buds', 'headset',
    'audio equipment', 'earpiece', 'wireless earbuds', 'tws',
    // 한글
    '이어폰', '헤드폰', '에어팟', '버즈', '이어버드', '헤드셋',
  ],
};

// 브랜드별 제품 카테고리 매핑 (브랜드 감지 시 카테고리 추론에 사용)
const BRAND_PRODUCT_HINTS: Record<string, { keywords: string[]; category: Category }[]> = {
  Apple: [
    { keywords: ['iphone', '아이폰'], category: 'SMARTPHONE' },
    { keywords: ['ipad', '아이패드'], category: 'TABLET' },
    { keywords: ['macbook', '맥북', 'mac'], category: 'LAPTOP' },
    { keywords: ['watch', '워치'], category: 'SMARTWATCH' },
    { keywords: ['airpods', '에어팟', 'airpod'], category: 'EARPHONE' },
  ],
  Samsung: [
    { keywords: ['galaxy s', 'galaxy z', 'galaxy a', 'galaxy note', '갤럭시 s', '갤럭시 z'], category: 'SMARTPHONE' },
    { keywords: ['galaxy tab', '갤럭시 탭'], category: 'TABLET' },
    { keywords: ['galaxy book', '갤럭시 북'], category: 'LAPTOP' },
    { keywords: ['galaxy watch', '갤럭시 워치'], category: 'SMARTWATCH' },
    { keywords: ['galaxy buds', '갤럭시 버즈', 'buds'], category: 'EARPHONE' },
  ],
};

// 브랜드 키워드
const BRAND_KEYWORDS = [
  // Apple
  { brand: 'Apple', keywords: ['apple', 'iphone', 'ipad', 'macbook', 'airpods', 'apple watch'] },
  // Samsung
  { brand: 'Samsung', keywords: ['samsung', 'galaxy', '삼성', '갤럭시'] },
  // LG
  { brand: 'LG', keywords: ['lg', 'gram', '엘지'] },
  // Sony
  { brand: 'Sony', keywords: ['sony', 'xperia', '소니'] },
  // Xiaomi
  { brand: 'Xiaomi', keywords: ['xiaomi', 'mi', 'redmi', '샤오미'] },
  // Google
  { brand: 'Google', keywords: ['google', 'pixel', '구글'] },
  // Huawei
  { brand: 'Huawei', keywords: ['huawei', '화웨이'] },
  // OnePlus
  { brand: 'OnePlus', keywords: ['oneplus', '원플러스'] },
  // Lenovo
  { brand: 'Lenovo', keywords: ['lenovo', 'thinkpad', '레노버'] },
  // HP
  { brand: 'HP', keywords: ['hp', 'hewlett'] },
  // Dell
  { brand: 'Dell', keywords: ['dell', 'inspiron', 'xps'] },
  // ASUS
  { brand: 'ASUS', keywords: ['asus', 'rog', 'zenbook', '아수스'] },
  // Bose
  { brand: 'Bose', keywords: ['bose', '보스'] },
  // JBL
  { brand: 'JBL', keywords: ['jbl'] },
];

// 모델명 패턴 (제품별 구체적 패턴 우선)
const MODEL_PATTERNS = [
  // iPhone (iPhone 15 Pro Max 등)
  /iphone\s*(\d+)\s*(pro|plus|max|mini)?(\s*(pro\s*)?max)?/i,
  // Galaxy S/Z/A/Note (Galaxy S24 Ultra 등)
  /galaxy\s*(s|z|a|note|tab|buds|watch|book)?\s*(\d+)?\s*(ultra|plus|\+|fe|pro|lite)?/i,
  // MacBook (MacBook Air M3 등)
  /macbook\s*(air|pro)?\s*(m\d+)?/i,
  // iPad (iPad Pro 12.9 등)
  /ipad\s*(pro|air|mini)?\s*(\d+(\.\d+)?)?/i,
  // AirPods (AirPods Pro 2 등)
  /airpods\s*(pro|max)?\s*(\d+)?/i,
  // Apple Watch (Apple Watch Series 9 등)
  /apple\s*watch\s*(series|se|ultra)?\s*(\d+)?/i,
  // Galaxy Watch
  /galaxy\s*watch\s*(\d+)?\s*(classic|ultra)?/i,
  // Galaxy Buds
  /galaxy\s*buds\s*(\d+)?\s*(pro|plus|live|fe)?/i,
  // Pixel
  /pixel\s*(\d+)\s*(pro|a)?/i,
  // 구체적인 모델 번호 (SM-S928, A2894 등) - 날짜 패턴 제외
  /\b(SM|GT|SCH|SGH|SPH)-?[A-Z]?\d{3,4}[A-Z]?\b/i,
  /\bA\d{4}\b/i, // Apple 모델번호 (A2894 등)
  /\bMK\w{5,6}\b/i, // Apple 부품번호
];

// 날짜 패턴 (모델명에서 제외)
const DATE_PATTERNS = [
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[-\s]?\d{2,4}\b/i,
  /\b\d{4}[-\/]\d{2}\b/,
  /\b\d{2}[-\/]\d{4}\b/,
];

/**
 * 이미지 URL에서 제품 정보를 인식합니다.
 */
export async function recognizeProduct(imageUrl: string): Promise<RecognitionResult> {
  const result: RecognitionResult = {
    category: null,
    brand: null,
    productName: null,
    modelName: null,
    confidence: 0,
    rawLabels: [],
    rawTexts: [],
  };

  try {
    // 이미지를 base64로 다운로드 (URL 직접 전달보다 안정적)
    console.log('[Vision] 이미지 다운로드 중:', imageUrl.substring(0, 60) + '...');
    const imageBase64 = await downloadImageAsBase64(imageUrl);
    console.log('[Vision] 이미지 다운로드 완료, 크기:', Math.round(imageBase64.length / 1024), 'KB');

    // Vision API 호출 (라벨 + 텍스트 + 로고 + 웹 감지)
    const [response] = await client.annotateImage({
      image: { content: imageBase64 },
      features: [
        { type: 'LABEL_DETECTION', maxResults: 20 },
        { type: 'TEXT_DETECTION' },
        { type: 'LOGO_DETECTION', maxResults: 5 },
        { type: 'WEB_DETECTION', maxResults: 10 }, // 웹에서 유사 이미지 검색
      ],
    });

    // 라벨 추출
    const labels = response.labelAnnotations || [];
    result.rawLabels = labels.map((l) => l.description?.toLowerCase() || '');

    // 텍스트 추출 (전체 텍스트)
    const textAnnotations = response.textAnnotations || [];
    const fullText = textAnnotations[0]?.description?.toLowerCase() || '';
    result.rawTexts = fullText.split('\n').filter((t) => t.trim());

    // 로고 추출
    const logos = response.logoAnnotations || [];
    const logoTexts = logos.map((l) => l.description?.toLowerCase() || '');

    // 웹 감지 결과 추출 (제품명 추론에 매우 유용)
    const webDetection = response.webDetection;
    const webEntities = webDetection?.webEntities || [];
    const webLabels = webEntities
      .filter((e) => e.description && (e.score || 0) > 0.5)
      .map((e) => e.description?.toLowerCase() || '');

    const bestGuessLabels = webDetection?.bestGuessLabels || [];
    const bestGuesses = bestGuessLabels.map((l) => l.label?.toLowerCase() || '');

    // rawLabels에 웹 감지 결과도 포함
    result.rawLabels = [...result.rawLabels, ...webLabels, ...bestGuesses];

    // 디버깅용 상세 로그
    console.log('[Vision] Raw 데이터:', {
      labels: result.rawLabels.slice(0, 10),
      texts: result.rawTexts.slice(0, 5),
      logos: logoTexts,
      webEntities: webLabels.slice(0, 10),
      bestGuess: bestGuesses,
    });

    // 모든 텍스트 결합 (웹 감지 결과 포함)
    const allTexts = [
      ...result.rawLabels,
      ...result.rawTexts,
      ...logoTexts,
      ...webLabels,
      ...bestGuesses,
    ].join(' ').toLowerCase();

    // 1. 브랜드 감지 (먼저 수행)
    result.brand = detectBrand(allTexts, logoTexts);

    // 2. 카테고리 감지 (브랜드 정보 활용)
    result.category = detectCategory(allTexts, result.brand);

    // 3. 모델명 추출
    result.modelName = extractModelName(allTexts);

    // 4. 제품명 조합
    result.productName = buildProductName(result.brand, result.category, result.modelName);

    // 5. 신뢰도 계산
    result.confidence = calculateConfidence(result);

    console.log('[Vision] 인식 결과:', {
      category: result.category,
      brand: result.brand,
      productName: result.productName,
      modelName: result.modelName,
      confidence: result.confidence,
    });

    return result;
  } catch (error) {
    console.error('[Vision] 이미지 인식 오류:', error);
    throw error;
  }
}

/**
 * 텍스트에서 카테고리를 감지합니다.
 * 브랜드 정보가 있으면 브랜드-제품 힌트도 활용합니다.
 */
function detectCategory(text: string, brand: string | null): Category | null {
  const scores: Record<Category, number> = {
    SMARTPHONE: 0,
    LAPTOP: 0,
    TABLET: 0,
    SMARTWATCH: 0,
    EARPHONE: 0,
  };

  // 키워드 매칭
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        // 구체적인 키워드에 더 높은 점수 부여
        const weight = keyword.length > 6 ? 2 : 1;
        scores[category as Category] += weight;
      }
    }
  }

  // 브랜드 기반 카테고리 추론
  if (brand && BRAND_PRODUCT_HINTS[brand]) {
    for (const hint of BRAND_PRODUCT_HINTS[brand]) {
      for (const keyword of hint.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          scores[hint.category] += 3; // 브랜드-제품 매칭은 높은 점수
        }
      }
    }
  }

  // 가장 높은 점수의 카테고리 선택
  let maxScore = 0;
  let detectedCategory: Category | null = null;

  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedCategory = category as Category;
    }
  }

  console.log('[Vision] 카테고리 점수:', scores, '→', detectedCategory);

  return maxScore > 0 ? detectedCategory : null;
}

/**
 * 텍스트에서 브랜드를 감지합니다.
 */
function detectBrand(text: string, logos: string[]): string | null {
  // 로고에서 먼저 찾기 (가장 신뢰도 높음)
  for (const brand of BRAND_KEYWORDS) {
    for (const logo of logos) {
      if (brand.keywords.some((k) => logo.includes(k.toLowerCase()))) {
        return brand.brand;
      }
    }
  }

  // 텍스트에서 찾기
  for (const brand of BRAND_KEYWORDS) {
    if (brand.keywords.some((k) => text.includes(k.toLowerCase()))) {
      return brand.brand;
    }
  }

  return null;
}

/**
 * 텍스트에서 모델명을 추출합니다.
 */
function extractModelName(text: string): string | null {
  for (const pattern of MODEL_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const modelName = match[0].replace(/\s+/g, ' ').trim();

      // 날짜 패턴인지 확인 (날짜면 제외)
      const isDate = DATE_PATTERNS.some((dp) => dp.test(modelName));
      if (isDate) {
        console.log('[Vision] 날짜 패턴 제외:', modelName);
        continue;
      }

      return modelName;
    }
  }
  return null;
}

/**
 * 브랜드, 카테고리, 모델명으로 제품명을 조합합니다.
 */
function buildProductName(
  brand: string | null,
  category: Category | null,
  modelName: string | null
): string | null {
  const parts: string[] = [];

  if (brand) {
    parts.push(brand);
  }

  if (modelName) {
    // 모델명에 브랜드가 포함되어 있으면 브랜드 중복 제거
    const modelLower = modelName.toLowerCase();
    if (brand && modelLower.includes(brand.toLowerCase())) {
      parts.pop(); // 브랜드 제거
    }
    parts.push(modelName);
  } else if (category) {
    // 모델명이 없으면 카테고리로 대체
    const categoryNames: Record<Category, string> = {
      SMARTPHONE: '스마트폰',
      LAPTOP: '노트북',
      TABLET: '태블릿',
      SMARTWATCH: '스마트워치',
      EARPHONE: '이어폰',
    };
    parts.push(categoryNames[category]);
  }

  return parts.length > 0 ? parts.join(' ') : null;
}

/**
 * 인식 결과의 신뢰도를 계산합니다.
 */
function calculateConfidence(result: RecognitionResult): number {
  let score = 0;
  let total = 4;

  if (result.category) score += 1;
  if (result.brand) score += 1;
  if (result.productName) score += 1;
  if (result.modelName) score += 1;

  return Math.round((score / total) * 100);
}

export default {
  recognizeProduct,
};

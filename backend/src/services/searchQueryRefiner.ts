/**
 * 검색어 정제 서비스
 * 네이버 쇼핑 API의 상세한 제품명을 중고 플랫폼 검색에 적합하게 정제
 */

import type { Category } from '../utils/validators.js';

// 정제 결과 인터페이스
export interface RefinedQuery {
  original: string;           // 원본 검색어
  refined: string;            // 정제된 검색어
  fallback?: string;          // 더 단순화된 검색어 (정제된 것도 결과 없을 때)
  extractedModel?: string;    // 추출된 모델명
  category?: Category;        // 감지된 카테고리
}

// 공통 제거 패턴
const COMMON_REMOVE_PATTERNS = [
  // 용량/메모리
  /\d+\s*GB/gi,
  /\d+\s*TB/gi,
  /\d+\s*MB/gi,
  // 연결 방식
  /\bWiFi\b/gi,
  /\bWi-Fi\b/gi,
  /\bLTE\b/gi,
  /\b5G\b/gi,
  /\bCellular\b/gi,
  // 색상 (한글) - 단어 경계 사용하여 "블루투스"의 "블루" 제거 방지
  /\s+(블랙|화이트|실버|그레이|골드|핑크|그린|퍼플|레드|베이지|크림|네이비|브론즈|티타늄|그라파이트)(\s|$)/gi,
  /\s+블루(\s|$)/gi,  // "블루"는 뒤에 공백이나 끝이 있을 때만
  // 색상 (영문)
  /\s+(Black|White|Silver|Gray|Grey|Gold|Pink|Blue|Green|Purple|Red|Beige|Navy|Bronze|Titanium|Graphite)\s*/gi,
  // 기타 스펙
  /\bUSB-?C\b/gi,
  /\bMagSafe\b/gi,
  /\bOLED\b/gi,
  /\bAMOLED\b/gi,
  /\bQHD\b/gi,
  /\bFHD\b/gi,
  /\bUHD\b/gi,
  /\b4K\b/gi,
  /\b8K\b/gi,
  // 콤마로 구분된 스펙 (예: ", 256GB")
  /,\s*\d+\s*(GB|TB)/gi,
  // 괄호 안 내용
  /\([^)]*\)/g,
  // 슬래시로 구분된 스펙
  /\/\s*\d+\s*(GB|TB)/gi,
  // 불필요한 구두점 정리
  /,\s*$/g,           // 끝에 남은 콤마
  /^\s*,/g,           // 앞에 남은 콤마
  /\s*,\s*,\s*/g,     // 연속된 콤마
];

// 제조사 정규화 맵
const MANUFACTURER_NORMALIZE: Record<string, string> = {
  '삼성전자': '삼성',
  'SAMSUNG': '삼성',
  'Samsung': '삼성',
  'LG전자': 'LG',
  '애플': '애플',
  'Apple': '애플',
  'APPLE': '애플',
  '소니': '소니',
  'SONY': '소니',
  'Sony': '소니',
};

// 카테고리별 정제 규칙
interface CategoryRule {
  // 핵심 제품명 추출 패턴
  extractPatterns: RegExp[];
  // 모델번호 추출 패턴
  modelPatterns: RegExp[];
  // 추가 제거 패턴
  removePatterns?: RegExp[];
  // 모델번호 정제 함수
  refineModel?: (model: string) => string;
}

const CATEGORY_RULES: Record<Category, CategoryRule> = {
  SMARTPHONE: {
    extractPatterns: [
      // 삼성 갤럭시
      /갤럭시\s*(S|Z|A|M|F)?\s*\d+\s*(울트라|플러스|\+|Ultra|Plus|FE)?/i,
      // 아이폰
      /아이폰\s*\d+\s*(프로|Pro)?\s*(맥스|Max)?/i,
      /iPhone\s*\d+\s*(Pro)?\s*(Max)?/i,
    ],
    modelPatterns: [
      /SM-[A-Z]\d+[A-Z]?/i,      // 삼성 모델번호
      /A\d{4}/i,                  // 애플 모델번호
    ],
    removePatterns: [
      /자급제/g,
      /공기계/g,
    ],
  },

  LAPTOP: {
    extractPatterns: [
      // 삼성 갤럭시북
      /갤럭시\s*북\s*\d*\s*(프로|울트라|360|Pro|Ultra)?/i,
      // LG 그램
      /그램\s*(프로|스타일|360)?\s*\d*/i,
      /gram\s*(Pro|Style|360)?\s*\d*/i,
      // 맥북
      /맥북\s*(에어|프로|Air|Pro)?\s*(M\d)?/i,
      /MacBook\s*(Air|Pro)?\s*(M\d)?/i,
      // ASUS
      /젠북|비보북|ROG|Zenbook|Vivobook/i,
      // 레노버
      /씽크패드|아이디어패드|ThinkPad|IdeaPad|Legion/i,
      // HP
      /스펙터|엔비|파빌리온|Spectre|Envy|Pavilion|Omen/i,
      // Dell
      /XPS|Inspiron|Latitude|Alienware/i,
    ],
    modelPatterns: [
      /NT\d{3}[A-Z]+/i,           // 삼성 노트북 모델
      /\d{2}Z\d{3,4}/i,           // LG 그램 모델
      /[A-Z]{2}\d{3,4}[A-Z]*/i,   // 일반 모델번호
    ],
    refineModel: (model: string) => {
      // NT960XHA-K52A → NT960XHA
      return model.replace(/-[A-Z0-9]+$/i, '');
    },
  },

  TABLET: {
    extractPatterns: [
      // 아이패드
      /아이패드\s*(프로|에어|미니|Pro|Air|Mini)?\s*(\d+세대|\d+th)?/i,
      /iPad\s*(Pro|Air|Mini)?\s*(\d+)?/i,
      // 갤럭시 탭
      /갤럭시\s*탭\s*(S|A)?\d*\s*(울트라|플러스|\+|Ultra|Plus|FE)?/i,
    ],
    modelPatterns: [
      /SM-[TX]\d+/i,              // 삼성 태블릿 모델
      /M[A-Z]\d{3}/i,             // 애플 모델번호
    ],
  },

  SMARTWATCH: {
    extractPatterns: [
      // 갤럭시 워치
      /갤럭시\s*워치\s*\d*\s*(울트라|클래식|Ultra|Classic)?/i,
      // 애플 워치
      /애플\s*워치\s*(울트라|SE|Ultra)?\s*(\d+)?/i,
      /Apple\s*Watch\s*(Ultra|SE)?\s*(Series\s*\d+)?/i,
      // 기타
      /핏빗|가민|Fitbit|Garmin/i,
    ],
    modelPatterns: [
      /SM-R\d+[A-Z]?/i,           // 삼성 워치 모델
    ],
    removePatterns: [
      /\d+mm/gi,                  // 크기 제거
    ],
  },

  EARPHONE: {
    extractPatterns: [
      // 에어팟
      /에어팟\s*(프로|맥스|Pro|Max)?\s*(\d+세대)?/i,
      /AirPods\s*(Pro|Max)?\s*(\d+)?/i,
      // 갤럭시 버즈
      /갤럭시\s*버즈\s*\d*\s*(프로|라이브|플러스|FE|Pro|Live|\+)?/i,
      // 소니
      /WF-?\d+XM\d/i,
      /WH-?\d+XM\d/i,
      // 기타 브랜드
      /프리버즈|FreeBuds/i,
      /자브라|Jabra/i,
      /젠하이저|Sennheiser/i,
      /보스|Bose/i,
    ],
    modelPatterns: [
      /SM-R\d+/i,                 // 삼성 이어폰 모델
      /MQD\d+/i,                  // 애플 모델번호
    ],
  },

  SPEAKER: {
    extractPatterns: [
      // JBL
      /JBL\s*(Flip|Charge|Xtreme|Go|PartyBox|Pulse)\s*\d*/i,
      // 보스
      /Bose\s*(SoundLink|Portable|Home)\s*\d*/i,
      /보스\s*사운드링크/i,
      // 소니
      /SRS-[A-Z]+\d+/i,
      // 하만카돈
      /하만카돈|Harman\s*Kardon/i,
      // 마샬
      /마샬|Marshall/i,
      // B&O
      /뱅앤올룹슨|Bang\s*&\s*Olufsen|B&O/i,
    ],
    modelPatterns: [
      /SRS-[A-Z]+\d+/i,           // 소니 스피커
    ],
  },

  MONITOR: {
    extractPatterns: [
      // LG 울트라기어
      /울트라기어|UltraGear/i,
      /울트라파인|UltraFine/i,
      // 삼성 오디세이
      /오디세이|Odyssey/i,
      // ASUS
      /ROG\s*Swift|ProArt|TUF\s*Gaming/i,
      // Dell
      /UltraSharp|Alienware/i,
      // 일반
      /\d+인치\s*모니터/,
    ],
    modelPatterns: [
      /\d+[A-Z]{2,}\d+[A-Z]?-?[A-Z]?/i,  // 일반 모니터 모델
      /[A-Z]{2}\d{2}[A-Z]+/i,             // LG 모델
    ],
    removePatterns: [
      /\d+인치/g,
      /\d+Hz/gi,
      /IPS|VA|TN/gi,
    ],
  },

  KEYBOARD_MOUSE: {
    extractPatterns: [
      // 로지텍 - 전체 제품명 추출 (세부 모델명 포함)
      /로지텍\s*G\s*Pro\s*X?\s*Superlight\s*\d*/i,
      /Logitech\s*G\s*Pro\s*X?\s*Superlight\s*\d*/i,
      /로지텍\s*G\s*Pro\s*X?(?!\s*Superlight)/i,  // Superlight 없는 G Pro
      /Logitech\s*G\s*Pro\s*X?(?!\s*Superlight)/i,
      /로지텍\s*MX\s*(Keys|Master|Anywhere)\s*\d*[A-Z]*/i,
      /Logitech\s*MX\s*(Keys|Master|Anywhere)\s*\d*[A-Z]*/i,
      /로지텍\s*G\d+/i,
      /Logitech\s*G\d+/i,
      // 레이저
      /Razer\s*(DeathAdder|Viper|Basilisk|BlackWidow|Huntsman)\s*\w*/i,
      /레이저\s*(데스에더|바이퍼|바실리스크|블랙위도우|헌츠맨)\s*\w*/i,
      // 스틸시리즈
      /SteelSeries\s*(Apex|Aerox|Prime|Rival)\s*\w*/i,
      /스틸시리즈/i,
      // 앱코
      /앱코|ABKO/i,
      // 레오폴드 - 전체 모델명 포함
      /레오폴드\s*FC\d+[A-Z]*/i,
      /Leopold\s*FC\d+[A-Z]*/i,
      // 리얼포스
      /리얼포스|Realforce/i,
      // 해피해킹
      /해피해킹|HHKB/i,
    ],
    modelPatterns: [
      /FC\d+[A-Z]*/i,                              // 레오폴드 모델
      /G\s*Pro\s*X?\s*(Superlight)?\s*\d*/i,       // 로지텍 G Pro
      /MX\s*(Keys|Master|Anywhere)\s*\d*[A-Z]*/i,  // 로지텍 MX
    ],
  },

  TV: {
    extractPatterns: [
      // 삼성
      /Neo\s*QLED|QLED|Crystal\s*UHD|The\s*(Frame|Serif|Sero)/i,
      /QN\d+[A-Z]/i,
      // LG
      /OLED\s*(evo)?|나노셀|NanoCell|QNED/i,
      // 소니
      /브라비아|BRAVIA/i,
      // 일반
      /\d+인치\s*(TV|티비)/i,
    ],
    modelPatterns: [
      /KQ?\d+[A-Z]+\d*[A-Z]*/i,   // 삼성 TV 모델
      /OLED\d+[A-Z]+/i,           // LG TV 모델
      /XR-?\d+[A-Z]+/i,           // 소니 TV 모델
    ],
    removePatterns: [
      /\d+인치/g,
      /스탠드형|벽걸이/g,
    ],
  },
};

/**
 * 제조사명 정규화
 */
function normalizeManufacturer(text: string): string {
  let result = text;
  for (const [original, normalized] of Object.entries(MANUFACTURER_NORMALIZE)) {
    result = result.replace(new RegExp(original, 'gi'), normalized);
  }
  return result;
}

/**
 * 공통 패턴 제거
 */
function removeCommonPatterns(text: string): string {
  let result = text;
  for (const pattern of COMMON_REMOVE_PATTERNS) {
    result = result.replace(pattern, ' ');
  }
  return result.replace(/\s+/g, ' ').trim();
}

/**
 * 카테고리별 핵심 제품명 추출
 */
function extractCoreProductName(text: string, category: Category): string | null {
  const rules = CATEGORY_RULES[category];
  if (!rules) return null;

  for (const pattern of rules.extractPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  return null;
}

/**
 * 모델번호 추출
 */
function extractModelNumber(text: string, category: Category): string | null {
  const rules = CATEGORY_RULES[category];
  if (!rules) return null;

  for (const pattern of rules.modelPatterns) {
    const match = text.match(pattern);
    if (match) {
      let model = match[0].trim();
      // 카테고리별 모델 정제
      if (rules.refineModel) {
        model = rules.refineModel(model);
      }
      return model;
    }
  }
  return null;
}

/**
 * 카테고리별 추가 패턴 제거
 */
function removeCategoryPatterns(text: string, category: Category): string {
  const rules = CATEGORY_RULES[category];
  if (!rules?.removePatterns) return text;

  let result = text;
  for (const pattern of rules.removePatterns) {
    result = result.replace(pattern, ' ');
  }
  return result.replace(/\s+/g, ' ').trim();
}

/**
 * 검색어 정제 메인 함수
 */
export function refineSearchQuery(
  query: string,
  category?: Category
): RefinedQuery {
  const original = query.trim();

  // 1. 제조사명 정규화
  let refined = normalizeManufacturer(original);

  // 2. 공통 패턴 제거
  refined = removeCommonPatterns(refined);

  // 3. 카테고리별 처리
  let extractedModel: string | undefined;
  let coreProduct: string | undefined;

  if (category) {
    // 카테고리별 추가 패턴 제거
    refined = removeCategoryPatterns(refined, category);

    // 핵심 제품명 추출
    coreProduct = extractCoreProductName(original, category) || undefined;

    // 모델번호 추출
    extractedModel = extractModelNumber(original, category) || undefined;
  }

  // 4. 최종 정리 (연속 공백 제거, 앞뒤 공백 제거)
  refined = refined.replace(/\s+/g, ' ').trim();

  // 5. fallback 생성 (더 단순화된 버전)
  let fallback: string | undefined;

  if (coreProduct) {
    // 핵심 제품명 사용
    // 모델번호가 이미 coreProduct에 포함되어 있는지 확인 (공백 제거 후 비교)
    const coreNormalized = coreProduct.toLowerCase().replace(/\s+/g, '');
    const modelNormalized = extractedModel?.toLowerCase().replace(/\s+/g, '') || '';

    // coreProduct에 모델번호가 이미 포함되어 있으면 추가하지 않음
    if (extractedModel && modelNormalized && !coreNormalized.includes(modelNormalized) && !modelNormalized.includes(coreNormalized.slice(-10))) {
      fallback = `${coreProduct} ${extractedModel}`.trim();
    } else {
      fallback = coreProduct;
    }
  } else if (extractedModel) {
    // 모델번호만
    fallback = extractedModel;
  } else {
    // 첫 2-3 단어만 사용
    const words = refined.split(' ').filter(w => w.length > 1);
    if (words.length > 3) {
      fallback = words.slice(0, 3).join(' ');
    }
  }

  return {
    original,
    refined,
    fallback,
    extractedModel,
    category,
  };
}

/**
 * 단계별 검색어 생성
 * 검색 결과가 없을 때 순차적으로 시도할 검색어 목록
 */
export function generateSearchQueries(
  query: string,
  category?: Category
): string[] {
  const result = refineSearchQuery(query, category);
  const queries: string[] = [];

  // 1단계: 정제된 검색어
  if (result.refined && result.refined !== result.original) {
    queries.push(result.refined);
  }

  // 2단계: fallback (더 단순화)
  if (result.fallback && result.fallback !== result.refined) {
    queries.push(result.fallback);
  }

  // 3단계: 핵심 제품명만
  if (result.extractedModel) {
    // 모델번호만으로 검색
    queries.push(result.extractedModel);
  }

  // 중복 제거
  return [...new Set(queries)];
}

/**
 * 검색어 정제 + 원본 포함 버전
 * 크롤러에서 사용 - 원본부터 시작해서 점점 단순화
 */
export function getSearchQueryCandidates(
  query: string,
  category?: Category
): string[] {
  const result = refineSearchQuery(query, category);
  const candidates: string[] = [];

  // 1단계: 정제된 검색어 (원본보다 간결하면 먼저)
  if (result.refined && result.refined.length < result.original.length * 0.8) {
    candidates.push(result.refined);
  }

  // 2단계: fallback
  if (result.fallback) {
    candidates.push(result.fallback);
  }

  // 3단계: 핵심 제품명만 (가장 단순화된 형태)
  const coreProduct = category
    ? extractCoreProductName(result.original, category)
    : null;
  if (coreProduct && !candidates.includes(coreProduct)) {
    candidates.push(coreProduct);
  }

  // 중복 제거
  return [...new Set(candidates.filter(q => q && q.length > 2))];
}

export default {
  refine: refineSearchQuery,
  generateQueries: generateSearchQueries,
  getCandidates: getSearchQueryCandidates,
};

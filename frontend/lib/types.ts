// ========== Enum 정의 ==========

// 제품 카테고리
export type Category = 'SMARTPHONE' | 'LAPTOP' | 'TABLET' | 'SMARTWATCH' | 'EARPHONE' | 'SPEAKER' | 'MONITOR' | 'KEYBOARD_MOUSE' | 'TV';

// 카테고리 한국어 레이블
export const CATEGORY_LABELS: Record<Category, string> = {
  SMARTPHONE: '스마트폰',
  LAPTOP: '노트북',
  TABLET: '태블릿',
  SMARTWATCH: '스마트워치',
  EARPHONE: '이어폰/헤드폰',
  SPEAKER: '블루투스 스피커',
  MONITOR: '모니터',
  KEYBOARD_MOUSE: '키보드/마우스',
  TV: 'TV',
};

// 카테고리 목록 (선택 UI용)
export const CATEGORIES: { code: Category; name: string }[] = [
  { code: 'SMARTPHONE', name: '스마트폰' },
  { code: 'LAPTOP', name: '노트북' },
  { code: 'TABLET', name: '태블릿' },
  { code: 'SMARTWATCH', name: '스마트워치' },
  { code: 'EARPHONE', name: '이어폰/헤드폰' },
  { code: 'SPEAKER', name: '블루투스 스피커' },
  { code: 'MONITOR', name: '모니터' },
  { code: 'KEYBOARD_MOUSE', name: '키보드/마우스' },
  { code: 'TV', name: 'TV' },
];

// 제품 상태
export type Condition = 'GOOD' | 'FAIR' | 'POOR';

// 상태 한국어 레이블
export const CONDITION_LABELS: Record<Condition, string> = {
  GOOD: '상',
  FAIR: '중',
  POOR: '하',
};

// 상태 목록 (선택 UI용)
export const CONDITIONS: { code: Condition; name: string; description: string }[] = [
  { code: 'GOOD', name: '상', description: '외관 깨끗, 기능 정상' },
  { code: 'FAIR', name: '중', description: '사용감 있음, 기능 정상' },
  { code: 'POOR', name: '하', description: '외관 손상 있음, 일부 기능 이상' },
];

// 플랫폼
export type Platform = 'BUNJANG' | 'JOONGONARA' | 'HELLOMARKET';

// 플랫폼 한국어 레이블
export const PLATFORM_LABELS: Record<Platform, string> = {
  BUNJANG: '번개장터',
  JOONGONARA: '중고나라',
  HELLOMARKET: '헬로마켓',
};

// ========== API 요청/응답 타입 ==========

// 가격 추천 요청
export interface PriceRecommendRequest {
  category: Category;
  productName: string;
  modelName?: string;
  condition: Condition;
}

// 시세 데이터 항목
export interface MarketDataItem {
  id: string;
  productName: string;
  modelName?: string;
  platform: Platform;
  price: number;
  condition?: string;
  originalUrl?: string;
  scrapedAt: string;
}

// 가격 추천 응답
export interface PriceRecommendResponse {
  id: string;
  category: Category;
  productName: string;
  modelName?: string;
  condition: Condition;
  recommendedPrice: number;
  priceMin: number;
  priceMax: number;
  marketDataSnapshot: MarketDataItem[];
  createdAt: string;
}

// 카테고리 목록 응답
export interface CategoriesResponse {
  categories: { code: Category; name: string }[];
}

// 회원가입 요청
export interface SignupRequest {
  email: string;
  password: string;
}

// 로그인 요청
export interface LoginRequest {
  email: string;
  password: string;
}

// 로그인 응답
export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

// 사용자 정보
export interface User {
  id: string;
  email: string;
  createdAt: string;
}

// 히스토리 목록 항목
export interface HistoryListItem {
  id: string;
  category: Category;
  productName: string;
  modelName?: string;
  condition: Condition;
  recommendedPrice: number;
  createdAt: string;
}

// 히스토리 목록 응답
export interface HistoryListResponse {
  items: HistoryListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 히스토리 상세 응답
export interface HistoryDetailResponse extends PriceRecommendResponse {
  images: ProductImage[];
}

// 제품 이미지
export interface ProductImage {
  id: string;
  imageUrl: string;
  uploadedAt: string;
}

// 이미지 업로드 응답
export interface ImageUploadResponse {
  key: string;
  url: string;
}

// ========== 북마크 타입 ==========

// 북마크 항목
export interface BookmarkItem {
  id: string;
  type: 'recommendation' | 'standalone';
  recommendationId: string | null;
  category: Category | null;
  categoryLabel: string | null;
  productName: string | null;
  modelName: string | null;
  condition: Condition | null;
  conditionLabel: string | null;
  recommendedPrice: number | null;
  priceMin: number | null;
  priceMax: number | null;
  memo: string | null;
  createdAt: string;
  recommendationCreatedAt: string | null;
}

// 북마크 목록 응답
export interface BookmarkListResponse {
  items: BookmarkItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 북마크 생성 요청
export interface CreateBookmarkRequest {
  recommendationId?: string;
  category?: Category;
  productName?: string;
  modelName?: string;
  memo?: string;
}

// 북마크 여부 확인 응답
export interface BookmarkCheckResponse {
  isBookmarked: boolean;
  bookmarkId: string | null;
}

// ========== 이미지 인식 타입 ==========

// 이미지 인식 결과
export interface RecognitionResult {
  category: Category | null;
  brand: string | null;
  productName: string | null;
  modelName: string | null;
  confidence: number;
  rawLabels: string[];
  rawTexts: string[];
}

// ========== API 에러 ==========

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}

// ========== 가격 알림 타입 ==========

// 알림 타입
export type NotificationType = 'PRICE_DROP' | 'PRICE_CHANGE' | 'SYSTEM';

// 알림 타입 라벨
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  PRICE_DROP: '목표가격 도달',
  PRICE_CHANGE: '가격 변동',
  SYSTEM: '시스템 알림',
};

// 가격 알림 항목
export interface PriceAlertItem {
  id: string;
  category: Category;
  categoryLabel: string;
  productName: string;
  modelName: string | null;
  condition: Condition;
  conditionLabel: string;
  targetPrice: number;
  currentPrice: number | null;
  priceDiff: number | null;
  priceReached: boolean;
  isActive: boolean;
  lastCheckedAt: string | null;
  notifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// 가격 알림 목록 응답
export interface AlertListResponse {
  items: PriceAlertItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 가격 알림 생성 요청
export interface CreateAlertRequest {
  category: Category;
  productName: string;
  modelName?: string;
  condition: Condition;
  targetPrice: number;
}

// 가격 알림 수정 요청
export interface UpdateAlertRequest {
  targetPrice?: number;
  isActive?: boolean;
}

// 알림 메시지 항목
export interface NotificationItem {
  id: string;
  type: NotificationType;
  typeLabel: string;
  title: string;
  message: string;
  data: unknown;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  alert: {
    id: string;
    category: Category;
    productName: string;
    modelName: string | null;
    targetPrice: number;
    currentPrice: number | null;
  } | null;
}

// 알림 메시지 목록 응답
export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ========== UI 상태 타입 ==========

// 로딩 상태
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// 폼 필드 에러
export type FormErrors<T> = Partial<Record<keyof T, string>>;

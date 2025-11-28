import type {
  PriceRecommendRequest,
  PriceRecommendResponse,
  CategoriesResponse,
  SignupRequest,
  LoginRequest,
  LoginResponse,
  User,
  HistoryListResponse,
  HistoryDetailResponse,
  ImageUploadResponse,
  ApiError,
  BookmarkItem,
  BookmarkListResponse,
  CreateBookmarkRequest,
  BookmarkCheckResponse,
  RecognitionResult,
} from './types';

// API 기본 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// 커스텀 에러 클래스
export class ApiException extends Error {
  public readonly status: number;
  public readonly data: ApiError;

  constructor(status: number, data: ApiError) {
    super(data.message || data.error);
    this.status = status;
    this.data = data;
    this.name = 'ApiException';
  }
}

// 요청 옵션 타입
interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

// 토큰 저장소 (클라이언트 사이드에서만 사용)
let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined' && !authToken) {
    authToken = localStorage.getItem('authToken');
  }
  return authToken;
}

// 기본 fetch 래퍼
async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  // URL 생성
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // 기본 헤더 설정
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // 인증 토큰 추가
  const token = getAuthToken();
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // 응답 본문 파싱
  const contentType = response.headers.get('content-type');
  let data: T | ApiError;

  if (contentType?.includes('application/json')) {
    data = await response.json();
  } else {
    data = { error: '응답 형식 오류', message: '서버에서 잘못된 응답을 반환했습니다.' } as ApiError;
  }

  // 에러 응답 처리
  if (!response.ok) {
    throw new ApiException(response.status, data as ApiError);
  }

  return data as T;
}

// ========== 가격 추천 API ==========

// 카테고리 목록 조회
export async function getCategories(): Promise<CategoriesResponse> {
  return request<CategoriesResponse>('/price/categories');
}

// 백엔드 응답 타입 (내부 사용)
  interface BackendPriceResponse {
    success: boolean;
    data: {
      id?: string;
      input: {
        category: string;
        categoryName: string;
        productName: string;
        modelName?: string;
        condition: string;
        conditionName: string;
      };
      recommendation: {
        recommendedPrice: number;
        priceMin: number;
        priceMax: number;
        averagePrice: number;
        medianPrice: number;
        confidence: string;
        sampleCount: number;
      };
      marketDataSnapshot: Array<{
        price: number;
        platform: string;
        condition?: string;
        originalUrl?: string;
        scrapedAt: string;
      }>;
      crawlStats: {
        totalItems: number;
        itemsByPlatform: Record<string, number>;
        crawlDuration: number;
      };
    };
  }

  // 가격 추천 요청
  export async function requestPriceRecommend(
    data: PriceRecommendRequest
  ): Promise<PriceRecommendResponse> {
    const response = await request<BackendPriceResponse>('/price/recommend', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // 백엔드 응답을 프론트엔드 형식으로 변환
    const { id, input, recommendation, marketDataSnapshot } = response.data;

    return {
      id: id || crypto.randomUUID(), // 로그인 사용자는 백엔드 ID, 비로그인은 임시 ID
      category: input.category as PriceRecommendResponse['category'],
      productName: input.productName,
      modelName: input.modelName,
      condition: input.condition as PriceRecommendResponse['condition'],
      recommendedPrice: recommendation.recommendedPrice,
      priceMin: recommendation.priceMin,
      priceMax: recommendation.priceMax,
      marketDataSnapshot: marketDataSnapshot.map((item, index) => ({
        id: `${index}`,
        productName: input.productName,
        modelName: input.modelName,
        platform: item.platform as 'BUNJANG' | 'JOONGONARA',
        price: item.price,
        condition: item.condition,
        originalUrl: item.originalUrl,
        scrapedAt: item.scrapedAt,
      })),
      createdAt: new Date().toISOString(),
    };
  }
// ========== 인증 API ==========

// 회원가입
export async function signup(data: SignupRequest): Promise<{ message: string }> {
  return request<{ message: string }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// 로그인
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // 토큰 저장
  setAuthToken(response.token);

  return response;
}

// 로그아웃
export function logout(): void {
  setAuthToken(null);
}

// 현재 사용자 정보 조회
export async function getCurrentUser(): Promise<User> {
  return request<User>('/auth/me');
}

// ========== 히스토리 API ==========

// 백엔드 히스토리 목록 응답 타입 (내부 사용)
interface BackendHistoryListResponse {
  success: boolean;
  data: {
    items: Array<{
      id: string;
      category: string;
      categoryLabel: string;
      productName: string;
      modelName?: string;
      condition: string;
      conditionLabel: string;
      recommendedPrice: number;
      priceMin: number;
      priceMax: number;
      createdAt: string;
    }>;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

// 히스토리 목록 조회
export async function getHistoryList(
  page: number = 1,
  limit: number = 10
): Promise<HistoryListResponse> {
  const response = await request<BackendHistoryListResponse>('/history', {
    params: { page, limit },
  });

  // 백엔드 응답을 프론트엔드 형식으로 변환
  return {
    items: response.data.items.map((item) => ({
      id: item.id,
      category: item.category as HistoryListResponse['items'][0]['category'],
      productName: item.productName,
      modelName: item.modelName,
      condition: item.condition as HistoryListResponse['items'][0]['condition'],
      recommendedPrice: item.recommendedPrice,
      createdAt: item.createdAt,
    })),
    total: response.data.pagination.totalCount,
    page: response.data.pagination.currentPage,
    limit: response.data.pagination.limit,
    totalPages: response.data.pagination.totalPages,
  };
}

// 백엔드 히스토리 상세 응답 타입 (내부 사용)
interface BackendHistoryDetailResponse {
  success: boolean;
  data: {
    id: string;
    category: string;
    categoryLabel: string;
    productName: string;
    modelName?: string;
    condition: string;
    conditionLabel: string;
    recommendedPrice: number;
    priceMin: number;
    priceMax: number;
    marketDataSnapshot: Array<{
      price: number;
      platform: string;
      condition?: string;
      originalUrl?: string;
      scrapedAt: string;
    }>;
    images: Array<{
      id: string;
      imageUrl: string;
      uploadedAt: string;
    }>;
    createdAt: string;
  };
}

// 히스토리 상세 조회
export async function getHistoryDetail(id: string): Promise<HistoryDetailResponse> {
  const response = await request<BackendHistoryDetailResponse>(`/history/${id}`);

  const { data } = response;

  return {
    id: data.id,
    category: data.category as HistoryDetailResponse['category'],
    productName: data.productName,
    modelName: data.modelName,
    condition: data.condition as HistoryDetailResponse['condition'],
    recommendedPrice: data.recommendedPrice,
    priceMin: data.priceMin,
    priceMax: data.priceMax,
    marketDataSnapshot: data.marketDataSnapshot.map((item, index) => ({
      id: `${index}`,
      productName: data.productName,
      modelName: data.modelName,
      platform: item.platform as 'BUNJANG' | 'JOONGONARA',
      price: item.price,
      condition: item.condition,
      originalUrl: item.originalUrl,
      scrapedAt: item.scrapedAt,
    })),
    images: data.images,
    createdAt: data.createdAt,
  };
}

// ========== 이미지 업로드 API ==========

// 이미지 업로드
export async function uploadImage(file: File): Promise<ImageUploadResponse> {
  const formData = new FormData();
  formData.append('image', file);

  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiException(response.status, data as ApiError);
  }

  // 백엔드 응답 형식: { success: true, data: { key, url } }
  return data.data as ImageUploadResponse;
}

// 이미지 삭제
export async function deleteImage(key: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/upload/${encodeURIComponent(key)}`, {
    method: 'DELETE',
  });
}

// ========== 헬스체크 API ==========

export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  return request<{ status: string; timestamp: string }>('/health');
}

// ========== 북마크 API ==========

// 백엔드 북마크 목록 응답 타입 (내부 사용)
interface BackendBookmarkListResponse {
  success: boolean;
  data: {
    items: BookmarkItem[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

// 백엔드 북마크 생성 응답 타입 (내부 사용)
interface BackendBookmarkCreateResponse {
  success: boolean;
  message: string;
  data: BookmarkItem;
}

// 백엔드 북마크 확인 응답 타입 (내부 사용)
interface BackendBookmarkCheckResponse {
  success: boolean;
  data: BookmarkCheckResponse;
}

// 북마크 목록 조회
export async function getBookmarkList(
  page: number = 1,
  limit: number = 10
): Promise<BookmarkListResponse> {
  const response = await request<BackendBookmarkListResponse>('/bookmarks', {
    params: { page, limit },
  });

  return {
    items: response.data.items,
    total: response.data.pagination.totalCount,
    page: response.data.pagination.currentPage,
    limit: response.data.pagination.limit,
    totalPages: response.data.pagination.totalPages,
  };
}

// 북마크 추가
export async function createBookmark(
  data: CreateBookmarkRequest
): Promise<BookmarkItem> {
  const response = await request<BackendBookmarkCreateResponse>('/bookmarks', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return response.data;
}

// 북마크 삭제
export async function deleteBookmark(id: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/bookmarks/${id}`, {
    method: 'DELETE',
  });
}

// 북마크 여부 확인
export async function checkBookmark(
  recommendationId: string
): Promise<BookmarkCheckResponse> {
  const response = await request<BackendBookmarkCheckResponse>(
    `/bookmarks/check/${recommendationId}`
  );

  return response.data;
}

// ========== 이미지 인식 API ==========

// 백엔드 인식 응답 타입 (내부 사용)
interface BackendRecognizeResponse {
  success: boolean;
  data: RecognitionResult;
}

// 이미지에서 제품 정보 인식
export async function recognizeProduct(
  imageUrl: string
): Promise<RecognitionResult> {
  const response = await request<BackendRecognizeResponse>('/recognize', {
    method: 'POST',
    body: JSON.stringify({ imageUrl }),
  });

  return response.data;
}

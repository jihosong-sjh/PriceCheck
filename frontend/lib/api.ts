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

// 가격 추천 요청
export async function requestPriceRecommend(
  data: PriceRecommendRequest
): Promise<PriceRecommendResponse> {
  return request<PriceRecommendResponse>('/price/recommend', {
    method: 'POST',
    body: JSON.stringify(data),
  });
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

// 히스토리 목록 조회
export async function getHistoryList(
  page: number = 1,
  limit: number = 10
): Promise<HistoryListResponse> {
  return request<HistoryListResponse>('/history', {
    params: { page, limit },
  });
}

// 히스토리 상세 조회
export async function getHistoryDetail(id: string): Promise<HistoryDetailResponse> {
  return request<HistoryDetailResponse>(`/history/${id}`);
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

  return data as ImageUploadResponse;
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

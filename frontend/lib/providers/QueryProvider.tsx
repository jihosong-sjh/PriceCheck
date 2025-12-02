'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  // useState를 사용하여 QueryClient 인스턴스 생성 (SSR 안전)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5분 동안 데이터를 fresh로 유지
            gcTime: 10 * 60 * 1000, // 10분 후 가비지 컬렉션
            retry: 1, // 실패 시 1회 재시도
            refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 리페치 비활성화
          },
          mutations: {
            retry: 0, // mutation은 재시도하지 않음
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

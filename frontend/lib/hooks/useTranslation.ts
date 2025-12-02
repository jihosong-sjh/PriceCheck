'use client';

/**
 * 클라이언트 컴포넌트용 번역 훅
 *
 * 현재는 기본 구조만 제공하며, 추후 next-intl 완전 통합 시 확장됩니다.
 *
 * 사용 예:
 * const { t } = useTranslation('price');
 * <h1>{t('title')}</h1>
 */

import { useCallback } from 'react';

// 한국어 메시지 (기본)
import koMessages from '@/messages/ko.json';

type Messages = typeof koMessages;
type Namespace = keyof Messages;

export function useTranslation<N extends Namespace>(namespace: N) {
  const messages = koMessages[namespace] as Messages[N];

  const t = useCallback(
    (key: keyof Messages[N], params?: Record<string, string | number>) => {
      let value = messages[key] as string;

      if (!value) {
        console.warn(`Translation missing: ${namespace}.${String(key)}`);
        return String(key);
      }

      // 파라미터 치환 (예: {count} -> 실제 값)
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          value = value.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
        });
      }

      return value;
    },
    [messages, namespace]
  );

  return { t };
}

// 간단한 번역 함수 (서버/클라이언트 공용)
export function getTranslation<N extends Namespace>(namespace: N, key: keyof Messages[N]) {
  const messages = koMessages[namespace] as Messages[N];
  return (messages[key] as string) || String(key);
}

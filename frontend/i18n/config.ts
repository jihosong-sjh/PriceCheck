/**
 * 다국어 지원 설정
 */

export const locales = ['ko', 'en', 'ja'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ko';

export const localeNames: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
};

// 언어 감지 및 설정을 위한 쿠키 이름
export const LOCALE_COOKIE = 'NEXT_LOCALE';

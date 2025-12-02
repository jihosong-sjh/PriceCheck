import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // 현재는 한국어만 지원하지만, 추후 확장 가능한 구조
  const locale = 'ko';

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

# PWA 아이콘 생성 가이드

## 필요한 아이콘 파일

manifest.json에서 참조하는 아이콘 파일들:

| 파일명 | 크기 | 용도 |
|--------|------|------|
| icon-72x72.png | 72x72 | Android 구형 기기 |
| icon-96x96.png | 96x96 | Android, 바로가기 |
| icon-128x128.png | 128x128 | Chrome Web Store |
| icon-144x144.png | 144x144 | iOS 구형 기기 |
| icon-152x152.png | 152x152 | iPad |
| icon-192x192.png | 192x192 | Android 기본 |
| icon-384x384.png | 384x384 | Android 스플래시 |
| icon-512x512.png | 512x512 | Android 마스커블 |
| shortcut-price.png | 96x96 | 가격 추천 바로가기 |
| shortcut-bookmark.png | 96x96 | 찜 목록 바로가기 |

## 아이콘 생성 도구

1. **온라인 도구**:
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator

2. **CLI 도구**:
   ```bash
   npm install -g pwa-asset-generator
   pwa-asset-generator logo.svg ./public/icons
   ```

3. **수동 생성**:
   - 512x512 원본 PNG 준비
   - Figma/Canva에서 각 크기로 export

## 디자인 가이드라인

- 배경: 투명 또는 브랜드 컬러 (#3B82F6)
- 아이콘: 계산기/가격표 모티브
- maskable 아이콘: 안전영역 80% 내에 핵심 요소 배치

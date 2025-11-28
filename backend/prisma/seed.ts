import { PrismaClient, Category, Condition, Platform } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('시드 데이터 생성 시작...');

  // 테스트용 시세 데이터 생성
  const marketDataSamples = [
    // 스마트폰 - iPhone 14 Pro
    {
      productName: 'iPhone 14 Pro',
      modelName: '128GB',
      platform: Platform.BUNJANG,
      price: 850000,
      condition: '상',
      originalUrl: 'https://bunjang.co.kr/products/123456789',
      scrapedAt: new Date(),
    },
    {
      productName: 'iPhone 14 Pro',
      modelName: '128GB',
      platform: Platform.JOONGONARA,
      price: 830000,
      condition: '상',
      originalUrl: 'https://cafe.naver.com/joonggonara/123456789',
      scrapedAt: new Date(),
    },
    {
      productName: 'iPhone 14 Pro',
      modelName: '256GB',
      platform: Platform.BUNJANG,
      price: 920000,
      condition: '상',
      originalUrl: 'https://bunjang.co.kr/products/123456790',
      scrapedAt: new Date(),
    },
    // 스마트폰 - Galaxy S24 Ultra
    {
      productName: 'Galaxy S24 Ultra',
      modelName: '256GB',
      platform: Platform.BUNJANG,
      price: 1100000,
      condition: '상',
      originalUrl: 'https://bunjang.co.kr/products/123456791',
      scrapedAt: new Date(),
    },
    {
      productName: 'Galaxy S24 Ultra',
      modelName: '256GB',
      platform: Platform.JOONGONARA,
      price: 1080000,
      condition: '중',
      originalUrl: 'https://cafe.naver.com/joonggonara/123456790',
      scrapedAt: new Date(),
    },
    // 노트북 - MacBook Air M2
    {
      productName: 'MacBook Air M2',
      modelName: '256GB',
      platform: Platform.BUNJANG,
      price: 1200000,
      condition: '상',
      originalUrl: 'https://bunjang.co.kr/products/123456792',
      scrapedAt: new Date(),
    },
    {
      productName: 'MacBook Air M2',
      modelName: '512GB',
      platform: Platform.JOONGONARA,
      price: 1400000,
      condition: '상',
      originalUrl: 'https://cafe.naver.com/joonggonara/123456791',
      scrapedAt: new Date(),
    },
    // 태블릿 - iPad Pro 11
    {
      productName: 'iPad Pro 11',
      modelName: '128GB WiFi',
      platform: Platform.BUNJANG,
      price: 750000,
      condition: '중',
      originalUrl: 'https://bunjang.co.kr/products/123456793',
      scrapedAt: new Date(),
    },
    // 스마트워치 - Apple Watch Ultra 2
    {
      productName: 'Apple Watch Ultra 2',
      modelName: '49mm',
      platform: Platform.BUNJANG,
      price: 950000,
      condition: '상',
      originalUrl: 'https://bunjang.co.kr/products/123456794',
      scrapedAt: new Date(),
    },
    // 이어폰 - AirPods Pro 2
    {
      productName: 'AirPods Pro 2',
      modelName: 'USB-C',
      platform: Platform.JOONGONARA,
      price: 200000,
      condition: '상',
      originalUrl: 'https://cafe.naver.com/joonggonara/123456792',
      scrapedAt: new Date(),
    },
  ];

  // 시세 데이터 삽입
  for (const data of marketDataSamples) {
    await prisma.marketData.create({ data });
  }
  console.log(`${marketDataSamples.length}개의 시세 데이터 생성 완료`);

  // 테스트 사용자 생성 (비밀번호: Test1234)
  // bcrypt 해시: $2a$10$... (실제 환경에서는 bcrypt로 해싱된 비밀번호 사용)
  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      // 테스트용 해시 비밀번호 (실제로는 bcrypt 해시 사용)
      password: '$2a$10$K.0HwpsoPDGaB/atFBmmXOGTw4ceeg33.WrxJx/HnYE.vIpz8.mRu',
    },
  });
  console.log(`테스트 사용자 생성 완료: ${testUser.email}`);

  // 테스트 가격 추천 기록 생성
  const testRecommendation = await prisma.priceRecommendation.create({
    data: {
      userId: testUser.id,
      category: Category.SMARTPHONE,
      productName: 'iPhone 14 Pro',
      modelName: '128GB',
      condition: Condition.GOOD,
      recommendedPrice: 840000,
      priceMin: 800000,
      priceMax: 880000,
      marketDataSnapshot: marketDataSamples.slice(0, 3),
    },
  });
  console.log(`테스트 가격 추천 기록 생성 완료: ${testRecommendation.id}`);

  console.log('시드 데이터 생성 완료!');
}

main()
  .catch((e) => {
    console.error('시드 데이터 생성 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

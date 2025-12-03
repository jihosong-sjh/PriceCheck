/**
 * 가격 알림 체커 작업
 * - 주기적으로 활성화된 알림을 확인
 * - 목표 가격에 도달하면 알림 생성
 */

import cron from 'node-cron';
import { crawlAllPlatforms } from '../services/crawler/index.js';
import { calculatePrice } from '../services/priceCalculator.js';
import type { Category, Condition } from '../utils/validators.js';
import prisma from '../lib/prisma.js';

// 알림 체크 간격 (분)
const CHECK_INTERVAL_MINUTES = 15;

// 한 번에 처리할 알림 수
const BATCH_SIZE = 5;

// 같은 알림에 대해 재알림 방지 시간 (시간)
const NOTIFICATION_COOLDOWN_HOURS = 24;

interface AlertCheckResult {
  alertId: string;
  success: boolean;
  currentPrice?: number;
  priceReached?: boolean;
  error?: string;
}

/**
 * 알림 체크 작업 실행
 */
async function checkPriceAlerts(): Promise<void> {
  console.log(`[PriceAlertJob] 알림 체크 시작: ${new Date().toISOString()}`);

  try {
    // 체크가 필요한 활성 알림 조회
    const cooldownTime = new Date();
    cooldownTime.setHours(cooldownTime.getHours() - NOTIFICATION_COOLDOWN_HOURS);

    const alerts = await prisma.priceAlert.findMany({
      where: {
        isActive: true,
        AND: [
          // 체크 간격 조건
          {
            OR: [
              { lastCheckedAt: null },
              {
                lastCheckedAt: {
                  lt: new Date(Date.now() - CHECK_INTERVAL_MINUTES * 60 * 1000),
                },
              },
            ],
          },
          // 최근 알림을 보낸 경우 제외
          {
            OR: [
              { notifiedAt: null },
              { notifiedAt: { lt: cooldownTime } },
            ],
          },
        ],
      },
      take: BATCH_SIZE,
      orderBy: { lastCheckedAt: 'asc' },
    });

    if (alerts.length === 0) {
      console.log('[PriceAlertJob] 체크할 알림이 없습니다.');
      return;
    }

    console.log(`[PriceAlertJob] ${alerts.length}개 알림 체크 중...`);

    // 알림별로 가격 체크
    const results: AlertCheckResult[] = [];

    for (const alert of alerts) {
      try {
        const result = await checkSingleAlert(alert);
        results.push(result);

        // 과도한 크롤링 방지를 위한 딜레이
        await delay(2000);
      } catch (error) {
        console.error(`[PriceAlertJob] 알림 ${alert.id} 체크 실패:`, error);
        results.push({
          alertId: alert.id,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // 결과 요약
    const successCount = results.filter((r) => r.success).length;
    const priceReachedCount = results.filter((r) => r.priceReached).length;

    console.log(
      `[PriceAlertJob] 완료: ${successCount}/${alerts.length} 성공, ` +
        `${priceReachedCount}개 목표가격 도달`
    );
  } catch (error) {
    console.error('[PriceAlertJob] 알림 체크 중 오류:', error);
  }
}

/**
 * 단일 알림 체크
 */
async function checkSingleAlert(alert: {
  id: string;
  userId: string;
  category: string;
  productName: string;
  modelName: string | null;
  condition: string;
  targetPrice: number;
}): Promise<AlertCheckResult> {
  console.log(`[PriceAlertJob] 알림 체크: ${alert.productName} (목표: ${alert.targetPrice}원)`);

  // 크롤링 실행 (간단 크롤링: 플랫폼당 10개만)
  const crawlResult = await crawlAllPlatforms(
    alert.productName,
    alert.modelName || undefined,
    alert.category as Category,
    {
      maxItemsPerPlatform: 10,
      timeout: 20000,
    }
  );

  if (crawlResult.items.length === 0) {
    // 데이터가 없어도 lastCheckedAt 업데이트
    await prisma.priceAlert.update({
      where: { id: alert.id },
      data: { lastCheckedAt: new Date() },
    });

    return {
      alertId: alert.id,
      success: true,
      error: '시세 데이터를 찾을 수 없습니다.',
    };
  }

  // 가격 계산
  const priceResult = calculatePrice(
    crawlResult.items,
    alert.condition as Condition,
    alert.category as Category
  );

  const currentPrice = priceResult.recommendedPrice;
  const priceReached = currentPrice <= alert.targetPrice;

  // 알림 정보 업데이트
  await prisma.priceAlert.update({
    where: { id: alert.id },
    data: {
      currentPrice,
      lastCheckedAt: new Date(),
      ...(priceReached && { notifiedAt: new Date() }),
    },
  });

  // 목표 가격 도달 시 알림 생성
  if (priceReached) {
    await createNotification(alert, currentPrice, priceResult);
    console.log(
      `[PriceAlertJob] 목표가격 도달! ${alert.productName}: ` +
        `현재 ${currentPrice}원 <= 목표 ${alert.targetPrice}원`
    );
  }

  return {
    alertId: alert.id,
    success: true,
    currentPrice,
    priceReached,
  };
}

/**
 * 알림 메시지 생성
 */
async function createNotification(
  alert: {
    id: string;
    userId: string;
    productName: string;
    modelName: string | null;
    targetPrice: number;
  },
  currentPrice: number,
  priceResult: { priceMin: number; priceMax: number; sampleCount: number }
): Promise<void> {
  const productDisplay = alert.modelName
    ? `${alert.productName} ${alert.modelName}`
    : alert.productName;

  const priceDiff = alert.targetPrice - currentPrice;
  const diffText =
    priceDiff > 0
      ? `목표가보다 ${priceDiff.toLocaleString()}원 저렴`
      : '목표가격에 도달';

  await prisma.notification.create({
    data: {
      userId: alert.userId,
      alertId: alert.id,
      type: 'PRICE_DROP',
      title: '목표 가격 도달!',
      message:
        `${productDisplay}의 현재 시세가 ${currentPrice.toLocaleString()}원입니다. ` +
        `(${diffText})`,
      data: {
        currentPrice,
        targetPrice: alert.targetPrice,
        priceMin: priceResult.priceMin,
        priceMax: priceResult.priceMax,
        sampleCount: priceResult.sampleCount,
      },
    },
  });
}

/**
 * 딜레이 유틸리티
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 알림 작업 시작
 */
export function startPriceAlertJob(): void {
  // 15분마다 실행 (*/15 * * * *)
  const cronExpression = `*/${CHECK_INTERVAL_MINUTES} * * * *`;

  cron.schedule(cronExpression, () => {
    checkPriceAlerts().catch((error) => {
      console.error('[PriceAlertJob] 스케줄 실행 오류:', error);
    });
  });

  console.log(
    `[PriceAlertJob] 가격 알림 체커 시작됨 (${CHECK_INTERVAL_MINUTES}분 간격)`
  );

  // 서버 시작 시 즉시 한 번 실행 (선택적)
  // checkPriceAlerts().catch(console.error);
}

/**
 * 수동 알림 체크 (테스트/디버깅용)
 */
export async function runManualCheck(): Promise<void> {
  console.log('[PriceAlertJob] 수동 알림 체크 실행');
  await checkPriceAlerts();
}

export default {
  start: startPriceAlertJob,
  runManualCheck,
};

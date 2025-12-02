/**
 * 브라우저 풀 관리자 (싱글톤 패턴)
 * Playwright 브라우저 인스턴스를 재사용하여 성능 최적화
 */

import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';

// 브라우저 풀 설정
interface BrowserPoolConfig {
  maxContexts: number;      // 최대 컨텍스트 수 (기본: 5)
  contextTimeout: number;   // 컨텍스트 타임아웃 (ms, 기본: 60000)
  launchOptions: {
    headless: boolean;
    args?: string[];
  };
}

const DEFAULT_CONFIG: BrowserPoolConfig = {
  maxContexts: 5,
  contextTimeout: 60000,
  launchOptions: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
    ],
  },
};

// 브라우저 풀 싱글톤
class BrowserPool {
  private static instance: BrowserPool | null = null;
  private browser: Browser | null = null;
  private activeContexts: Set<BrowserContext> = new Set();
  private config: BrowserPoolConfig;
  private initPromise: Promise<Browser> | null = null;
  private isShuttingDown: boolean = false;

  private constructor(config: Partial<BrowserPoolConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 싱글톤 인스턴스 가져오기
   */
  static getInstance(config?: Partial<BrowserPoolConfig>): BrowserPool {
    if (!BrowserPool.instance) {
      BrowserPool.instance = new BrowserPool(config);
    }
    return BrowserPool.instance;
  }

  /**
   * 브라우저 초기화 (지연 초기화)
   */
  private async initBrowser(): Promise<Browser> {
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }

    // 이미 초기화 중이면 대기
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        console.log('[BrowserPool] 브라우저 인스턴스 초기화 중...');
        this.browser = await chromium.launch(this.config.launchOptions);

        // 브라우저 연결 해제 시 자동 재연결 처리
        this.browser.on('disconnected', () => {
          console.log('[BrowserPool] 브라우저 연결 해제됨');
          this.browser = null;
          this.initPromise = null;
          this.activeContexts.clear();
        });

        console.log('[BrowserPool] 브라우저 인스턴스 준비 완료');
        return this.browser;
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  /**
   * 새 브라우저 컨텍스트 생성
   */
  async acquireContext(options?: {
    userAgent?: string;
    viewport?: { width: number; height: number };
    locale?: string;
  }): Promise<BrowserContext> {
    if (this.isShuttingDown) {
      throw new Error('브라우저 풀이 종료 중입니다');
    }

    // 최대 컨텍스트 수 체크
    if (this.activeContexts.size >= this.config.maxContexts) {
      console.warn('[BrowserPool] 최대 컨텍스트 수 도달, 대기 중...');
      // 가장 오래된 컨텍스트 대기 (최대 10초)
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (this.activeContexts.size >= this.config.maxContexts) {
        throw new Error('브라우저 컨텍스트 풀이 가득 찼습니다');
      }
    }

    const browser = await this.initBrowser();

    const context = await browser.newContext({
      userAgent: options?.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: options?.viewport || { width: 375, height: 667 },
      locale: options?.locale || 'ko-KR',
    });

    this.activeContexts.add(context);

    // 컨텍스트 타임아웃 설정
    const timeoutId = setTimeout(() => {
      this.releaseContext(context).catch(console.error);
    }, this.config.contextTimeout);

    // 컨텍스트 종료 시 타이머 정리
    context.on('close', () => {
      clearTimeout(timeoutId);
      this.activeContexts.delete(context);
    });

    return context;
  }

  /**
   * 새 페이지 생성 (컨텍스트 자동 관리)
   */
  async acquirePage(options?: {
    userAgent?: string;
    viewport?: { width: number; height: number };
    locale?: string;
    timeout?: number;
  }): Promise<{ page: Page; context: BrowserContext }> {
    const context = await this.acquireContext(options);
    const page = await context.newPage();

    if (options?.timeout) {
      page.setDefaultTimeout(options.timeout);
    }

    return { page, context };
  }

  /**
   * 컨텍스트 반환 (정리)
   */
  async releaseContext(context: BrowserContext): Promise<void> {
    try {
      if (this.activeContexts.has(context)) {
        this.activeContexts.delete(context);
        await context.close();
      }
    } catch (error) {
      console.error('[BrowserPool] 컨텍스트 정리 오류:', error);
    }
  }

  /**
   * 페이지 및 컨텍스트 반환
   */
  async releasePage(context: BrowserContext): Promise<void> {
    await this.releaseContext(context);
  }

  /**
   * 브라우저 풀 상태 조회
   */
  getStatus(): {
    isConnected: boolean;
    activeContexts: number;
    maxContexts: number;
  } {
    return {
      isConnected: this.browser?.isConnected() ?? false,
      activeContexts: this.activeContexts.size,
      maxContexts: this.config.maxContexts,
    };
  }

  /**
   * 모든 리소스 정리 (종료 시 호출)
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) return;

    this.isShuttingDown = true;
    console.log('[BrowserPool] 브라우저 풀 종료 중...');

    // 모든 컨텍스트 정리
    const closePromises = Array.from(this.activeContexts).map(ctx =>
      ctx.close().catch(console.error)
    );
    await Promise.all(closePromises);
    this.activeContexts.clear();

    // 브라우저 종료
    if (this.browser) {
      await this.browser.close().catch(console.error);
      this.browser = null;
    }

    this.initPromise = null;
    BrowserPool.instance = null;
    console.log('[BrowserPool] 브라우저 풀 종료 완료');
  }
}

// 프로세스 종료 시 브라우저 정리
const cleanup = async () => {
  const pool = BrowserPool.getInstance();
  await pool.shutdown();
};

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
process.on('beforeExit', cleanup);

// 브라우저 풀 인스턴스 내보내기
export const browserPool = BrowserPool.getInstance();

// 편의 함수들
export async function acquirePage(options?: {
  userAgent?: string;
  viewport?: { width: number; height: number };
  locale?: string;
  timeout?: number;
}): Promise<{ page: Page; context: BrowserContext }> {
  return browserPool.acquirePage(options);
}

export async function releasePage(context: BrowserContext): Promise<void> {
  return browserPool.releasePage(context);
}

export function getBrowserPoolStatus() {
  return browserPool.getStatus();
}

export default browserPool;

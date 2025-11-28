import { PrismaClient } from '@prisma/client';

// PrismaClient 타입 확장을 위한 글로벌 선언
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// PrismaClient 싱글톤 패턴
// 개발 환경에서 HMR(Hot Module Replacement)로 인한 중복 연결 방지
const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;

// 데이터베이스 연결 상태 확인
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// 데이터베이스 연결 종료 (앱 종료 시 호출)
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

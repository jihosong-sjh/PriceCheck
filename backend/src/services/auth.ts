/**
 * 인증 서비스
 * - 회원가입 (bcrypt 비밀번호 해싱)
 * - 로그인 (JWT 토큰 발급)
 * - 비밀번호 검증
 * - Refresh Token 관리
 * - 토큰 블랙리스트 관리
 */

import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

// JWT 설정
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '15m') as SignOptions['expiresIn']; // 액세스 토큰: 15분
const REFRESH_TOKEN_EXPIRES_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7', 10); // 리프레시 토큰: 7일

// 비밀번호 해싱 설정
const SALT_ROUNDS = 10;

/**
 * 사용자 정보 인터페이스 (비밀번호 제외)
 */
export interface UserInfo {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * JWT 페이로드 인터페이스
 */
export interface JwtPayload {
  userId: string;
  email: string;
}

/**
 * 인증 결과 인터페이스
 */
export interface AuthResult {
  user: UserInfo;
  accessToken: string;
  refreshToken: string;
}

/**
 * 토큰 갱신 결과 인터페이스
 */
export interface TokenRefreshResult {
  accessToken: string;
  refreshToken?: string; // 리프레시 토큰도 갱신된 경우
}

/**
 * 비밀번호를 해싱합니다.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 비밀번호를 검증합니다.
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * JWT 토큰을 생성합니다.
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * JWT 토큰을 검증하고 페이로드를 반환합니다.
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

/**
 * 회원가입
 * - 이메일 중복 확인
 * - 비밀번호 해싱
 * - 사용자 생성
 * - JWT 액세스 토큰 + 리프레시 토큰 발급
 */
export async function signup(email: string, password: string): Promise<AuthResult> {
  // 이메일 중복 확인
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError('이미 등록된 이메일입니다.', 409);
  }

  // 비밀번호 해싱
  const hashedPassword = await hashPassword(password);

  // 사용자 생성
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // JWT 액세스 토큰 생성
  const accessToken = generateToken({ userId: user.id, email: user.email });

  // 리프레시 토큰 생성 및 저장
  const refreshToken = generateRefreshToken();
  await saveRefreshToken(user.id, refreshToken);

  return { user, accessToken, refreshToken };
}

/**
 * 로그인
 * - 이메일로 사용자 조회
 * - 비밀번호 검증
 * - JWT 액세스 토큰 + 리프레시 토큰 발급
 */
export async function login(email: string, password: string): Promise<AuthResult> {
  // 사용자 조회
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // 보안: 이메일 존재 여부를 노출하지 않음
  if (!user) {
    throw new AppError('이메일 또는 비밀번호가 올바르지 않습니다.', 401);
  }

  // 비밀번호 검증
  const isValidPassword = await verifyPassword(password, user.password);

  if (!isValidPassword) {
    throw new AppError('이메일 또는 비밀번호가 올바르지 않습니다.', 401);
  }

  // JWT 액세스 토큰 생성
  const accessToken = generateToken({ userId: user.id, email: user.email });

  // 리프레시 토큰 생성 및 저장
  const refreshToken = generateRefreshToken();
  await saveRefreshToken(user.id, refreshToken);

  return {
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * 사용자 ID로 사용자 정보 조회
 */
export async function getUserById(userId: string): Promise<UserInfo | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

/**
 * 이메일로 사용자 조회 (존재 여부 확인용)
 */
export async function getUserByEmail(email: string): Promise<UserInfo | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

/**
 * 비밀번호 변경
 * - 현재 비밀번호 확인
 * - 새 비밀번호가 기존과 다른지 확인
 * - 비밀번호 업데이트
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  // 사용자 조회 (비밀번호 포함)
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('사용자를 찾을 수 없습니다.', 404);
  }

  // 현재 비밀번호 확인
  const isValidPassword = await verifyPassword(currentPassword, user.password);
  if (!isValidPassword) {
    throw new AppError('현재 비밀번호가 올바르지 않습니다.', 401);
  }

  // 새 비밀번호가 기존과 같은지 확인
  const isSamePassword = await verifyPassword(newPassword, user.password);
  if (isSamePassword) {
    throw new AppError('새 비밀번호는 현재 비밀번호와 달라야 합니다.', 400);
  }

  // 새 비밀번호 해싱 및 업데이트
  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
}

/**
 * 회원 탈퇴
 * - 비밀번호 확인
 * - 사용자 삭제 (Cascade로 관련 데이터 자동 삭제)
 */
export async function deleteAccount(userId: string, password: string): Promise<void> {
  // 사용자 조회 (비밀번호 포함)
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('사용자를 찾을 수 없습니다.', 404);
  }

  // 비밀번호 확인
  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) {
    throw new AppError('비밀번호가 올바르지 않습니다.', 401);
  }

  // 사용자 삭제 (Cascade로 Bookmark, PriceAlert, Notification 자동 삭제)
  await prisma.user.delete({
    where: { id: userId },
  });
}

// ============================================
// Refresh Token 관련 함수들
// ============================================

/**
 * 리프레시 토큰 생성
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * 리프레시 토큰 저장
 */
export async function saveRefreshToken(userId: string, token: string): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  await prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });
}

/**
 * 리프레시 토큰으로 새 액세스 토큰 발급
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenRefreshResult> {
  // 리프레시 토큰 조회
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!tokenRecord) {
    throw new AppError('유효하지 않은 리프레시 토큰입니다.', 401);
  }

  // 만료 확인
  if (tokenRecord.expiresAt < new Date()) {
    // 만료된 토큰 삭제
    await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
    throw new AppError('리프레시 토큰이 만료되었습니다. 다시 로그인해주세요.', 401);
  }

  // 이미 폐기된 토큰인지 확인
  if (tokenRecord.revokedAt) {
    throw new AppError('폐기된 리프레시 토큰입니다.', 401);
  }

  // 새 액세스 토큰 발급
  const accessToken = generateToken({
    userId: tokenRecord.user.id,
    email: tokenRecord.user.email,
  });

  // 리프레시 토큰 만료까지 1일 이하 남았으면 새 리프레시 토큰 발급
  const oneDayFromNow = new Date();
  oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

  let newRefreshToken: string | undefined;
  if (tokenRecord.expiresAt < oneDayFromNow) {
    // 기존 토큰 폐기
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    // 새 리프레시 토큰 생성
    newRefreshToken = generateRefreshToken();
    await saveRefreshToken(tokenRecord.user.id, newRefreshToken);
  }

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
}

/**
 * 로그아웃 (리프레시 토큰 폐기)
 */
export async function logout(refreshToken: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken },
    data: { revokedAt: new Date() },
  });
}

/**
 * 사용자의 모든 리프레시 토큰 폐기 (모든 기기에서 로그아웃)
 */
export async function logoutAll(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * 액세스 토큰을 블랙리스트에 추가
 */
export async function blacklistAccessToken(token: string, expiresAt: Date): Promise<void> {
  try {
    await prisma.tokenBlacklist.create({
      data: { token, expiresAt },
    });
  } catch {
    // 이미 블랙리스트에 있으면 무시
  }
}

/**
 * 액세스 토큰이 블랙리스트에 있는지 확인
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const record = await prisma.tokenBlacklist.findUnique({
    where: { token },
  });
  return !!record;
}

/**
 * 만료된 토큰들 정리 (정기 작업용)
 */
export async function cleanupExpiredTokens(): Promise<{ refreshTokens: number; blacklist: number }> {
  const now = new Date();

  // 만료된 리프레시 토큰 삭제
  const refreshResult = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: now } },
  });

  // 만료된 블랙리스트 토큰 삭제
  const blacklistResult = await prisma.tokenBlacklist.deleteMany({
    where: { expiresAt: { lt: now } },
  });

  return {
    refreshTokens: refreshResult.count,
    blacklist: blacklistResult.count,
  };
}

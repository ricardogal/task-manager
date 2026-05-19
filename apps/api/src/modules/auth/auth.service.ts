import { randomUUID } from "node:crypto";
import { authRepository } from "./auth.repository.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { sha256 } from "../../lib/hash.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt.js";
import { ConflictError, UnauthorizedError } from "../../lib/errors.js";
import { env } from "../../env.js";
import type { AuthResponse, LoginInput, SignupInput } from "@taskboard/shared";

function parseDurationToMs(s: string): number {
  const m = /^(\d+)([smhd])$/.exec(s);
  if (!m) throw new Error(`Duração inválida: ${s}`);
  const n = Number(m[1]);
  const unit = m[2];
  const mult = unit === "s" ? 1000 : unit === "m" ? 60_000 : unit === "h" ? 3_600_000 : 86_400_000;
  return n * mult;
}

async function issueTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
  const tokenId = randomUUID();
  const refreshToken = signRefreshToken({ userId, tokenId });
  const tokenHash = sha256(refreshToken);
  const expiresAt = new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_TTL));
  await authRepository.createRefreshToken({ userId, tokenHash, expiresAt });
  const accessToken = signAccessToken({ userId });
  return { accessToken, refreshToken };
}

export const authService = {
  async signup(input: SignupInput): Promise<AuthResponse> {
    const existing = await authRepository.findByEmailWithHash(input.email);
    if (existing) throw new ConflictError("Email já cadastrado");

    const passwordHash = await hashPassword(input.password);
    const user = await authRepository.createUser({
      email: input.email,
      name: input.name,
      passwordHash,
    });
    const tokens = await issueTokens(user.id);
    return { user, ...tokens };
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await authRepository.findByEmailWithHash(input.email);
    if (!user) throw new UnauthorizedError("Credenciais inválidas");

    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedError("Credenciais inválidas");

    const tokens = await issueTokens(user.id);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      ...tokens,
    };
  },

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = sha256(refreshToken);
    const stored = await authRepository.findRefreshTokenByHash(tokenHash);

    if (!stored) {
      throw new UnauthorizedError("Refresh token inválido");
    }

    if (stored.revokedAt) {
      // reuso detectado — revoga todos os tokens do user
      await authRepository.revokeAllUserRefreshTokens(payload.userId);
      throw new UnauthorizedError("Refresh token reutilizado, sessão revogada");
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedError("Refresh token expirado");
    }

    await authRepository.revokeRefreshToken(stored.id);

    const user = await authRepository.findById(payload.userId);
    if (!user) throw new UnauthorizedError("Usuário não encontrado");

    const tokens = await issueTokens(user.id);
    return { user, ...tokens };
  },

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = sha256(refreshToken);
    const stored = await authRepository.findRefreshTokenByHash(tokenHash);
    if (stored && !stored.revokedAt) {
      await authRepository.revokeRefreshToken(stored.id);
    }
  },
};

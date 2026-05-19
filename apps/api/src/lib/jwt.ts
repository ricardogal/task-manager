import jwt from "jsonwebtoken";
import { env } from "../env.js";
import { UnauthorizedError } from "./errors.js";

export interface AccessPayload {
  userId: string;
  type: "access";
}

export interface RefreshPayload {
  userId: string;
  tokenId: string;
  type: "refresh";
}

export function signAccessToken(input: { userId: string }): string {
  const payload: AccessPayload = { userId: input.userId, type: "access" };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_TTL } as jwt.SignOptions);
}

export function signRefreshToken(input: { userId: string; tokenId: string }): string {
  const payload: RefreshPayload = {
    userId: input.userId,
    tokenId: input.tokenId,
    type: "refresh",
  };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_REFRESH_TTL } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & AccessPayload;
    if (decoded.type !== "access") throw new UnauthorizedError("Token inválido");
    return { userId: decoded.userId, type: "access" };
  } catch {
    throw new UnauthorizedError("Token inválido ou expirado");
  }
}

export function verifyRefreshToken(token: string): RefreshPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & RefreshPayload;
    if (decoded.type !== "refresh") throw new UnauthorizedError("Refresh token inválido");
    return { userId: decoded.userId, tokenId: decoded.tokenId, type: "refresh" };
  } catch {
    throw new UnauthorizedError("Refresh token inválido ou expirado");
  }
}

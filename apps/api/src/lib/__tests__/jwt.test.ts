import { describe, expect, it } from "vitest";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../jwt.js";

describe("jwt", () => {
  it("access token roundtrip", () => {
    const token = signAccessToken({ userId: "u1" });
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe("u1");
    expect(decoded.type).toBe("access");
  });

  it("refresh token roundtrip", () => {
    const token = signRefreshToken({ userId: "u1", tokenId: "t1" });
    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe("u1");
    expect(decoded.tokenId).toBe("t1");
    expect(decoded.type).toBe("refresh");
  });

  it("verifyAccess rejeita refresh", () => {
    const refresh = signRefreshToken({ userId: "u1", tokenId: "t1" });
    expect(() => verifyAccessToken(refresh)).toThrow();
  });

  it("verifyRefresh rejeita access", () => {
    const access = signAccessToken({ userId: "u1" });
    expect(() => verifyRefreshToken(access)).toThrow();
  });
});

import { describe, expect, it } from "vitest";
import { sha256 } from "../hash.js";

describe("sha256", () => {
  it("produz hex de 64 chars", () => {
    expect(sha256("abc").length).toBe(64);
  });

  it("é determinístico", () => {
    expect(sha256("xyz")).toBe(sha256("xyz"));
  });

  it("muda com input diferente", () => {
    expect(sha256("a")).not.toBe(sha256("b"));
  });
});

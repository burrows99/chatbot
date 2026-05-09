import { expect, test } from "@playwright/test";
import { findTokenHeaders } from "@/lib/ai/mcp/headers";

test.describe("findTokenHeaders", () => {
  test("returns empty list when headers are undefined", () => {
    expect(findTokenHeaders(undefined)).toEqual([]);
  });

  test("returns empty list when headers contain no token-like entries", () => {
    expect(
      findTokenHeaders({ "Content-Type": "application/json", Accept: "*/*" })
    ).toEqual([]);
  });

  test("detects Authorization Bearer header and extracts the scheme + secret", () => {
    const result = findTokenHeaders({
      Authorization: "Bearer github_pat_abc123",
    });
    expect(result).toEqual([
      {
        name: "Authorization",
        scheme: "Bearer",
        secret: "github_pat_abc123",
      },
    ]);
  });

  test("detects Authorization Basic and Token schemes", () => {
    const result = findTokenHeaders({
      Authorization: "Basic dXNlcjpwYXNz",
    });
    expect(result[0]?.scheme).toBe("Basic");
    expect(result[0]?.secret).toBe("dXNlcjpwYXNz");

    const tokenResult = findTokenHeaders({
      Authorization: "Token abc123",
    });
    expect(tokenResult[0]?.scheme).toBe("Token");
    expect(tokenResult[0]?.secret).toBe("abc123");
  });

  test("detects api key style headers without a scheme prefix", () => {
    const result = findTokenHeaders({ "X-Api-Key": "sk-abcdef" });
    expect(result).toEqual([
      { name: "X-Api-Key", scheme: null, secret: "sk-abcdef" },
    ]);
  });

  test("returns multiple token entries for multiple sensitive headers", () => {
    const result = findTokenHeaders({
      Authorization: "Bearer abc",
      "X-Api-Token": "xyz",
      "Content-Type": "application/json",
    });
    expect(result).toHaveLength(2);
    const names = result.map((h: { name: string }) => h.name).sort();
    expect(names).toEqual(["Authorization", "X-Api-Token"]);
  });
});

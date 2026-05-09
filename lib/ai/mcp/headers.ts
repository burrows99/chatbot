export type TokenHeader = {
  name: string;
  scheme: "Bearer" | "Basic" | "Token" | null;
  secret: string;
};

const SCHEMES = ["Bearer", "Basic", "Token"] as const;
const TOKEN_NAME_RE = /authorization|api[-_]?key|token|secret/i;

export function findTokenHeaders(
  headers?: Record<string, string>
): TokenHeader[] {
  if (!headers) {
    return [];
  }
  const result: TokenHeader[] = [];
  for (const [name, raw] of Object.entries(headers)) {
    const value = raw ?? "";
    const scheme = SCHEMES.find((s) => value.startsWith(`${s} `));
    if (scheme) {
      result.push({ name, scheme, secret: value.slice(scheme.length + 1) });
      continue;
    }
    if (TOKEN_NAME_RE.test(name)) {
      result.push({ name, scheme: null, secret: value });
    }
  }
  return result;
}

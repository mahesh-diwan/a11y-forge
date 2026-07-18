export function buildSecurityHeaders(env: string, _nonce?: string): Headers {
  const h = new Headers();

  const evalPolicy = env === "development" ? " 'unsafe-eval'" : "";

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${evalPolicy}`,
    `style-src 'self' 'unsafe-inline'`,
    "img-src 'self' data: https:",
    "connect-src 'self' api.openai.com api.github.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
  h.set("Content-Security-Policy", csp);
  h.set("X-Frame-Options", "DENY");
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (env === "production") {
    h.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains",
    );
  }
  return h;
}

/**
 * Build security headers including Content-Security-Policy.
 *
 * CSP note: Next.js 16 with Turbopack injects inline <script> chunks and
 * <style> elements for CSS modules at build/runtime. Removing 'unsafe-inline'
 * entirely breaks hot-reload and CSS injection. We mitigate via:
 * - 'strict-dynamic' for scripts (trust propagates from nonced entry)
 * - object-src 'none', base-uri 'self', form-action 'self' (narrow attack surface)
 * - nonce parameter for use with next/script or custom script tags
 *
 * When Turbopack supports nonce propagation, switch both to nonce-based policy.
 */
export function buildSecurityHeaders(env: string, nonce?: string): Headers {
  const h = new Headers();

  const scriptNonce = nonce ? `'nonce-${nonce}'` : "'unsafe-inline'";
  const styleNonce = nonce ? `'nonce-${nonce}'` : "'unsafe-inline'";

  const csp = [
    "default-src 'self'",
    `script-src 'self' ${scriptNonce} 'strict-dynamic'`,
    `style-src 'self' ${styleNonce}`,
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

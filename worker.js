const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; " +
    "img-src 'self' data: https://www.google-analytics.com; " +
    "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "font-src 'self'; " +
    "frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

function addSecurityHeaders(response) {
  const res = new Response(response.body, response);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
  return res;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Clean URLs: /series/japan → serves series.html?s=japan
    const match = url.pathname.match(/^\/series\/(japan|lanzarote|elsewhere)\/?$/i);
    if (match) {
      const rewritten = new URL(request.url);
      rewritten.pathname = '/series.html';
      rewritten.searchParams.set('s', match[1].toLowerCase());
      const response = await env.ASSETS.fetch(new Request(rewritten.toString(), request));
      return addSecurityHeaders(response);
    }

    const response = await env.ASSETS.fetch(request);
    return addSecurityHeaders(response);
  }
};

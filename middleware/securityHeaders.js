// security headers (helmet-style, hand-rolled so no extra dependency)

function securityHeaders(req, res, next) {
  // stop browsers from sniffing the wrong mime type
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // basic clickjacking protection
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // legacy XSS filter (still respected by older browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // limit referrer info leak to other origins
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // disable unused powerful APIs
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // cache control for API responses (HTML page is allowed to cache)
  if (req.path && req.path.indexOf('/api/') === 0) {
    res.setHeader('Cache-Control', 'no-store');
  }

  // HSTS only when actually served over HTTPS - otherwise it's noise
  // express sets req.secure when behind a trusted proxy with x-forwarded-proto=https
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }

  // Content Security Policy
  // the SPA uses inline scripts and inline styles, so we keep them allowed
  // but everything else is locked down to same-origin + the photo CDNs we use
  if (req.path && !req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "img-src 'self' data: https:",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "font-src 'self' data:",
        "connect-src 'self'",
        "frame-ancestors 'self'",
        "base-uri 'self'",
        "object-src 'none'"
      ].join('; ')
    );
  }

  next();
}

module.exports = securityHeaders;

// 安全相关的 HTTP 头（自己手写，省得装 helmet）

function securityHeaders(req, res, next) {
  // 防止浏览器猜错文件类型
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // 防止页面被嵌进 iframe
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // 老浏览器的 XSS 过滤
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // 减少 referrer 信息泄露
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // 禁掉用不到的浏览器能力
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // API 响应不要缓存
  if (req.path && req.path.indexOf('/api/') === 0) {
    res.setHeader('Cache-Control', 'no-store');
  }

  // HTTPS 才加 HSTS，HTTP 加了没用
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }

  // CSP：SPA 里用了 inline script/style，所以放过这两个，其他都锁同源
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

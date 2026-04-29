// 简单的内存限流：同一个 IP 短时间内请求太多就 429

function makeLimiter(opts) {
  const windowMs = opts.windowMs || 60 * 1000;
  const max = opts.max || 60;
  const message = opts.message || 'Too many requests, please slow down';
  const buckets = new Map(); // ip -> [时间戳列表]

  // 每分钟清一下太老的记录，免得内存涨
  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [ip, arr] of buckets.entries()) {
      const fresh = arr.filter(t => t > cutoff);
      if (fresh.length === 0) buckets.delete(ip);
      else buckets.set(ip, fresh);
    }
  }, 60 * 1000).unref();

  return function (req, res, next) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const cutoff = now - windowMs;
    const arr = (buckets.get(ip) || []).filter(t => t > cutoff);
    if (arr.length >= max) {
      res.set('Retry-After', Math.ceil(windowMs / 1000));
      return res.status(429).json({ success: false, message });
    }
    arr.push(now);
    buckets.set(ip, arr);
    next();
  };
}

module.exports = { makeLimiter };

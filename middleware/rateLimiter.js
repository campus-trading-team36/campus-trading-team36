// simple in-memory rate limiter
// blocks an IP if it exceeds N requests in a sliding window

function makeLimiter(opts) {
  const windowMs = opts.windowMs || 60 * 1000;
  const max = opts.max || 60;
  const message = opts.message || 'Too many requests, please slow down';
  const buckets = new Map(); // ip -> [timestamps]

  // sweep old entries every minute to keep memory bounded
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

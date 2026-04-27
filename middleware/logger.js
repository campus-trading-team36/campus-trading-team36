// simple request logger - writes one line per request to stdout

function logger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const ip = req.ip || req.connection.remoteAddress || '-';
    const userId = (req.user && req.user.id) || '-';
    // skip noisy static asset hits
    if (req.path && req.path.startsWith('/uploads/')) return;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms ip=${ip} user=${userId}`
    );
  });
  next();
}

module.exports = logger;

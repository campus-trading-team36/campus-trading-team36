// 简单的请求日志：每个请求打一行

function logger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const ip = req.ip || req.connection.remoteAddress || '-';
    const userId = (req.user && req.user.id) || '-';
    // 静态图片就不打了，太吵
    if (req.path && req.path.startsWith('/uploads/')) return;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms ip=${ip} user=${userId}`
    );
  });
  next();
}

module.exports = logger;

// 全局错误处理：把抛出的异常转成 JSON 返回

const multer = require('multer');

function notFound(req, res, next) {
  if (req.path && req.path.indexOf('/api/') === 0) {
    return res.status(404).json({ success: false, message: 'Endpoint not found' });
  }
  next();
}

function errorHandler(err, req, res, next) {
  // multer 的错误单独处理一下，让提示更友好
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large (max 5 MB per image)' });
    }
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ success: false, message: 'Too many files (max 5 images)' });
    }
    return res.status(400).json({ success: false, message: 'Upload error: ' + err.message });
  }

  // 客户端传的不是合法 JSON
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON body' });
  }

  // body 太大
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request body too large' });
  }

  console.error('[Error]', err.message, err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : (err.message || 'Internal server error')
  });
}

module.exports = { notFound, errorHandler };

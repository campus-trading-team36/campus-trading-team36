module.exports = {
  port: parseInt(process.env.PORT) || 8080,
  host: process.env.HOST || '0.0.0.0',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxImagesPerProduct: 5
};

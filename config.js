// 应用配置
// 所有项都可以用环境变量覆盖，部署生产时改 .env 就行

module.exports = {
  port: parseInt(process.env.PORT) || 8080,
  host: process.env.HOST || '0.0.0.0',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  maxImagesPerProduct: parseInt(process.env.MAX_IMAGES_PER_PRODUCT) || 5,
  emailDomains: (process.env.EMAIL_DOMAINS || 'liverpool.ac.uk,student.liverpool.ac.uk').split(','),
  // 默认管理员账号（生产环境记得用 env 覆盖密码）
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@liverpool.ac.uk',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    username: process.env.ADMIN_USERNAME || 'admin'
  },
  // 商品默认要审核，MODERATION=off 可以关掉（演示/开发用）
  moderationEnabled: (process.env.MODERATION || 'on').toLowerCase() !== 'off',
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || '1mb'
};

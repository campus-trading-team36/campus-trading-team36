// app config - all values overridable via environment variables

module.exports = {
  port: parseInt(process.env.PORT) || 8080,
  host: process.env.HOST || '0.0.0.0',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  maxImagesPerProduct: parseInt(process.env.MAX_IMAGES_PER_PRODUCT) || 5,
  emailDomains: (process.env.EMAIL_DOMAINS || 'liverpool.ac.uk,student.liverpool.ac.uk').split(','),
  // admin seed credentials - override in production via env
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@liverpool.ac.uk',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    username: process.env.ADMIN_USERNAME || 'admin'
  },
  // products go through admin moderation by default
  // set MODERATION=off to auto-approve (useful for demo/dev)
  moderationEnabled: (process.env.MODERATION || 'on').toLowerCase() !== 'off',
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || '1mb'
};

// 服务器入口：启动 HTTP 监听 + 处理优雅关闭

const app = require('./app');
const config = require('./config');
const { flushSessions } = require('./middleware/auth');
const { flushAllSync } = require('./utils/atomicWrite');
const { flushPendingViews } = require('./services/productService');

const server = app.listen(config.port, config.host, () => {
  console.log('=================================');
  console.log(' Campus Trading Platform');
  console.log(` http://localhost:${config.port}`);
  console.log('=================================');
  console.log(` Admin email: ${config.admin.email}`);
  if ((process.env.ADMIN_PASSWORD || '') === '') {
    console.log(' Admin password: admin123 (default - change ADMIN_PASSWORD in production)');
  }
  console.log(` Moderation: ${config.moderationEnabled ? 'on (new listings need admin approval)' : 'off'}`);
  console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log('=================================');
});

server.keepAliveTimeout = 65 * 1000;
server.headersTimeout = 70 * 1000;

let shuttingDown = false;
function shutdown(sig) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n[Server] received ${sig}, shutting down...`);

  server.close(() => {
    try { flushPendingViews(); } catch (e) { console.error('[Shutdown] flushPendingViews:', e.message); }
    try { flushAllSync(); }    catch (e) { console.error('[Shutdown] flushAllSync:', e.message); }
    try { flushSessions(); }   catch (e) { console.error('[Shutdown] flushSessions:', e.message); }
    console.log('[Server] clean shutdown complete');
    process.exit(0);
  });
  setTimeout(() => {
    console.warn('[Server] force exit after timeout');
    process.exit(1);
  }, 10 * 1000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err && err.stack ? err.stack : err);
});

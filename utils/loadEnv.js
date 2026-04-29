// 简单的 .env 加载器，省得装 dotenv
// 读项目根目录下的 .env，按 KEY=VALUE 解析
// 已经在 process.env 里的不会被覆盖

const fs = require('fs');
const path = require('path');

function loadEnv() {
  const file = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(file)) return false;
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (e) {
    console.warn('[env] could not read .env:', e.message);
    return false;
  }
  const lines = raw.split(/\r?\n/);
  let count = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    // 去掉两边的引号
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!key) continue;
    if (process.env[key] === undefined) {
      process.env[key] = val;
      count++;
    }
  }
  if (count > 0) console.log(`[env] loaded ${count} variable(s) from .env`);
  return true;
}

module.exports = loadEnv;

// jest setup - runs before any test file
// uses an isolated SQLite database per test run, archives the legacy data.json
// so test runs don't pollute dev data and dev runs don't pollute the test db.

const path = require('path');
const fs = require('fs');

process.env.NODE_ENV = 'test';
process.env.MODERATION = 'off'; // tests want products available immediately
process.env.PORT = '0';
// dedicated test db file - removed at the start of every run
process.env.DB_FILE = path.join(__dirname, '..', 'data.test.db');

// nuke the previous test db so each run starts clean
const dbFile = process.env.DB_FILE;
for (const ext of ['', '-wal', '-shm']) {
  try { fs.unlinkSync(dbFile + ext); } catch {}
}

// silence noisy console output during tests
const noop = () => {};
console.log = noop;
console.warn = noop;

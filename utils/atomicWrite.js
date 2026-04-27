// atomic JSON write with simple write queue
// avoids data corruption when two requests trigger save() at the same time
// also keeps a small ring of backups so we can recover from a bad write

const fs = require('fs');
const path = require('path');

const queues = new Map(); // file -> { running, pending, latest, backupCount, lastBackup }
const BACKUP_KEEP = 3;
const BACKUP_INTERVAL_MS = 5 * 60 * 1000; // at most one backup every 5 minutes per file

function writeAtomic(filePath, content) {
  return new Promise((resolve, reject) => {
    const tmp = filePath + '.tmp.' + process.pid + '.' + Date.now();
    fs.writeFile(tmp, content, 'utf8', err => {
      if (err) return reject(err);
      fs.rename(tmp, filePath, err2 => {
        if (err2) {
          fs.unlink(tmp, () => {});
          return reject(err2);
        }
        resolve();
      });
    });
  });
}

// rotate backups: keep file.bak.1 ... file.bak.N (1 = newest)
function rotateBackup(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;
    // shift existing backups
    for (let i = BACKUP_KEEP - 1; i >= 1; i--) {
      const src = `${filePath}.bak.${i}`;
      const dst = `${filePath}.bak.${i + 1}`;
      if (fs.existsSync(src)) {
        try { fs.renameSync(src, dst); } catch (_) {}
      }
    }
    // copy current to .bak.1
    fs.copyFileSync(filePath, `${filePath}.bak.1`);
  } catch (e) {
    console.warn('[DB] backup rotate failed:', e.message);
  }
}

function getQueue(filePath) {
  let q = queues.get(filePath);
  if (!q) {
    q = { running: false, pending: false, latest: null, lastBackup: 0 };
    queues.set(filePath, q);
  }
  return q;
}

// queue saves per file so a stream of save() calls coalesces nicely
function enqueueSave(filePath, getContent) {
  const q = getQueue(filePath);
  q.latest = getContent;
  if (q.running) {
    q.pending = true;
    return;
  }
  q.running = true;

  const runOnce = () => {
    const fn = q.latest;
    q.latest = null;
    q.pending = false;

    // backup before write, throttled so we don't spam disk
    const now = Date.now();
    if (now - q.lastBackup > BACKUP_INTERVAL_MS) {
      rotateBackup(filePath);
      q.lastBackup = now;
    }

    Promise.resolve()
      .then(() => writeAtomic(filePath, fn()))
      .catch(e => console.error('[DB] atomic save failed:', e.message))
      .then(() => {
        if (q.pending) {
          runOnce();
        } else {
          q.running = false;
        }
      });
  };
  runOnce();
}

// synchronous fallback used during init - safe because no concurrency at startup
function writeSyncAtomic(filePath, content) {
  const tmp = filePath + '.tmp.init';
  fs.writeFileSync(tmp, content, 'utf8');
  fs.renameSync(tmp, filePath);
}

// flush any queued writes synchronously - used on graceful shutdown so no data is lost
function flushAllSync() {
  for (const [filePath, q] of queues.entries()) {
    if (q.latest) {
      try {
        const content = q.latest();
        writeSyncAtomic(filePath, content);
        q.latest = null;
        q.pending = false;
        console.log('[DB] flushed pending write for', path.basename(filePath));
      } catch (e) {
        console.error('[DB] flush failed for', filePath, ':', e.message);
      }
    }
  }
}

module.exports = { enqueueSave, writeSyncAtomic, flushAllSync };

/**
 * db.js — Pure-JS SQLite via sql.js (no native binaries needed)
 * Exposes the same callback API as sqlite3: db.run, db.get, db.all
 */

const path = require('path');
const fs   = require('fs');
const initSqlJs = require('sql.js');

const dbPath = path.join(__dirname, 'jusbooks.db');

// Shared db instance (set after init)
let _db = null;

// Auto-save the DB file after every write
function persist() {
  try {
    const data = _db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  } catch (e) {
    console.error('[db] persist error:', e.message);
  }
}

// Load or create DB synchronously by blocking until ready
// We expose a promise so setup.js can await it if needed
const ready = initSqlJs().then(SQL => {
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    _db = new SQL.Database(fileBuffer);
  } else {
    _db = new SQL.Database();
  }
  // Enable foreign keys
  _db.run('PRAGMA foreign_keys = ON');
  console.log('Connected to SQLite database.');
  return _db;
});

// ── Compatibility shim: same API as sqlite3 ──────────────────────────────────

const db = {
  ready,

  run(sql, params, callback) {
    if (typeof params === 'function') { callback = params; params = []; }
    if (!callback) callback = () => {};
    ready.then(() => {
      try {
        _db.run(sql, params);
        persist();
        // Mimic sqlite3's `this` context with lastID / changes
        const lastID = _db.exec('SELECT last_insert_rowid() AS id')[0]?.values[0][0] || 0;
        callback.call({ lastID, changes: 1 }, null);
      } catch (e) {
        callback.call({ lastID: 0, changes: 0 }, e);
      }
    });
  },

  get(sql, params, callback) {
    if (typeof params === 'function') { callback = params; params = []; }
    ready.then(() => {
      try {
        const stmt = _db.prepare(sql);
        stmt.bind(params);
        const row = stmt.step() ? stmt.getAsObject() : null;
        stmt.free();
        callback(null, row);
      } catch (e) {
        callback(e, null);
      }
    });
  },

  all(sql, params, callback) {
    if (typeof params === 'function') { callback = params; params = []; }
    ready.then(() => {
      try {
        const results = _db.exec(sql, params);
        if (!results.length) return callback(null, []);
        const { columns, values } = results[0];
        const rows = values.map(v => {
          const obj = {};
          columns.forEach((c, i) => obj[c] = v[i]);
          return obj;
        });
        callback(null, rows);
      } catch (e) {
        callback(e, []);
      }
    });
  },
};

module.exports = db;

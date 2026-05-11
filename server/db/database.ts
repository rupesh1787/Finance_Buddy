import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

let Database: any;
let db: any;

try {
  Database = require("better-sqlite3");
} catch (e) {
  console.warn("⚠️ better-sqlite3 module not available, using fallback");
  // Create a simple mock if better-sqlite3 is not available
  Database = null;
}

// Determine database directory - use /tmp on Render (ephemeral but writable)
// In production on Render, filesystem is read-only except /tmp
const isProduction = process.env.NODE_ENV === "production";
const dbDir = isProduction 
  ? "/tmp" 
  : path.join(process.cwd(), "server", "db");

// Ensure db folder exists (for local dev)
if (!isProduction && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Database file path
const dbPath = path.join(dbDir, "finance-buddy.db");
console.log(`📂 Database path: ${dbPath}`);

// Create / open database with error handling
try {
  if (Database) {
    db = new Database(dbPath);
    console.log("✅ SQLite database opened successfully");
  } else {
    throw new Error("better-sqlite3 not available");
  }
} catch (error) {
  console.error("❌ Failed to open SQLite database:", error);
  // Create in-memory database as fallback
  console.log("⚠️ Falling back to in-memory database (data will not persist!)");
  if (Database) {
    try {
      db = new Database(":memory:");
    } catch (memError) {
      console.error("❌ Could not create in-memory database:", memError);
      db = null;
    }
  } else {
    db = null;
  }
}

// If no database could be created, create a simple mock
if (!db) {
  console.log("⚠️ Creating mock database object");
  db = {
    prepare: () => ({ run: () => ({}), get: () => null, all: () => [] }),
    pragma: () => {},
    exec: () => {},
  };
}

export { db };

// Enable foreign keys so child rows are purged with the parent user
db.pragma("foreign_keys = ON");

// =======================
// USERS TABLE (authoritative)
// =======================
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// =======================
// TRANSACTIONS TABLE (user scoped)
// =======================
db.prepare(`
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`).run();

db.prepare(`CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at)`).run();

// =======================
// MONEY FLOW TABLE (pay / receive) - user scoped
// =======================
db.prepare(`
  CREATE TABLE IF NOT EXISTS money_flow (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    direction TEXT CHECK(direction IN ('pay', 'receive')) NOT NULL,
    amount REAL NOT NULL,
    counterparty TEXT,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`).run();

db.prepare(`CREATE INDEX IF NOT EXISTS idx_money_flow_user ON money_flow(user_id)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_money_flow_created ON money_flow(created_at)`).run();

// =======================
// BUDGETS TABLE (user scoped)
// =======================
db.prepare(`
  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    period TEXT CHECK(period IN ('monthly','yearly')) NOT NULL DEFAULT 'monthly',
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`).run();

db.prepare(`CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id)`).run();

// =======================
// USER SETTINGS TABLE (stores preferences like currency)
// =======================
db.prepare(`
  CREATE TABLE IF NOT EXISTS user_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    preferred_currency TEXT DEFAULT 'USD',
    monthly_spending_limit REAL DEFAULT 3000,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`).run();

db.prepare(`CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id)`).run();

console.log("✅ Database initialized at:", dbPath);

/**
 * server/db.js
 * Ket noi SQLite (file), tao schema neu chua co, va seed du lieu mau
 * de test toan bo tinh nang ngay sau khi deploy.
 *
 * LUU Y VE PRODUCTION:
 * - Goi Render Free khong co disk ben vung -> DB se reset moi lan redeploy/restart.
 * - Muon du lieu ton tai that su: gan Persistent Disk (tro DB_PATH vao do) hoac
 *   chuyen sang PostgreSQL (thay better-sqlite3 bang pg, giu nguyen cau truc queries).
 */
const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data", "app.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id INTEGER UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  total_crossed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS cross_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  actor_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(task_id, actor_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (actor_id) REFERENCES users(id)
);
`);

// ---- Seed mock data (chi seed neu bang users con rong) ----
const userCount = db.prepare("SELECT COUNT(*) AS c FROM users").get().c;

if (userCount === 0) {
  const insertUser = db.prepare(
    "INSERT INTO users (public_id, full_name, phone, total_crossed) VALUES (?, ?, ?, ?)"
  );
  const insertTask = db.prepare(
    "INSERT INTO tasks (owner_id, title, url) VALUES (?, ?, ?)"
  );
  const insertLog = db.prepare(
    "INSERT INTO cross_logs (task_id, actor_id) VALUES (?, ?)"
  );

  const seedUsers = [
    { publicId: 1024, fullName: "Nguyen Van Anh Tuan", phone: "0987654678", total: 0 },
    { publicId: 1025, fullName: "Tran Thi Bich Ngoc", phone: "0912345890", total: 0 },
    { publicId: 1026, fullName: "Le Hoang Minh Chau", phone: "0977889912", total: 0 },
    { publicId: 1027, fullName: "Pham Quoc Bao", phone: "0933221144", total: 0 },
    { publicId: 1028, fullName: "Do Thi Lan", phone: "0966554433", total: 0 },
  ];

  const userIds = seedUsers.map((u) => {
    const info = insertUser.run(u.publicId, u.fullName, u.phone, u.total);
    return info.lastInsertRowid;
  });

  const seedTasks = [
    { ownerIdx: 0, title: "Bai viet ra mat san pham moi", url: "https://facebook.com/post/demo-1" },
    { ownerIdx: 0, title: "Video TikTok gioi thieu team", url: "https://tiktok.com/@demo/video/1" },
    { ownerIdx: 1, title: "Bai review khoa hoc online", url: "https://facebook.com/post/demo-2" },
    { ownerIdx: 2, title: "Livestream Q&A cuoi tuan", url: "https://facebook.com/post/demo-3" },
    { ownerIdx: 3, title: "Bai chia se kinh nghiem freelance", url: "https://facebook.com/post/demo-4" },
    { ownerIdx: 4, title: "Poll xin y kien cong dong", url: "https://facebook.com/post/demo-5" },
  ];

  const taskIds = seedTasks.map((t) =>
    insertTask.run(userIds[t.ownerIdx], t.title, t.url).lastInsertRowid
  );

  // Vai log mau de leaderboard co du lieu ngay khi mo app
  const seedLogs = [
    { taskIdx: 2, actorIdx: 0 },
    { taskIdx: 3, actorIdx: 0 },
    { taskIdx: 0, actorIdx: 1 },
    { taskIdx: 4, actorIdx: 1 },
    { taskIdx: 0, actorIdx: 2 },
    { taskIdx: 1, actorIdx: 3 },
    { taskIdx: 2, actorIdx: 3 },
    { taskIdx: 5, actorIdx: 3 },
  ];

  const bumpTotal = db.prepare(
    "UPDATE users SET total_crossed = total_crossed + 1 WHERE id = ?"
  );

  seedLogs.forEach((l) => {
    insertLog.run(taskIds[l.taskIdx], userIds[l.actorIdx]);
    bumpTotal.run(userIds[l.actorIdx]);
  });

  console.log("[seed] Da tao du lieu mau: 5 users, 6 tasks, 8 cross_logs.");
}

module.exports = db;

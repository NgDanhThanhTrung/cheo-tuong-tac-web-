/**
 * server/routes/tasks.js
 */
const express = require("express");
const db = require("../db");
const { toPublicUser } = require("../utils/mask");

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.currentUser) return res.status(401).json({ error: "Ban can dang nhap." });
  next();
}

// GET /api/tasks?ownerId=123  -> danh sach nhiem vu cua 1 thanh vien, kem trang thai da-cheo cua nguoi dang xem
router.get("/", (req, res) => {
  const ownerId = Number(req.query.ownerId);
  if (!ownerId) return res.status(400).json({ error: "Thieu ownerId." });

  // ĐÃ SỬA: Gỡ bỏ hoàn toàn điều kiện lọc lỗi để lấy ra tài khoản bình thường
  const owner = db.prepare("SELECT * FROM users WHERE id = ?").get(ownerId);
  if (!owner) return res.status(404).json({ error: "Khong tim thay thanh vien." });

  const tasks = db.prepare("SELECT * FROM tasks WHERE owner_id = ? ORDER BY created_at DESC").all(ownerId);

  const viewerId = req.currentUser ? req.currentUser.id : null;
  const doneTaskIds = viewerId
    ? new Set(
        db
          .prepare("SELECT task_id FROM cross_logs WHERE actor_id = ?")
          .all(viewerId)
          .map((r) => r.task_id)
      )
    : new Set();

  res.json({
    owner: toPublicUser(owner),
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      url: t.url,
      createdAt: t.created_at,
      isOwnTask: viewerId === t.owner_id,
      crossedByMe: doneTaskIds.has(t.id),
    })),
  });
});

// POST /api/tasks  { title, url }  -> tao nhiem vu moi cho chinh minh (yeu cau dang nhap)
router.post("/", requireAuth, (req, res) => {
  const { title, url } = req.body || {};
  if (!title || !url) return res.status(400).json({ error: "Thieu tieu de hoac link." });

  const info = db
    .prepare("INSERT INTO tasks (owner_id, title, url) VALUES (?, ?, ?)")
    .run(req.currentUser.id, title.trim(), url.trim());

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json({
    task: {
      id: task.id,
      title: task.title,
      url: task.url,
      createdAt: task.created_at,
      isOwnTask: true,
      crossedByMe: false,
    },
  });
});

module.exports = router;

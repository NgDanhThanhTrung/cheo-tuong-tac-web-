/**
 * server/routes/logs.js
 * Xac nhan "da cheo" mot nhiem vu -> ghi log + cong diem (total_crossed) cho nguoi thuc hien.
 */
const express = require("express");
const db = require("../db");

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.currentUser) return res.status(401).json({ error: "Ban can dang nhap." });
  next();
}

// POST /api/logs  { taskId }
router.post("/", requireAuth, (req, res) => {
  const { taskId } = req.body || {};
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
  if (!task) return res.status(404).json({ error: "Khong tim thay nhiem vu." });

  if (task.owner_id === req.currentUser.id) {
    return res.status(400).json({ error: "Khong the tu xac nhan cheo nhiem vu cua chinh minh." });
  }

  const already = db
    .prepare("SELECT id FROM cross_logs WHERE task_id = ? AND actor_id = ?")
    .get(taskId, req.currentUser.id);
  if (already) {
    return res.status(409).json({ error: "Ban da xac nhan cheo nhiem vu nay roi." });
  }

  const tx = db.transaction(() => {
    db.prepare("INSERT INTO cross_logs (task_id, actor_id) VALUES (?, ?)").run(taskId, req.currentUser.id);
    db.prepare("UPDATE users SET total_crossed = total_crossed + 1 WHERE id = ?").run(req.currentUser.id);
  });
  tx();

  const updatedSelf = db.prepare("SELECT total_crossed FROM users WHERE id = ?").get(req.currentUser.id);

  res.status(201).json({
    ok: true,
    taskId,
    totalCrossed: updatedSelf.total_crossed,
  });
});

module.exports = router;

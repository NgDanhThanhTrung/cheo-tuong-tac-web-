/**
 * server/routes/auth.js
 * Dang ky / dang nhap bang so dien thoai.
 * Demo don gian: khong mat khau, chi xac thuc bang SDT trung khop trong DB
 * (phu hop pham vi noi bo nhom cong dong nho). San xuat that: nen them OTP/mat khau.
 */
const express = require("express");
const crypto = require("crypto");
const db = require("../db");
const { toPrivateUser } = require("../utils/mask");

const router = express.Router();

function nextPublicId() {
  const row = db.prepare("SELECT MAX(public_id) AS maxId FROM users").get();
  return (row.maxId || 1023) + 1; // bat dau tu #1024 cho khop vi du trong de bai
}

function createSession(userId) {
  const token = crypto.randomBytes(24).toString("hex");
  db.prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)").run(token, userId);
  return token;
}

// POST /api/auth/register  { fullName, phone }
router.post("/register", (req, res) => {
  const { fullName, phone } = req.body || {};
  if (!fullName || !phone) {
    return res.status(400).json({ error: "Thieu ho ten hoac so dien thoai." });
  }
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length < 9) {
    return res.status(400).json({ error: "So dien thoai khong hop le." });
  }

  const existing = db.prepare("SELECT id FROM users WHERE phone = ?").get(digits);
  if (existing) {
    return res.status(409).json({ error: "So dien thoai da duoc dang ky." });
  }

  const publicId = nextPublicId();
  const info = db
    .prepare("INSERT INTO users (public_id, full_name, phone, total_crossed) VALUES (?, ?, ?, 0)")
    .run(publicId, fullName.trim(), digits);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
  const token = createSession(user.id);

  res.status(201).json({ token, user: toPrivateUser(user) });
});

// POST /api/auth/login  { phone }
router.post("/login", (req, res) => {
  const { phone } = req.body || {};
  const digits = String(phone || "").replace(/\D/g, "");
  const user = db.prepare("SELECT * FROM users WHERE phone = ?").get(digits);

  if (!user) {
    return res.status(404).json({ error: "Khong tim thay tai khoan voi so dien thoai nay." });
  }

  const token = createSession(user.id);
  res.json({ token, user: toPrivateUser(user) });
});

// GET /api/auth/me  (yeu cau header Authorization: Bearer <token>)
router.get("/me", (req, res) => {
  if (!req.currentUser) {
    return res.status(401).json({ error: "Chua dang nhap." });
  }
  res.json({ user: toPrivateUser(req.currentUser) });
});

module.exports = router;

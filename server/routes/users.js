/**
 * server/routes/users.js
 * Danh sach thanh vien (luon o dang da che) + leaderboard.
 * Ho ten/SDT day du CHI xuat hien trong toPrivateUser, va CHI khi req.currentUser.id === row.id.
 */
const express = require("express");
const db = require("../db");
const { toPublicUser, toPrivateUser } = require("../utils/mask");

const router = express.Router();

// GET /api/users  -> danh sach thanh vien da CHE, dung cho thanh Tabs
router.get("/", (req, res) => {
  // LỌC Ở ĐÂY: Thêm "WHERE is_virtual = 0" (hoặc thay bằng điều kiện lọc tài khoản ảo của bạn)
  const rows = db.prepare("SELECT * FROM users WHERE is_virtual = 0 ORDER BY public_id ASC").all();
  
  const list = rows.map((u) => {
    // Neu la chinh chu dang xem, tra ve them ban day du kem theo
    if (req.currentUser && req.currentUser.id === u.id) {
      return { ...toPublicUser(u), self: toPrivateUser(u) };
    }
    return toPublicUser(u);
  });
  res.json({ users: list });
});

// GET /api/users/leaderboard -> xep hang theo total_crossed, van o dang da che
router.get("/leaderboard", (req, res) => {
  // LỌC Ở ĐÂY: Chỉ lấy người dùng thật để đưa vào bảng xếp hạng
  const rows = db.prepare("SELECT * FROM users WHERE is_virtual = 0 ORDER BY total_crossed DESC, public_id ASC").all();
  
  const list = rows.map((u, idx) => ({ rank: idx + 1, ...toPublicUser(u) }));
  res.json({ leaderboard: list });
});

module.exports = router;

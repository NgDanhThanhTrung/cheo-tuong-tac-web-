const express = require("express");
const db = require("../db");
const { toPublicUser, toPrivateUser } = require("../utils/mask");

const router = express.Router();

router.get("/", (req, res) => {
  // ĐÃ GỠ BỎ BỘ LỌC LỖI
  const rows = db.prepare("SELECT * FROM users ORDER BY public_id ASC").all();
  
  const list = rows.map((u) => {
    if (req.currentUser && req.currentUser.id === u.id) {
      return { ...toPublicUser(u), self: toPrivateUser(u) };
    }
    return toPublicUser(u);
  });
  res.json({ users: list });
});

router.get("/leaderboard", (req, res) => {
  // ĐÃ GỠ BỎ BỘ LỌC LỖI
  const rows = db.prepare("SELECT * FROM users ORDER BY total_crossed DESC, public_id ASC").all();
  
  const list = rows.map((u, idx) => ({ rank: idx + 1, ...toPublicUser(u) }));
  res.json({ leaderboard: list });
});

module.exports = router;

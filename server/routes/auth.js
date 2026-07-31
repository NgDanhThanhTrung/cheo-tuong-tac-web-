/**
 * server/routes/auth.js
 * Đăng ký / Đăng nhập bằng Số điện thoại chuẩn hóa cho MongoDB (Mongoose).
 * Tự động tặng 10 điểm cho tài khoản mới đăng ký.
 */
const express = require("express");
const { User } = require("../models/Schemas");
const { toPrivateUser } = require("../utils/mask");

const router = express.Router();

// POST /api/auth/register  { fullName, phone, username }
router.post("/register", async (req, res) => {
  const { fullName, phone, username } = req.body || {};
  
  // Lấy giá trị tên hiển thị hoặc username
  const nameToUse = fullName || username;
  if (!nameToUse || !phone) {
    return res.status(400).json({ error: "Thiếu họ tên (hoặc username) và số điện thoại." });
  }

  // Lọc chỉ giữ lại chữ số trong SĐT
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length < 9) {
    return res.status(400).json({ error: "Số điện thoại không hợp lệ." });
  }

  try {
    // Kiểm tra số điện thoại hoặc username đã tồn tại chưa
    const existingUser = await User.findOne({
      $or: [{ phone: digits }, { username: digits }]
    });

    if (existingUser) {
      return res.status(409).json({ error: "Số điện thoại này đã được đăng ký." });
    }

    // Tạo user mới với MongoDB (Mặc định 10 điểm ban đầu)
    const newUser = new User({
      username: nameToUse.trim(),
      phone: digits,
      points: 10,       // Tặng 10 điểm khi đăng ký
      role: "user"
    });

    await newUser.save();

    // Dùng chính ObjectId làm token xác thực đơn giản
    const token = newUser._id.toString();

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công! Bạn nhận được 10 điểm ban đầu.",
      token,
      user: toPrivateUser ? toPrivateUser(newUser) : newUser
    });
  } catch (err) {
    console.error("Lỗi đăng ký:", err);
    res.status(500).json({ error: "Lỗi máy chủ khi đăng ký tài khoản." });
  }
});

// POST /api/auth/login  { phone }
router.post("/login", async (req, res) => {
  const { phone, username } = req.body || {};
  const input = String(phone || username || "").replace(/\D/g, "");

  if (!input) {
    return res.status(400).json({ error: "Vui lòng nhập số điện thoại đăng nhập." });
  }

  try {
    // Tìm user theo SĐT hoặc Username
    const user = await User.findOne({
      $or: [{ phone: input }, { username: input }]
    });

    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy tài khoản với số điện thoại này." });
    }

    const token = user._id.toString();

    res.json({
      success: true,
      token,
      user: toPrivateUser ? toPrivateUser(user) : user
    });
  } catch (err) {
    console.error("Lỗi đăng nhập:", err);
    res.status(500).json({ error: "Lỗi máy chủ khi đăng nhập." });
  }
});

// GET /api/auth/me  (yêu cầu header Authorization: Bearer <token>)
router.get("/me", async (req, res) => {
  if (!req.currentUser) {
    return res.status(401).json({ error: "Chưa đăng nhập hoặc phiên làm việc đã hết hạn." });
  }

  res.json({
    user: toPrivateUser ? toPrivateUser(req.currentUser) : req.currentUser
  });
});

module.exports = router;

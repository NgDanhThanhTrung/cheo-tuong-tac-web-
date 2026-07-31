/**
 * server/index.js
 * Điểm khởi động Backend. Serve luôn file tĩnh của Client (client/dist)
 * để toàn bộ app chạy trên DUY NHẤT 1 Render Web Service.
 */
const path = require("path");
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const db = require("./db");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const taskRoutes = require("./routes/tasks");
const logRoutes = require("./routes/logs");
const adminRoutes = require("./routes/admin");
const cronRoutes = require("./routes/cron"); // <-- IMPORT ROUTE CRON MỚI

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// ---- Middleware xác thực: đọc Bearer token, gán req.currentUser nếu hợp lệ ----
app.use((req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  req.currentUser = null;

  if (token) {
    const session = db.prepare("SELECT * FROM sessions WHERE token = ?").get(token);
    if (session) {
      req.currentUser = db.prepare("SELECT * FROM users WHERE id = ?").get(session.user_id) || null;
    }
  }
  next();
});

// ---- API routes ----
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/logs", logRoutes);
app.use("/admin", adminRoutes);
app.use("/api/cron", cronRoutes); // <-- ĐĂNG KÝ ROUTE CRON TẠI ĐÂY

app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ---- Tự động dọn dẹp nhiệm vụ lúc 0:00 hàng ngày (Dự phòng nội bộ) ----
cron.schedule("0 0 * * *", () => {
  console.log(`[${new Date().toISOString()}] Bắt đầu tự động dọn dẹp dữ liệu nhiệm vụ hàng ngày...`);
  
  try {
    const deleteLogs = db.prepare("DELETE FROM cross_logs");
    const logsResult = deleteLogs.run();
    console.log(`- Đã xóa ${logsResult.changes} bản ghi trong bảng cross_logs.`);

    const deleteTasks = db.prepare("DELETE FROM tasks");
    const tasksResult = deleteTasks.run();
    console.log(`- Đã làm sạch ${tasksResult.changes} nhiệm vụ trong bảng tasks.`);
    
    console.log("==> Hoàn tất dọn dẹp dữ liệu lúc 0:00!");
  } catch (error) {
    console.error("Lỗi xảy ra khi tự động dọn dẹp nhiệm vụ:", error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Ho_Chi_Minh"
});

// ---- Serve React build (client/dist) ----
const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server dang chay tai cong ${PORT}`);
});

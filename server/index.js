/**
 * server/index.js
 * Diem khoi dong Backend. Serve luon file tinh cua Client (client/dist)
 * de toan bo app chay tren DUY NHAT 1 Render Web Service.
 */
const path = require("path");
const express = require("express");
const cors = require("cors");
const cron = require("node-cron"); // Đã import thêm node-cron
const db = require("./db");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const taskRoutes = require("./routes/tasks");
const logRoutes = require("./routes/logs");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// ---- Middleware xac thuc: doc Bearer token, gan req.currentUser neu hop le ----
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

app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ---- Tự động dọn dẹp nhiệm vụ lúc 0:00 hàng ngày (Giờ Việt Nam) ----
cron.schedule("0 0 * * *", () => {
  console.log(`[${new Date().toISOString()}] Bắt đầu tự động dọn dẹp dữ liệu nhiệm vụ hàng ngày...`);
  
  try {
    // 1. Xóa lịch sử làm nhiệm vụ (cross_logs) để ngày mới mọi người có thể chéo lại từ đầu
    const deleteLogs = db.prepare("DELETE FROM cross_logs");
    const logsResult = deleteLogs.run();
    console.log(`- Đã xóa ${logsResult.changes} bản ghi trong bảng cross_logs.`);

    // 2. Xóa toàn bộ danh sách nhiệm vụ (tasks) hiện tại
    const deleteTasks = db.prepare("DELETE FROM tasks");
    const tasksResult = deleteTasks.run();
    console.log(`- Đã làm sạch ${tasksResult.changes} nhiệm vụ trong bảng tasks.`);
    
    console.log("==> Hoàn tất dọn dẹp dữ liệu lúc 0:00!");
  } catch (error) {
    console.error("Lỗi xảy ra khi tự động dọn dẹp nhiệm vụ:", error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Ho_Chi_Minh" // Ép chạy theo múi giờ Việt Nam độc lập với giờ của server Render
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

/**
 * server/index.js
 * Điểm khởi động Backend chạy trên MongoDB (Mongoose).
 * Serve luôn file tĩnh của Client (client/dist) trên duy nhất 1 Web Service.
 */
const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cron = require("node-cron");

// Import Schemas từ Mongoose
const { User, Task, CrossLog } = require("./models/Schemas");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const taskRoutes = require("./routes/tasks");
const logRoutes = require("./routes/logs");
const adminRoutes = require("./routes/admin");
const cronRoutes = require("./routes/cron");

const app = express();
const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/cheo-tuong-tac";

// ---- Kết nối Cơ sở dữ liệu MongoDB ----
mongoose
  .connect(MONGO_URI)
  .then(() => console.log(">>> Kết nối MongoDB thành công!"))
  .catch((err) => console.error("Lỗi kết nối MongoDB:", err));

app.use(cors());
app.use(express.json());

// ---- Middleware xác thực Bearer token qua MongoDB ----
app.use(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  req.currentUser = null;

  if (token) {
    try {
      // Tìm user theo ID (token đại diện cho ObjectId)
      const user = await User.findById(token);
      if (user) {
        req.currentUser = user;
      }
    } catch (err) {
      // Bỏ qua nếu Token/ID không hợp lệ
    }
  }
  next();
});

// ---- Đăng ký API Routes ----
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/logs", logRoutes);
app.use("/admin", adminRoutes);
app.use("/api/cron", cronRoutes);

app.get("/api/health", (req, res) =>
  res.json({ ok: true, time: new Date().toISOString() })
);

// ---- Tự động dọn dẹp nhiệm vụ lúc 0:00 hàng ngày (Dự phòng nội bộ) ----
cron.schedule(
  "0 0 * * *",
  async () => {
    console.log(
      `[${new Date().toISOString()}] Bắt đầu tự động dọn dẹp dữ liệu nhiệm vụ hàng ngày...`
    );

    try {
      // 1. Xóa lịch sử làm nhiệm vụ (cross_logs)
      const logResult = await CrossLog.deleteMany({});
      console.log(`- Đã xóa ${logResult.deletedCount} bản ghi trong cross_logs.`);

      // 2. Xóa toàn bộ danh sách nhiệm vụ (tasks)
      const taskResult = await Task.deleteMany({});
      console.log(`- Đã làm sạch ${taskResult.deletedCount} nhiệm vụ trong tasks.`);

      console.log("==> Hoàn tất dọn dẹp dữ liệu lúc 0:00!");
    } catch (error) {
      console.error("Lỗi xảy ra khi tự động dọn dẹp nhiệm vụ:", error);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh", // Ép theo múi giờ Việt Nam
  }
);

// ---- Serve React build (client/dist) ----
const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại cổng ${PORT}`);
});

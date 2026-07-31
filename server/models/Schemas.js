const mongoose = require("mongoose");

// 1. User Schema: Giá trị mặc định points = 10 cho tài khoản mới
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, default: "user" }, // "user" hoặc "admin"
  points: { type: Number, default: 10 },   // Tặng 10 điểm khi đăng ký lần đầu
  created_at: { type: Date, default: Date.now }
});

// 2. Task Schema
const taskSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  url: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

// 3. CrossLog Schema: Lưu vết ai đã tương tác với link nào
const crossLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  task_id: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  created_at: { type: Date, default: Date.now }
});

// 4. Report Schema: Lưu báo cáo vi phạm gửi đến Admin
const reportSchema = new mongoose.Schema({
  reporter_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  task_id: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  reason: { type: String, default: "Nghi vấn không tương tác thật" },
  created_at: { type: Date, default: Date.now }
});

module.exports = {
  User: mongoose.model("User", userSchema),
  Task: mongoose.model("Task", taskSchema),
  CrossLog: mongoose.model("CrossLog", crossLogSchema),
  Report: mongoose.model("Report", reportSchema)
};

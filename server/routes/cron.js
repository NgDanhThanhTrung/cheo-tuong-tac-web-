const express = require("express");
const router = express.Router();
const db = require("../db");

// DELETE /api/cron/clear-all-tasks
router.delete("/clear-all-tasks", (req, res) => {
  const cronSecret = req.headers["x-cron-secret"] || req.query.secret;

  // Xác thực bí mật nếu môi trường có cài đặt CRON_SECRET
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return res.status(403).json({ error: "Unauthorized: Mã xác thực Cron không hợp lệ" });
  }

  try {
    // 1. Xóa lịch sử làm nhiệm vụ (cross_logs) để ngày mới mọi người có thể chéo lại từ đầu
    const deleteLogs = db.prepare("DELETE FROM cross_logs");
    const logsResult = deleteLogs.run();

    // 2. Xóa toàn bộ danh sách nhiệm vụ (tasks) hiện tại
    const deleteTasks = db.prepare("DELETE FROM tasks");
    const tasksResult = deleteTasks.run();

    console.log(`[CRON API SUCCESS] Đã xóa ${logsResult.changes} logs và ${tasksResult.changes} tasks.`);

    return res.json({
      success: true,
      message: "Hoàn tất dọn dẹp dữ liệu ngày mới!",
      deletedLogs: logsResult.changes,
      deletedTasks: tasksResult.changes,
    });
  } catch (error) {
    console.error("Lỗi xảy ra khi dọn dẹp nhiệm vụ qua API Cron:", error);
    return res.status(500).json({ error: "Lỗi máy chủ khi dọn dẹp dữ liệu" });
  }
});

module.exports = router;

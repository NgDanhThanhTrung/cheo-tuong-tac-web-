const express = require("express");
const router = express.Router();
const { Task, CrossLog } = require("../models/Schemas");

// DELETE /api/cron/clear-all-tasks
router.delete("/clear-all-tasks", async (req, res) => {
  const cronSecret = req.headers["x-cron-secret"] || req.query.secret;

  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return res.status(403).json({ error: "Unauthorized: Mã xác thực Cron không hợp lệ" });
  }

  try {
    // 1. Xóa lịch sử làm nhiệm vụ (CrossLog)
    const logDeleteResult = await CrossLog.deleteMany({});

    // 2. Xóa toàn bộ danh sách nhiệm vụ (Task)
    const taskDeleteResult = await Task.deleteMany({});

    console.log(`[CRON SUCCESS] Đã xóa ${logDeleteResult.deletedCount} logs và ${taskDeleteResult.deletedCount} tasks.`);

    return res.json({
      success: true,
      message: "Hoàn tất dọn dẹp dữ liệu ngày mới!",
      deletedLogs: logDeleteResult.deletedCount,
      deletedTasks: taskDeleteResult.deletedCount
    });
  } catch (error) {
    console.error("Lỗi xảy ra khi dọn dẹp nhiệm vụ qua API Cron:", error);
    return res.status(500).json({ error: "Lỗi máy chủ khi dọn dẹp dữ liệu" });
  }
});

module.exports = router;

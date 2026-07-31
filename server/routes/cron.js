const express = require('express');
const router = express.Router();
const db = require('../db');

// DELETE /api/cron/clear-all-tasks
router.delete('/clear-all-tasks', (req, res) => {
  const cronSecret = req.headers['x-cron-secret'] || req.query.secret;

  // Xác thực bí mật nếu có cài đặt CRON_SECRET trong môi trường
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return res.status(403).json({ error: 'Unauthorized: Invalid cron secret' });
  }

  // Xóa toàn bộ dữ liệu trong bảng tasks
  db.run('DELETE FROM tasks', [], function (err) {
    if (err) {
      console.error('[CRON ERROR] Lỗi khi dọn dẹp tasks:', err.message);
      return res.status(500).json({ error: err.message });
    }

    console.log(`[CRON SUCCESS] Đã xóa toàn bộ ${this.changes} tasks.`);
    return res.json({
      success: true,
      message: 'Đã xóa tất cả các link/task thành công.',
      deletedCount: this.changes
    });
  });
});

module.exports = router;

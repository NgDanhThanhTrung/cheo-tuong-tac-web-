/**
 * server/routes/admin.js
 * Trang quản trị viên dựa trên MongoDB (Mongoose) & Bảo mật bằng ADMIN_PASSWORD qua URL.
 */
const express = require("express");
const mongoose = require("mongoose");
const { User, Task, CrossLog, Report } = require("../models/Schemas");

const router = express.Router();

// Lấy mật khẩu Admin từ biến môi trường (mặc định '123456')
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123456";

// Giao diện chính của Admin: GET /admin/<password>
router.get("/:password", async (req, res) => {
  const { password } = req.params;

  // 1. Kiểm tra mật khẩu Admin
  if (password !== ADMIN_PASSWORD) {
    return res.status(403).send("<h1 style='color:red;'>Truy cập bị từ chối: Sai mật khẩu Admin!</h1>");
  }

  try {
    // 2. Lấy dữ liệu từ MongoDB
    const users = await User.find().sort({ created_at: -1 });

    // Lấy danh sách nhiệm vụ kèm tổng số lượt chéo thực tế
    const tasks = await Task.aggregate([
      {
        $lookup: {
          from: "crosslogs",
          localField: "_id",
          foreignField: "task_id",
          as: "interactions"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "creator"
        }
      },
      { $unwind: { path: "$creator", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          title: 1,
          url: 1,
          created_at: 1,
          creator_name: { $ifNull: ["$creator.username", "Ẩn danh"] },
          total_interactions: { $size: "$interactions" }
        }
      },
      { $sort: { created_at: -1 } }
    ]);

    // Lấy danh sách Báo cáo vi phạm
    const reports = await Report.find()
      .populate("reporter_id", "username")
      .populate({
        path: "task_id",
        select: "title url"
      })
      .sort({ created_at: -1 });

    // 3. Tạo giao diện HTML Quản trị
    let html = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="utf-8">
        <title>Hệ Thống Quản Trị Chéo Tương Tác (MongoDB)</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 30px; background: #f4f6f9; color: #333; }
          h1, h2 { color: #111; }
          .section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
          th { background: #f3f4f6; font-weight: 600; }
          .btn-delete { background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 500; }
          .btn-delete:hover { background: #dc2626; }
          .badge { background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
          .badge-danger { background: #fee2e2; color: #991b1b; }
        </style>
      </head>
      <body>
        <h1>Khu vực Quản trị viên (Admin Panel)</h1>
        <p>Hệ trị dữ liệu: <strong>MongoDB Atlas / Mongoose</strong> | Trạng thái: <span style="color: green; font-weight: bold;">Hoạt động</span></p>
        <hr>

        <!-- Quản lý Thành viên -->
        <div class="section">
          <h2>Quản lý Thành viên (${users.length})</h2>
          <table>
            <tr>
              <th>ID (ObjectId)</th><th>Tài khoản</th><th>Quyền</th><th>Điểm hiện tại</th><th>Hành động</th>
            </tr>
            ${users.map(u => `
              <tr>
                <td><code>${u._id}</code></td>
                <td><strong>${u.username}</strong></td>
                <td><span class="badge">${u.role || 'user'}</span></td>
                <td><strong style="color: #059669;">${u.points} điểm</strong></td>
                <td>
                  <form method="POST" action="/admin/${password}/delete-user/${u._id}" onsubmit="return confirm('Bạn chắc chắn muốn xóa user này? Mọi task và log liên quan của họ cũng sẽ bị xóa!')">
                    <button class="btn-delete" type="submit">Xóa Thành Viên</button>
                  </form>
                </td>
              </tr>
            `).join('')}
          </table>
        </div>

        <!-- Quản lý Nhiệm vụ -->
        <div class="section">
          <h2>Quản lý Tất cả Nhiệm vụ (${tasks.length})</h2>
          <table>
            <tr>
              <th>ID Task</th><th>Người đăng</th><th>Tiêu đề</th><th>Đường dẫn (URL)</th><th>Lượt chéo</th><th>Hành động</th>
            </tr>
            ${tasks.map(t => `
              <tr>
                <td><code>${t._id}</code></td>
                <td>${t.creator_name}</td>
                <td>${t.title}</td>
                <td><a href="${t.url}" target="_blank" style="color: #2563eb;">${t.url}</a></td>
                <td><strong>${t.total_interactions}/10</strong></td>
                <td>
                  <form method="POST" action="/admin/${password}/delete-task/${t._id}" onsubmit="return confirm('Xóa nhiệm vụ này?')">
                    <button class="btn-delete" type="submit">Xóa Task</button>
                  </form>
                </td>
              </tr>
            `).join('')}
          </table>
        </div>

        <!-- Báo cáo Vi phạm -->
        <div class="section">
          <h2>Báo cáo Vi phạm từ User (${reports.length})</h2>
          <table>
            <tr>
              <th>Người báo cáo</th><th>Nhiệm vụ bị báo cáo</th><th>Lý do</th><th>Thời gian</th>
            </tr>
            ${reports.map(r => `
              <tr>
                <td><strong>${r.reporter_id ? r.reporter_id.username : 'Ẩn danh'}</strong></td>
                <td>${r.task_id ? `<a href="${r.task_id.url}" target="_blank">${r.task_id.title}</a>` : '<span class="badge badge-danger">Task đã bị xóa</span>'}</td>
                <td>${r.reason}</td>
                <td>${new Date(r.created_at).toLocaleString('vi-VN')}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      </body>
      </html>
    `;
    res.send(html);
  } catch (err) {
    console.error("Lỗi trang Admin:", err);
    res.status(500).send(`<h1>Lỗi hệ thống nội bộ</h1><p>${err.message}</p>`);
  }
});

// Chức năng Xóa thành viên: POST /admin/<password>/delete-user/<id>
router.post("/:password/delete-user/:id", async (req, res) => {
  const { password, id } = req.params;
  if (password !== ADMIN_PASSWORD) return res.status(403).send("Sai mật khẩu");

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send("ID User không hợp lệ");
  }

  try {
    // Dọn dẹp dữ liệu liên quan
    await CrossLog.deleteMany({ user_id: id });
    await Task.deleteMany({ user_id: id });
    await Report.deleteMany({ reporter_id: id });
    await User.findByIdAndDelete(id);

    res.redirect(`/admin/${password}`);
  } catch (err) {
    res.status(500).send(`Lỗi khi xóa user: ${err.message}`);
  }
});

// Chức năng Xóa nhiệm vụ lẻ: POST /admin/<password>/delete-task/<id>
router.post("/:password/delete-task/:id", async (req, res) => {
  const { password, id } = req.params;
  if (password !== ADMIN_PASSWORD) return res.status(403).send("Sai mật khẩu");

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send("ID Task không hợp lệ");
  }

  try {
    // Dọn dẹp dữ liệu tương tác & báo cáo của task đó
    await CrossLog.deleteMany({ task_id: id });
    await Report.deleteMany({ task_id: id });
    await Task.findByIdAndDelete(id);

    res.redirect(`/admin/${password}`);
  } catch (err) {
    res.status(500).send(`Lỗi khi xóa nhiệm vụ: ${err.message}`);
  }
});

module.exports = router;

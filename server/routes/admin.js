/**
 * server/routes/admin.js
 * Tuyến đường quản trị viên độc lập bảo mật bằng mật khẩu môi trường.
 */
const express = require("express");
const db = require("../db");

const router = express.Router();

// Lấy mật khẩu từ biến môi trường ADMIN_PASSWORD (nếu chưa cài thì mặc định là '123456')
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123456";

// Giao diện chính của Admin: GET /admin/<password>
router.get("/:password", (req, res) => {
  const { password } = req.params;

  // Kiểm tra mật khẩu chuẩn xác
  if (password !== ADMIN_PASSWORD) {
    return res.status(403).send("<h1>Truy cập bị từ chối: Sai mật khẩu Admin!</h1>");
  }

  // Lấy danh sách thành viên và nhiệm vụ để hiển thị lên bảng quản trị
  const users = db.prepare("SELECT id, label, username, phone, total_crossed FROM users ORDER BY id DESC").all();
  const tasks = db.prepare("SELECT id, owner_id, title, url FROM tasks ORDER BY id DESC").all();

  // Trả về một giao diện HTML quản trị nhanh (Xây dựng bằng mã HTML thuần cho tiện lợi)
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Hệ Thống Quản Trị Chéo Tương Tác</title>
      <style>
        body { font-family: sans-serif; margin: 30px; background: #f4f6f9; color: #333; }
        h1, h2 { color: #111; }
        .section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #eee; }
        .btn-delete { background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; }
        .btn-delete:hover { background: #dc2626; }
      </style>
    </head>
    <body>
      <h1>Khu vực Quản trị viên (Admin Panel)</h1>
      <p>Trạng thái bảo mật: <strong>Hoạt động</strong></p>
      <hr>

      <div class="section">
        <h2>Quản lý Thành viên (${users.length})</h2>
        <table>
          <tr>
            <th>ID</th><th>Nhãn hiển thị</th><th>Tài khoản / SĐT</th><th>Lượt chéo</th><th>Hành động</th>
          </tr>
          ${users.map(u => `
            <tr>
              <td>${u.id}</td>
              <td>${u.label || 'Không rõ'}</td>
              <td>${u.username || u.phone || 'N/A'}</td>
              <td>${u.total_crossed}</td>
              <td>
                <form method="POST" action="/admin/${password}/delete-user/${u.id}" onsubmit="return confirm('Bạn có chắc chắn muốn xóa thành viên này? Tất cả nhiệm vụ của họ cũng sẽ bay màu!')">
                  <button class="btn-delete" type="submit">Xóa Thành Viên</button>
                </form>
              </td>
            </tr>
          `).join('')}
        </table>
      </div>

      <div class="section">
        <h2>Quản lý Nhiệm vụ (${tasks.length})</h2>
        <table>
          <tr>
            <th>ID</th><th>ID Chủ nhiệm vụ</th><th>Tiêu đề</th><th>Đường dẫn (URL)</th><th>Hành động</th>
          </tr>
          ${tasks.map(t => `
            <tr>
              <td>${t.id}</td>
              <td>${t.owner_id}</td>
              <td>${t.title}</td>
              <td><a href="${t.url}" target="_blank">${t.url}</a></td>
              <td>
                <form method="POST" action="/admin/${password}/delete-task/${t.id}" onsubmit="return confirm('Xóa nhiệm vụ này?')">
                  <button class="btn-delete" type="submit">Xóa Nhiệm Vụ</button>
                </form>
              </td>
            </tr>
          `).join('')}
        </table>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

// Chức năng Xóa thành viên: POST /admin/<password>/delete-user/<id>
router.post("/:password/delete-user/:id", (req, res) => {
  const { password, id } = req.params;
  if (password !== ADMIN_PASSWORD) return res.status(403).send("Sai mật khẩu");

  // Xóa nhiệm vụ và lịch sử chéo của user này trước để tránh lỗi ràng buộc database
  db.prepare("DELETE FROM cross_logs WHERE actor_id = ?").run(id);
  db.prepare("DELETE FROM tasks WHERE owner_id = ?").run(id);
  // Tiến hành xóa user
  db.prepare("DELETE FROM users WHERE id = ?").run(id);

  // Xóa xong quay trở lại trang quản trị
  res.redirect(`/admin/${password}`);
});

// Chức năng Xóa nhiệm vụ lẻ: POST /admin/<password>/delete-task/<id>
router.post("/:password/delete-task/:id", (req, res) => {
  const { password, id } = req.params;
  if (password !== ADMIN_PASSWORD) return res.status(403).send("Sai mật khẩu");

  // Xóa lịch sử chéo liên quan đến nhiệm vụ này trước
  db.prepare("DELETE FROM cross_logs WHERE task_id = ?").run(id);
  // Xóa nhiệm vụ
  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);

  res.redirect(`/admin/${password}`);
});

module.exports = router;

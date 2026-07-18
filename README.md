# Chéo Tương Tác — Full-stack Monorepo (React + Express + SQLite)

## 1. Cấu trúc thư mục

```
├── package.json        # script build/start dùng chung cho Render
├── render.yaml          # (tùy chọn) blueprint deploy nhanh
├── server/
│   ├── index.js          # entrypoint Express, serve luôn client/dist
│   ├── db.js              # SQLite schema + mock data seed
│   ├── utils/mask.js     # hàm che SĐT / họ tên (bảo mật)
│   ├── routes/
│   │   ├── auth.js        # đăng ký / đăng nhập
│   │   ├── users.js       # danh sách thành viên (đã che) + leaderboard
│   │   ├── tasks.js       # nhiệm vụ theo từng thành viên
│   │   └── logs.js        # xác nhận "đã chéo"
│   └── data/               # nơi lưu file SQLite (app.db)
└── client/                # React (Vite) + Tailwind CSS
    └── src/
        ├── App.jsx
        ├── api.js
        └── components/ (Login, Tabs, TaskList, Leaderboard, AddTaskModal)
```

Đây là **một** Render Web Service duy nhất: Express vừa cung cấp API `/api/*`
vừa serve file tĩnh đã build của React (`client/dist`), nên chỉ cần 1 click deploy.

## 2. Bảo mật thông tin (Server-side masking)

Toàn bộ việc che thông tin nằm ở `server/utils/mask.js` và được áp dụng **trước khi**
dữ liệu rời khỏi server — client (kể cả xem qua F12/Network tab) không bao giờ
thấy SĐT/họ tên đầy đủ của người khác:

- `maskPhone("0987654678")` → `***4678` (4 số cuối)
- `maskName("Nguyễn Văn Anh Tuấn")` → `Anh Tuấn` (tối đa 2 từ cuối)
- ID công khai dạng `#1024` (tự tăng, bắt đầu từ `#1024`)
- Hiển thị công khai: `Anh Tuấn #1024 (***4678)`

Chỉ khi `req.currentUser.id === row.id` (tức chính chủ đã đăng nhập, xác thực qua
Bearer token trong middleware ở `server/index.js`) thì API mới trả thêm object
đầy đủ (`toPrivateUser`) chứa `fullName` và `phone` thật.

## 3. API endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/auth/register` | `{fullName, phone}` → tạo user, trả token |
| POST | `/api/auth/login` | `{phone}` → trả token |
| GET | `/api/auth/me` | thông tin đầy đủ của chính mình |
| GET | `/api/users` | danh sách thành viên (đã che) |
| GET | `/api/users/leaderboard` | bảng xếp hạng theo `total_crossed` |
| GET | `/api/tasks?ownerId=ID` | nhiệm vụ của 1 thành viên |
| POST | `/api/tasks` | (cần đăng nhập) tạo nhiệm vụ mới |
| POST | `/api/logs` | (cần đăng nhập) `{taskId}` xác nhận đã chéo |

## 4. Chạy thử local

```bash
# Terminal 1 - backend
npm install
npm run dev:server        # http://localhost:10000

# Terminal 2 - frontend (dev, có proxy /api sang :10000)
cd client && npm install
npm run dev                # http://localhost:5173
```

Dữ liệu mẫu (5 thành viên, 6 nhiệm vụ, 8 lượt chéo) tự động seed vào SQLite
lần chạy đầu tiên — số điện thoại demo dùng để đăng nhập thử, ví dụ:
`0987654678`, `0912345890`, `0977889912`...

## 5. Deploy lên Render (1 click)

1. Push toàn bộ thư mục này lên một GitHub repository.
2. Vào **Render Dashboard → New → Web Service**, chọn repo vừa tạo.
3. Cấu hình:
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (hoặc Starter nếu cần)
4. Bấm **Create Web Service** — Render sẽ tự chạy `npm run build`
   (cài server deps, cài client deps, build React ra `client/dist`),
   sau đó `npm start` sẽ chạy Express server serve cả API lẫn giao diện.
5. (Tùy chọn) Dùng sẵn `render.yaml` bằng tính năng **Blueprint** của Render
   để tự động hoá toàn bộ bước trên.

### ⚠️ Lưu ý quan trọng về lưu trữ dữ liệu trên Render Free
Gói Free của Render **không có ổ đĩa bền vững** — file SQLite (`server/data/app.db`)
sẽ bị xoá mỗi lần service redeploy hoặc restart (rồi mock data sẽ seed lại từ đầu).
Để dữ liệu thật sự tồn tại lâu dài, chọn 1 trong 2 cách:
1. Gắn **Persistent Disk** (trả phí) cho service, trỏ biến môi trường
   `DB_PATH` vào thư mục disk đó.
2. Chuyển sang **PostgreSQL** (Render có Postgres free 90 ngày / trả phí) —
   thay `better-sqlite3` bằng `pg`, giữ nguyên cấu trúc bảng và các câu query
   (chỉ cần đổi cú pháp placeholder `?` → `$1, $2...`).

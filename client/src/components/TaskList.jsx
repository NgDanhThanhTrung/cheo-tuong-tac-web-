import React, { useState } from "react";

export default function TaskList({ owner, tasks, onConfirm }) {
  const [busyId, setBusyId] = useState(null);

  async function handleConfirm(taskId) {
    // Nếu chủ nhiệm vụ là tài khoản ảo, chặn không cho bấm xử lý
    if (owner?.is_virtual) return; 
    
    setBusyId(taskId);
    await onConfirm(taskId);
    setBusyId(null);
  }

  if (!tasks.length) {
    return <p className="text-ink/50 text-sm py-8 text-center">Thành viên này chưa có nhiệm vụ nào.</p>;
  }

  return (
    <ul className="space-y-3">
      {tasks.map((t) => (
        <li
          key={t.id}
          className="flex items-center justify-between bg-white rounded-xl border border-ink/10 px-4 py-3"
        >
          <div className="min-w-0">
            <p className="font-medium text-ink truncate">{t.title}</p>
            <a
              href={t.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-mint truncate block hover:underline"
            >
              {t.url}
            </a>
          </div>
          {t.isOwnTask ? (
            <span className="text-xs text-ink/40 ml-4 shrink-0">Nhiệm vụ của bạn</span>
          ) : t.crossedByMe ? (
            <button
              disabled
              className="ml-4 shrink-0 bg-emerald-500 text-white text-sm px-4 py-1.5 rounded-full"
            >
              Đã chéo ✓
            </button>
          ) : owner?.is_virtual ? (
            /* Nếu lọt lưới nick ảo xuống frontend, hiển thị trạng thái vô hiệu hóa không cho bấm */
            <span className="text-xs text-red-500 ml-4 shrink-0">Tài khoản hệ thống</span>
          ) : (
            <button
              onClick={() => handleConfirm(t.id)}
              disabled={busyId === t.id}
              className="ml-4 shrink-0 bg-amber text-ink text-sm px-4 py-1.5 rounded-full font-medium hover:opacity-90 disabled:opacity-50"
            >
              {busyId === t.id ? "..." : "Xác nhận đã chéo"}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

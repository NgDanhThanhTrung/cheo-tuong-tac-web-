import React from "react";

export default function Leaderboard({ leaderboard }) {
  return (
    <div className="bg-white rounded-xl border border-ink/10 p-4">
      <h3 className="font-semibold text-ink mb-3">Bảng xếp hạng</h3>
      <ol className="space-y-2">
        {leaderboard
          // BẢO VỆ THÊM Ở FRONTEND: Loại bỏ các tài khoản có flag ảo nếu có
          .filter((u) => !u.is_virtual) 
          .map((u) => (
            <li key={u.id} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="w-5 text-ink/40 font-mono">{u.rank}</span>
                <span className="text-ink">{u.label}</span>
              </span>
              <span className="font-semibold text-mint">{u.totalCrossed} lượt</span>
            </li>
          ))}
      </ol>
    </div>
  );
}

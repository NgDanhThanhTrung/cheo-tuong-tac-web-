import React, { useState } from "react";

export default function AddTaskModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onCreate(title, url);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <h3 className="font-semibold text-ink mb-4">Thêm nhiệm vụ mới</h3>
        <form onSubmit={submit} className="space-y-3">
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Tiêu đề nhiệm vụ"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Link cần chéo"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border rounded-lg py-2">
              Hủy
            </button>
            <button disabled={loading} className="flex-1 bg-ink text-white rounded-lg py-2">
              {loading ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

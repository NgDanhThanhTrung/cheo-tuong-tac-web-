import React, { useState } from "react";
import { X, FileText, Link2, PlusCircle, Loader2, AlertCircle } from "lucide-react";

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
      setError(err.message || "Đã xảy ra lỗi, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-ink/10 transition-all scale-100">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-ink/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-mint/10 text-mint flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-ink text-base">Thêm nhiệm vụ mới</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-ink/40 hover:bg-slate-100 hover:text-ink transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={submit} className="space-y-4">
          {/* Tiêu đề */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink/70 uppercase tracking-wider">
              Tiêu đề nhiệm vụ
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-ink/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                className="w-full bg-slate-50 border border-ink/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:bg-white focus:border-mint focus:ring-2 focus:ring-mint/20 transition-all"
                placeholder="VD: Chéo like bài viết mới..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Link cần chéo */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink/70 uppercase tracking-wider">
              Link cần chéo
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-ink/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                className="w-full bg-slate-50 border border-ink/10 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:bg-white focus:border-mint focus:ring-2 focus:ring-mint/20 transition-all"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Alert Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-ink/10 text-ink/70 font-medium rounded-xl py-2.5 text-sm hover:bg-slate-50 active:scale-[0.98] transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-ink text-white font-medium rounded-xl py-2.5 text-sm hover:bg-ink/90 active:scale-[0.98] disabled:opacity-50 transition-all shadow-md shadow-ink/10 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

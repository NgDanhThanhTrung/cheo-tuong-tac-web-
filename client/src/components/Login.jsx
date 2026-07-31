import React, { useState } from "react";
import { api } from "../api";

export default function Login({ onAuth }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data =
        mode === "login" ? await api.login(phone) : await api.register(fullName, phone);
      onAuth(data.token, data.user);
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  const toggleMode = () => {
    setError("");
    setMode(mode === "login" ? "register" : "login");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-ink/5 p-8 border border-ink/10 transition-all">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-mint/10 text-mint rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl font-bold">
            ✨
          </div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Chéo Tương Tác</h1>
          <p className="text-sm text-ink/60 mt-1">
            {mode === "login" ? "Đăng nhập bằng số điện thoại" : "Đăng ký thành viên mới"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink/70 uppercase tracking-wider">
                Họ và tên
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm opacity-50">👤</span>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-ink/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:bg-white focus:border-mint focus:ring-2 focus:ring-mint/20 transition-all"
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink/70 uppercase tracking-wider">
              Số điện thoại
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm opacity-50">📞</span>
              <input
                type="tel"
                className="w-full bg-slate-50 border border-ink/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:bg-white focus:border-mint focus:ring-2 focus:ring-mint/20 transition-all"
                placeholder="0912345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Alert Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-ink text-white rounded-xl py-3 font-medium text-sm hover:bg-ink/90 active:scale-[0.99] disabled:opacity-50 transition-all shadow-md shadow-ink/10 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block animate-spin">⌛</span>
            ) : null}
            <span>{loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Đăng ký"}</span>
            {!loading && <span>➔</span>}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="mt-6 pt-4 border-t border-ink/5 text-center">
          <button
            type="button"
            className="text-sm text-mint font-medium hover:underline transition-all"
            onClick={toggleMode}
          >
            {mode === "login"
              ? "Chưa có tài khoản? Đăng ký ngay"
              : "Đã có tài khoản? Đăng nhập"}
          </button>
        </div>
      </div>
    </div>
  );
}

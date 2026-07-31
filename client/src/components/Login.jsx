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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 bg-white rounded-2xl shadow-xl p-8 border border-ink/10">
      <h1 className="text-2xl font-bold text-ink mb-1">Chéo Tương Tác</h1>
      <p className="text-sm text-ink/60 mb-6">
        {mode === "login" ? "Đăng nhập bằng số điện thoại" : "Đăng ký thành viên mới"}
      </p>
      
      <form onSubmit={submit} className="space-y-4">
        {mode === "register" && (
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <input
              className="w-full border rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint transition-all"
              placeholder="Họ và tên đầy đủ"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
        )}

        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <input
            className="w-full border rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint transition-all"
            placeholder="Số điện thoại"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          disabled={loading}
          className="w-full bg-ink text-white rounded-lg py-2 font-medium hover:bg-ink/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {loading && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Đăng ký"}
        </button>
      </form>

      <button
        className="text-sm text-mint mt-4 underline block"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
      >
        {mode === "login" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
      </button>
    </div>
  );
}

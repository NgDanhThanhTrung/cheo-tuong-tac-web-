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
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Họ và tên đầy đủ"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        )}
        <input
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Số điện thoại"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          disabled={loading}
          className="w-full bg-ink text-white rounded-lg py-2 font-medium hover:bg-ink/90 disabled:opacity-50"
        >
          {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Đăng ký"}
        </button>
      </form>
      <button
        className="text-sm text-mint mt-4 underline"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
      >
        {mode === "login" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
      </button>
    </div>
  );
}

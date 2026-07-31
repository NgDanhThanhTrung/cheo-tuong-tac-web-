import React, { useState } from "react";
import { api } from "../api";
import { Phone, User, ArrowRight, Loader2, Sparkles, AlertCircle } from "lucide-react";

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
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-mint/10 text-mint rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
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
                <User className="w-5 h-5 text-ink/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-ink/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:bg-white focus:border-mint focus:ring-2 focus:ring-mint/20 transition-all"
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
              <Phone className="w-5 h-5 text-ink/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                className="w-full bg-slate-50 border border-ink/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:outline-none focus:bg-white focus:border-mint focus:ring-2 focus:ring-mint/20 transition-all"
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
              <AlertCircle className="w-4 h-4 shrink-0" />
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
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                {mode === "login" ? "Đăng nhập" : "Đăng ký"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="mt-6 pt-4 border-t border-ink/5 text-center">
          <button
            type="button"
            className="text-sm text-mint font-medium hover:underline inline-flex items-center gap-1 transition-all"
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

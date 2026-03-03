import React, { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 1500));
    setIsLoading(false);
    if (email !== "staff@coffeetea.com" || password !== "password") {
      setError("Invalid credentials. Contact your manager if you need access.");
      return;
    }
    alert("Welcome back!");
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden">

      {/* ── LEFT PANEL ── */}
      <div className="relative w-full md:w-3/5 lg:w-2/3 flex flex-col justify-between py-10 px-10 bg-stone-900 overflow-hidden min-h-48 md:min-h-screen">

        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 bg-amber-800 opacity-20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-60px] right-[-40px] w-56 h-56 bg-amber-900 opacity-30 rounded-full blur-2xl pointer-events-none" />

        {/* Logo + Brand */}
        <div className="relative z-10 flex flex-col items-center text-center pt-4 md:pt-10">
          <div className="w-16 h-16 rounded-2xl bg-amber-600 flex items-center justify-center shadow-xl mb-5">
            <svg viewBox="0 0 64 64" className="w-9 h-9" fill="none">
              <path d="M10 20h35l-4 24H14L10 20z" fill="#fde68a" fillOpacity="0.2" stroke="#fde68a" strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M45 26h5a5 5 0 010 10h-5" stroke="#fde68a" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M20 10c0 0 2-4 0-8M27 10c0 0 2-4 0-8M34 10c0 0 2-4 0-8" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
              <path d="M10 44h35" stroke="#fde68a" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-none">
            Coffee & Tea <span className="text-amber-400">Connection</span>
          </h1>
          <p className="text-xs text-stone-400 mt-2 uppercase tracking-[0.2em]">Inventory System</p>
        </div>

        {/* Tagline */}
        <div className="relative z-10 text-center hidden md:block">
          <p className="text-stone-400 text-sm leading-relaxed max-w-xs mx-auto">
            A simple, powerful tool for managing your coffee shop's stock, suppliers, and daily operations.
          </p>
        </div>

        {/* Version */}
        <div className="relative z-10 text-center">
          <p className="text-xs text-stone-600">Version 1.0</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-full md:w-2/5 lg:w-1/3 flex flex-col bg-white min-h-screen">

        {/* Staff-only badge */}
        <div className="flex justify-end px-8 sm:px-10 pt-6 pb-2">
          <span className="text-xs text-stone-400 italic tracking-wide">Staff access only</span>
        </div>

        {/* Centered form */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-10 py-8">
          <div className="w-full max-w-sm mx-auto">
            <h2 className="text-3xl font-bold text-stone-800 mb-1 leading-tight">Welcome back</h2>
            <p className="text-sm text-stone-400 mb-8">Enter your staff credentials to continue</p>

            {/* Error */}
            {error && (
              <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3.5 flex items-center text-stone-300 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="AdminUser@gmail.com"
                    autoComplete="email"
                    className="w-full border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-300 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3.5 flex items-center text-stone-300 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password..."
                    autoComplete="current-password"
                    className="w-full border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-300 rounded-lg pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-stone-400 hover:text-stone-600 transition"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </span>
                </div>
              </div>

              {/* Remember me */}
              <div
                className="flex items-center gap-2.5 cursor-pointer group pt-1"
                onClick={() => setRememberMe(!rememberMe)}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition shrink-0 ${rememberMe ? "bg-amber-600 border-amber-600" : "border-stone-300 group-hover:border-amber-500"}`}>
                  {rememberMe && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-stone-400 select-none">Remember me</span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-stone-900 hover:bg-stone-700 active:bg-black disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-lg py-3.5 text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2 touch-manipulation"
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </>
                ) : "Sign In"}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="px-8 sm:px-10 py-5 text-right">
          <p className="text-xs text-stone-300">© 2026 Coffee and Tea Connection</p>
        </div>
      </div>

    </div>
  );
}
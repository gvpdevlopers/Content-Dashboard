import { useState } from "react";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      setError("Please enter your username/email and password.");
      return;
    }

    try {
  setLoading(true);

  const data = await login(identifier.trim(), password);

  if (data.user.role === "admin") {
    navigate("/admin", { replace: true });
  } else {
    navigate("/dashboard", { replace: true });
  }
}catch (error) {
      const message =
        error.response?.data?.message ||
        "Unable to login. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] px-5 py-10 text-white">

      {/* =====================================================
          BACKGROUND EFFECTS
      ====================================================== */}

      {/* Large ambient glow */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-cyan-400/[0.08] blur-[120px]" />

      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[420px] w-[420px] rounded-full bg-blue-500/[0.06] blur-[120px]" />

      {/* Small center glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/[0.025] blur-[100px]" />

      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="relative z-10 w-full max-w-md">

        {/* Header */}
        <div className="mb-8">

          <div className="mb-5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-white/40">
            <Sparkles
              size={13}
              strokeWidth={1.6}
              className="text-cyan-300/70"
            />

            <span>Content Dashboard</span>
          </div>

          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
            Login
          </h1>

          <p className="mt-3 max-w-sm text-sm leading-6 text-white/45">
            Sign in to access your content dashboard.
          </p>

        </div>

        {/* =================================================
            LOGIN CARD
        ================================================== */}

        <form
          onSubmit={handleSubmit}
          className="
            group/form relative overflow-hidden
            rounded-[28px]
            border border-white/[0.12]
            bg-white/[0.045]
            p-6
            shadow-[0_25px_80px_rgba(0,0,0,0.45)]
            backdrop-blur-2xl
            sm:p-8
          "
        >

          {/* Top glass highlight */}
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          {/* Card ambient glow */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-cyan-300/[0.05] blur-3xl transition duration-700 group-hover/form:bg-cyan-300/[0.08]" />

          {/* Error */}
          {error && (
            <div className="relative mb-6 overflow-hidden rounded-2xl border border-red-400/20 bg-red-500/[0.08] px-4 py-3.5 text-sm text-red-300 shadow-[0_10px_40px_rgba(239,68,68,0.06)]">
              <div className="absolute inset-y-0 left-0 w-1 bg-red-400/70" />
              <span className="pl-2">{error}</span>
            </div>
          )}

          <div className="relative space-y-6">

            {/* =================================================
                EMAIL / USERNAME
            ================================================== */}

            <div className="group">

              <label className="mb-2.5 block text-sm font-medium text-white/65 transition-colors duration-300 group-focus-within:text-white">
                Email or Username
              </label>

              <div className="relative">

                {/* Focus glow */}
                <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-cyan-300/0 via-cyan-300/0 to-blue-400/0 opacity-0 blur-sm transition duration-500 group-focus-within:from-cyan-300/20 group-focus-within:via-cyan-300/10 group-focus-within:to-blue-400/20 group-focus-within:opacity-100" />

                <input
                  type="text"
                  value={identifier}
                  onChange={(event) =>
                    setIdentifier(event.target.value)
                  }
                  placeholder="Enter email or username"
                  autoComplete="username"
                  className="
                    relative
                    w-full
                    rounded-2xl
                    border border-white/[0.10]
                    bg-black/20
                    px-4 py-4
                    text-sm text-white
                    outline-none
                    transition-all duration-300
                    placeholder:text-white/25
                    hover:border-white/[0.18]
                    hover:bg-white/[0.045]
                    focus:border-cyan-300/40
                    focus:bg-white/[0.06]
                    focus:shadow-[0_0_0_4px_rgba(34,211,238,0.06)]
                  "
                />

                {/* Bottom active line */}
                <div className="pointer-events-none absolute bottom-0 left-4 right-4 h-px origin-left scale-x-0 bg-gradient-to-r from-cyan-300/70 to-blue-400/70 transition-transform duration-500 group-focus-within:scale-x-100" />

              </div>
            </div>

            {/* =================================================
                PASSWORD
            ================================================== */}

            <div className="group">

              <label className="mb-2.5 block text-sm font-medium text-white/65 transition-colors duration-300 group-focus-within:text-white">
                Password
              </label>

              <div className="relative">

                {/* Focus glow */}
                <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-cyan-300/0 via-cyan-300/0 to-blue-400/0 opacity-0 blur-sm transition duration-500 group-focus-within:from-cyan-300/20 group-focus-within:via-cyan-300/10 group-focus-within:to-blue-400/20 group-focus-within:opacity-100" />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="
                    relative
                    w-full
                    rounded-2xl
                    border border-white/[0.10]
                    bg-black/20
                    px-4 py-4 pr-14
                    text-sm text-white
                    outline-none
                    transition-all duration-300
                    placeholder:text-white/25
                    hover:border-white/[0.18]
                    hover:bg-white/[0.045]
                    focus:border-cyan-300/40
                    focus:bg-white/[0.06]
                    focus:shadow-[0_0_0_4px_rgba(34,211,238,0.06)]
                  "
                />

                {/* Password toggle */}
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  className="
                    absolute right-2.5 top-1/2
                    flex h-10 w-10
                    -translate-y-1/2
                    items-center justify-center
                    rounded-xl
                    text-white/30
                    transition-all duration-300
                    hover:bg-white/[0.08]
                    hover:text-white
                    active:scale-90
                  "
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

                {/* Bottom active line */}
                <div className="pointer-events-none absolute bottom-0 left-4 right-4 h-px origin-left scale-x-0 bg-gradient-to-r from-cyan-300/70 to-blue-400/70 transition-transform duration-500 group-focus-within:scale-x-100" />

              </div>
            </div>

            {/* =================================================
                LOGIN BUTTON
            ================================================== */}

            <button
              type="submit"
              disabled={loading}
              className="
                group/button relative
                flex w-full
                items-center justify-center
                gap-2
                overflow-hidden
                rounded-2xl
                border border-white
                bg-white
                px-5 py-4
                text-sm font-semibold
                text-black
                shadow-[0_10px_30px_rgba(255,255,255,0.06)]
                transition-all duration-300
                hover:-translate-y-0.5
                hover:shadow-[0_14px_40px_rgba(34,211,238,0.16)]
                active:translate-y-0
                active:scale-[0.985]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >

              {/* Sliding shine */}
              {!loading && (
                <span
                  className="
                    pointer-events-none
                    absolute inset-y-0 -left-1/2
                    w-1/3
                    -skew-x-12
                    bg-gradient-to-r
                    from-transparent
                    via-black/[0.08]
                    to-transparent
                    transition-transform
                    duration-700
                    group-hover/button:translate-x-[430%]
                  "
                />
              )}

              {/* Hover background */}
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-100 via-white to-blue-100 opacity-0 transition-opacity duration-300 group-hover/button:opacity-100" />

              <span className="relative flex items-center justify-center gap-2">

                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Logging in...
                  </>
                ) : (
                  <>
                    Login

                    <ArrowRight
                      size={18}
                      className="transition-all duration-300 group-hover/button:translate-x-1"
                    />
                  </>
                )}

              </span>
            </button>

          </div>
        </form>

        {/* =================================================
            BRAND
        ================================================== */}

        <div className="mt-8 flex items-center justify-center">

          <div className="group/brand flex items-center gap-3">

            <div
              className="
                relative
                flex h-11 w-11
                items-center justify-center
                overflow-hidden
                rounded-xl
                border border-white/10
                bg-white/[0.04]
                p-1
                shadow-[0_8px_30px_rgba(0,0,0,0.25)]
                transition-all duration-500
                group-hover/brand:border-cyan-300/20
                group-hover/brand:shadow-[0_8px_35px_rgba(34,211,238,0.12)]
              "
            >
              <img
                src="/favicon.png"
                alt="Glow Ventures"
                className="
                  h-full
                  w-full
                  rounded-lg
                  object-cover
                  transition-transform
                  duration-500
                  group-hover/brand:scale-105
                "
              />
            </div>

            <div>
              <p className="text-sm font-medium text-white/70">
                Glow Ventures
              </p>

              <p className="mt-0.5 text-[11px] tracking-wide text-white/30">
                Content & Creative Services
              </p>
            </div>

          </div>

        </div>

      </div>
    </main>
  );
};

export default Login;
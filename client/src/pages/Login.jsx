import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Loader2, Sparkles } from "lucide-react";
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
    } catch (error) {
      const message =
        error.response?.data?.message || "Unable to login. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="
        relative
        flex min-h-screen
        items-center justify-center
        overflow-hidden
        bg-[#f7f7f8]
        px-5 py-10
        text-zinc-900
      "
    >
      {/* =====================================================
          BACKGROUND EFFECTS
      ====================================================== */}

      {/* Large ambient glow */}
      <div
        className="
          pointer-events-none
          absolute
          -left-40
          -top-40
          h-[420px]
          w-[420px]
          rounded-full
          bg-cyan-400/[0.06]
          blur-[120px]
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-40
          -right-40
          h-[420px]
          w-[420px]
          rounded-full
          bg-blue-500/[0.045]
          blur-[120px]
        "
      />

      {/* Small center glow */}
      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-[300px]
          w-[300px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-cyan-300/[0.025]
          blur-[100px]
        "
      />

      {/* Subtle grid */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-[0.018]
        "
        style={{
          backgroundImage:
            "linear-gradient(rgba(24,24,27,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(24,24,27,0.7) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="relative z-10 w-full max-w-md animate-fade-up">
        {/* Header */}
        <div className="mb-8">
          <div
            className="
              mb-5
              flex items-center gap-2
              text-xs
              font-medium
              uppercase
              tracking-[0.22em]
              text-zinc-400
            "
          >
            <Sparkles
              size={13}
              strokeWidth={1.6}
              className="text-cyan-600/70"
            />

            <span>Content Dashboard</span>
          </div>

          <h1
            className="
              text-4xl
              font-semibold
              tracking-[-0.04em]
              text-zinc-900
              sm:text-5xl
            "
          >
            Login
          </h1>

          <p
            className="
              mt-3
              max-w-sm
              text-sm
              leading-6
              text-zinc-500
            "
          >
            Sign in to access your content dashboard.
          </p>
        </div>

        {/* =================================================
            LOGIN CARD
        ================================================== */}

        <form
          onSubmit={handleSubmit}
          className="
            group/form
            relative
            overflow-hidden
            rounded-[28px]
            border border-zinc-200
            bg-white
            p-6
            shadow-[0_25px_80px_rgba(0,0,0,0.08)]
            sm:p-8
          "
        >
          {/* Top highlight */}
          <div
            className="
              pointer-events-none
              absolute
              inset-x-8
              top-0
              h-px
              bg-gradient-to-r
              from-transparent
              via-zinc-300
              to-transparent
            "
          />

          {/* Card ambient glow */}
          <div
            className="
              pointer-events-none
              absolute
              -right-24
              -top-24
              h-48
              w-48
              rounded-full
              bg-cyan-300/[0.035]
              blur-3xl
              transition
              duration-700
              group-hover/form:bg-cyan-300/[0.07]
            "
          />

          {/* Error */}
          {error && (
            <div
              className="
                relative
                mb-6
                overflow-hidden
                rounded-2xl
                border border-red-200
                bg-red-50
                px-4
                py-3.5
                text-sm
                text-red-600
                shadow-[0_10px_40px_rgba(239,68,68,0.05)]
              "
            >
              <div className="absolute inset-y-0 left-0 w-1 bg-red-400" />

              <span className="pl-2">{error}</span>
            </div>
          )}

          <div className="relative space-y-6">
            {/* =================================================
                EMAIL / USERNAME
            ================================================== */}

            <div className="group">
              <label
                className="
                  mb-2.5
                  block
                  text-sm
                  font-medium
                  text-zinc-600
                  transition-colors
                  duration-200
                  group-focus-within:text-zinc-900
                "
              >
                Email or Username
              </label>

              <div className="relative">
                {/* Focus glow */}
                <div
                  className="
                    pointer-events-none
                    absolute
                    -inset-px
                    rounded-2xl
                    bg-gradient-to-r
                    from-cyan-300/0
                    via-cyan-300/0
                    to-blue-400/0
                    opacity-0
                    blur-sm
                    transition
                    duration-500
                    group-focus-within:from-cyan-300/15
                    group-focus-within:via-cyan-300/10
                    group-focus-within:to-blue-400/15
                    group-focus-within:opacity-100
                  "
                />

                <input
                  type="text"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="Enter email or username"
                  autoComplete="username"
                  className="
                    relative
                    w-full
                    rounded-2xl
                    border border-zinc-200
                    bg-zinc-50
                    px-4
                    py-4
                    text-sm
                    text-zinc-900
                    outline-none
                    transition-all
                    duration-200
                    placeholder:text-zinc-400
                    hover:border-zinc-300
                    hover:bg-white
                    focus:border-zinc-400
                    focus:bg-white
                    focus:shadow-[0_0_0_4px_rgba(24,24,27,0.04)]
                  "
                />

                {/* Bottom active line */}
                <div
                  className="
                    pointer-events-none
                    absolute
                    bottom-0
                    left-4
                    right-4
                    h-px
                    origin-left
                    scale-x-0
                    bg-gradient-to-r
                    from-cyan-500/70
                    to-blue-500/70
                    transition-transform
                    duration-500
                    group-focus-within:scale-x-100
                  "
                />
              </div>
            </div>

            {/* =================================================
                PASSWORD
            ================================================== */}

            <div className="group">
              <label
                className="
                  mb-2.5
                  block
                  text-sm
                  font-medium
                  text-zinc-600
                  transition-colors
                  duration-200
                  group-focus-within:text-zinc-900
                "
              >
                Password
              </label>

              <div className="relative">
                {/* Focus glow */}
                <div
                  className="
                    pointer-events-none
                    absolute
                    -inset-px
                    rounded-2xl
                    bg-gradient-to-r
                    from-cyan-300/0
                    via-cyan-300/0
                    to-blue-400/0
                    opacity-0
                    blur-sm
                    transition
                    duration-500
                    group-focus-within:from-cyan-300/15
                    group-focus-within:via-cyan-300/10
                    group-focus-within:to-blue-400/15
                    group-focus-within:opacity-100
                  "
                />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="
                    relative
                    w-full
                    rounded-2xl
                    border border-zinc-200
                    bg-zinc-50
                    px-4
                    py-4
                    pr-14
                    text-sm
                    text-zinc-900
                    outline-none
                    transition-all
                    duration-200
                    placeholder:text-zinc-400
                    hover:border-zinc-300
                    hover:bg-white
                    focus:border-zinc-400
                    focus:bg-white
                    focus:shadow-[0_0_0_4px_rgba(24,24,27,0.04)]
                  "
                />

                {/* Password toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="
                    absolute
                    right-2.5
                    top-1/2
                    flex
                    h-10
                    w-10
                    -translate-y-1/2
                    items-center
                    justify-center
                    rounded-xl
                    text-zinc-400
                    transition-all
                    duration-200
                    hover:bg-zinc-100
                    hover:text-zinc-900
                    active:scale-90
                  "
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>

                {/* Bottom active line */}
                <div
                  className="
                    pointer-events-none
                    absolute
                    bottom-0
                    left-4
                    right-4
                    h-px
                    origin-left
                    scale-x-0
                    bg-gradient-to-r
                    from-cyan-500/70
                    to-blue-500/70
                    transition-transform
                    duration-500
                    group-focus-within:scale-x-100
                  "
                />
              </div>
            </div>

            {/* =================================================
                LOGIN BUTTON
            ================================================== */}

            <button
              type="submit"
              disabled={loading}
              className="
                group/button
                relative
                flex
                w-full
                items-center
                justify-center
                gap-2
                overflow-hidden
                rounded-2xl
                border border-zinc-900
                bg-zinc-900
                px-5
                py-4
                text-sm
                font-semibold
                text-white
                shadow-[0_10px_30px_rgba(0,0,0,0.10)]
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:bg-zinc-800
                hover:shadow-[0_14px_40px_rgba(0,0,0,0.14)]
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
                    absolute
                    inset-y-0
                    -left-1/2
                    w-1/3
                    -skew-x-12
                    bg-gradient-to-r
                    from-transparent
                    via-white/[0.12]
                    to-transparent
                    transition-transform
                    duration-700
                    group-hover/button:translate-x-[430%]
                  "
                />
              )}

              {/* Hover background */}
              <span
                className="
                  absolute
                  inset-0
                  bg-gradient-to-r
                  from-zinc-800
                  via-zinc-900
                  to-zinc-800
                  opacity-0
                  transition-opacity
                  duration-300
                  group-hover/button:opacity-100
                "
              />

              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    Login
                    <ArrowRight
                      size={18}
                      className="
                        transition-all
                        duration-300
                        group-hover/button:translate-x-1
                      "
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
            {/* <div
      className="
        relative
        flex h-12 w-110
        items-center
        justify-center
        overflow-hidden
        rounded-xl
        border border-zinc-200
        bg-white
        p-1
        shadow-[0_8px_30px_rgba(0,0,0,0.07)]
        transition-all
        duration-300
        group-hover/brand:border-zinc-300
        group-hover/brand:shadow-[0_8px_35px_rgba(0,0,0,0.10)]
      "
    >
      <img
        src="/GVP_logo.png"
        alt="Glow Ventures"
        className="
          h-full
          w-full
          rounded-lg
          object-contain
          transition-transform
          duration-300
          group-hover/brand:scale-105
        "
      />
    </div> */}

            <div
              className="
    relative
    flex h-14 w-120
    items-center
    justify-center
    overflow-hidden
    rounded-xl
    p-1
  "
            >
              <img
                src="/GVP_logo.png"
                alt="Glow Ventures"
                className="
      h-full
      w-full
      rounded-lg
      object-contain
      transition-transform
      duration-300
      group-hover/brand:scale-105
    "
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;

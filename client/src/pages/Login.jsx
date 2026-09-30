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
      } else if (data.user.role === "employee") {
        navigate("/staff", { replace: true });
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
        relative flex min-h-screen items-center justify-center
        overflow-hidden bg-[#f0f0ee] px-4 py-6 text-zinc-900
        lg:h-screen lg:min-h-0 lg:px-6 lg:py-5
      "
    >
      {/* Background effects */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute -left-40 -top-40
          h-[420px] w-[420px] rounded-full
          bg-zinc-500/[0.06] blur-[120px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute -bottom-40 -right-40
          h-[420px] w-[420px] rounded-full
          bg-zinc-300/[0.12] blur-[120px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.9),transparent_62%)]
        "
      />

      {/* Main login shell */}
      <div
        className="
          relative z-10 grid w-full min-w-0 max-w-6xl
          overflow-hidden rounded-[28px] border border-zinc-200/80
          bg-white shadow-[0_32px_100px_rgba(24,24,27,0.12)]
          sm:rounded-[36px]

          lg:h-[calc(100vh-40px)]
          lg:max-h-[720px]
          lg:grid-cols-[1fr_0.9fr]
        "
      >
        {/* Left visual panel */}
        <aside
          className="
            relative hidden overflow-hidden
            bg-zinc-950 p-10 text-white
            lg:flex lg:flex-col lg:justify-between
            xl:p-12
          "
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div
              className="
                absolute -left-28 top-1/3 h-[34rem] w-[34rem]
                rounded-full
                bg-[radial-gradient(circle,rgba(255,255,255,0.13),transparent_68%)]
              "
            />

            <svg
              className="
                absolute -bottom-16 -right-40
                h-[34rem] w-[34rem] text-white/[0.15]
              "
              viewBox="0 0 600 600"
              fill="none"
            >
              <circle cx="300" cy="300" r="170" stroke="currentColor" />
              <circle
                cx="300"
                cy="300"
                r="230"
                stroke="currentColor"
                strokeDasharray="2 10"
              />
              <path
                d="M70 300h460M300 70v460"
                stroke="currentColor"
                strokeDasharray="1 9"
              />
            </svg>
          </div>

          {/* Desktop logo */}
          <a
            href="https://content.glowventures.org/"
            aria-label="Back to website"
            className="relative flex w-fit items-center gap-4"
          >
            <img
              src="/Logo.png"
              alt="Glow Ventures"
              className="
                h-8 w-auto max-w-[200px]
                object-contain
                brightness-0 invert
                opacity-95

                sm:h-10 sm:max-w-[240px]
                md:h-12 md:max-w-[280px]
                lg:h-14 lg:max-w-[320px]
                xl:h-[4rem] xl:max-w-[360px]
              "
            />
          </a>

          <div className="relative max-w-lg py-8 xl:py-10">
            <p className="text-sm text-zinc-400">
              A clearer way to move ideas forward.
            </p>

            <p
              className="
                mt-4 text-5xl font-medium leading-[0.98]
                tracking-[-0.065em] xl:text-[3.5rem]
              "
            >
              Your work,
              <br />
              <span className="text-zinc-500">all in one place.</span>
            </p>

            <p
              className="
                mt-5 max-w-sm text-sm leading-6 text-zinc-400
              "
            >
              Configure services, place orders, and keep track of the details
              from your client workspace.
            </p>
          </div>

          <p className="relative text-xs text-zinc-500">
            Strategy · Progress · Growth
          </p>
        </aside>

        {/* Login content */}
        <div
          className="
            mx-auto flex w-full min-w-0 max-w-md flex-col
            justify-center px-4 py-6
            sm:px-10 sm:py-8
            lg:max-w-[440px] lg:px-8 lg:py-6
            xl:px-10
          "
        >
          {/* Mobile logo */}
          <div className="mb-6 lg:hidden">
            <a
              href="https://content.glowventures.org/"
              aria-label="Back to website"
              className="inline-flex items-center"
            >
              <img
                src="/Logo.png"
                alt="Glow Ventures"
                className="
                  h-10 w-auto max-w-[220px]
                  object-contain
                "
              />
            </a>
          </div>

          {/* Header */}
          <div className="mb-6 lg:mb-5">
            <div
              className="
                mb-4 flex items-center gap-2
                text-xs font-medium uppercase
                tracking-[0.22em] text-zinc-400
              "
            >
              <Sparkles
                size={13}
                strokeWidth={1.6}
                className="text-zinc-500"
              />

              <span>Content Dashboard</span>
            </div>

            <h1
              className="
                text-4xl font-semibold
                tracking-[-0.04em] text-zinc-900
                sm:text-5xl lg:text-[2.75rem]
              "
            >
              Login
            </h1>

            <p
              className="
                mt-2 max-w-sm text-sm leading-6 text-zinc-500
              "
            >
              Sign in to access your content dashboard.
            </p>
          </div>

          {/* Login form */}
          <form
            onSubmit={handleSubmit}
            className="
              group/form relative overflow-hidden
              rounded-[28px] border border-zinc-200
              bg-white p-6
              shadow-[0_25px_80px_rgba(0,0,0,0.08)]
              sm:p-7
              lg:rounded-[24px] lg:p-6
            "
          >
            {/* Top highlight */}
            <div
              aria-hidden="true"
              className="
                pointer-events-none absolute inset-x-8 top-0 h-px
                bg-gradient-to-r from-transparent
                via-zinc-300 to-transparent
              "
            />

            {/* Card ambient glow */}
            <div
              aria-hidden="true"
              className="
                pointer-events-none absolute -right-24 -top-24
                h-48 w-48 rounded-full
                bg-zinc-300/[0.05] blur-3xl
                transition duration-700
                group-hover/form:bg-zinc-300/[0.08]
              "
            />

            {/* Error */}
            {error && (
              <div
                className="
                  relative mb-5 overflow-hidden rounded-2xl
                  border border-red-200 bg-red-50
                  px-4 py-3 text-sm text-red-600
                  shadow-[0_10px_40px_rgba(239,68,68,0.05)]
                "
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-red-400" />

                <span className="pl-2">{error}</span>
              </div>
            )}

            <div className="relative space-y-5">
              {/* Email / Username */}
              <div className="group">
                <label
                  htmlFor="login-identifier"
                  className="
                    mb-2 block text-sm font-medium
                    text-zinc-600 transition-colors duration-200
                    group-focus-within:text-zinc-900
                  "
                >
                  Email or Username
                </label>

                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="
                      pointer-events-none absolute -inset-px
                      rounded-2xl bg-gradient-to-r
                      from-zinc-300/0 via-zinc-300/0 to-zinc-500/0
                      opacity-0 blur-sm transition duration-500
                      group-focus-within:from-zinc-400/10
                      group-focus-within:via-zinc-400/10
                      group-focus-within:to-zinc-600/10
                      group-focus-within:opacity-100
                    "
                  />

                  <input
                    id="login-identifier"
                    type="text"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    autoComplete="username"
                    className="
                      relative w-full rounded-2xl
                      border border-zinc-200 bg-zinc-50
                      px-4 py-3.5 text-sm text-zinc-900
                      outline-none transition-all duration-200
                      placeholder:text-zinc-400
                      hover:border-zinc-300 hover:bg-white
                      focus:border-zinc-400 focus:bg-white
                      focus:shadow-[0_0_0_4px_rgba(24,24,27,0.04)]
                    "
                  />

                  <div
                    aria-hidden="true"
                    className="
                      pointer-events-none absolute bottom-0
                      left-4 right-4 h-px origin-left scale-x-0
                      bg-gradient-to-r from-zinc-500/50 to-zinc-900/50
                      transition-transform duration-500
                      group-focus-within:scale-x-100
                    "
                  />
                </div>
              </div>

              {/* Password */}
              <div className="group">
                <label
                  htmlFor="login-password"
                  className="
                    mb-2 block text-sm font-medium
                    text-zinc-600 transition-colors duration-200
                    group-focus-within:text-zinc-900
                  "
                >
                  Password
                </label>

                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="
                      pointer-events-none absolute -inset-px
                      rounded-2xl bg-gradient-to-r
                      from-zinc-300/0 via-zinc-300/0 to-zinc-500/0
                      opacity-0 blur-sm transition duration-500
                      group-focus-within:from-zinc-400/10
                      group-focus-within:via-zinc-400/10
                      group-focus-within:to-zinc-600/10
                      group-focus-within:opacity-100
                    "
                  />

                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    className="
                      relative w-full rounded-2xl
                      border border-zinc-200 bg-zinc-50
                      px-4 py-3.5 pr-14 text-sm text-zinc-900
                      outline-none transition-all duration-200
                      placeholder:text-zinc-400
                      hover:border-zinc-300 hover:bg-white
                      focus:border-zinc-400 focus:bg-white
                      focus:shadow-[0_0_0_4px_rgba(24,24,27,0.04)]
                    "
                  />

                  {/* Password toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="
                      absolute right-2.5 top-1/2
                      flex h-10 w-10 -translate-y-1/2
                      items-center justify-center rounded-xl
                      text-zinc-400 transition-all duration-200
                      hover:bg-zinc-100 hover:text-zinc-900
                      active:scale-90
                    "
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>

                  <div
                    aria-hidden="true"
                    className="
                      pointer-events-none absolute bottom-0
                      left-4 right-4 h-px origin-left scale-x-0
                      bg-gradient-to-r from-zinc-500/50 to-zinc-900/50
                      transition-transform duration-500
                      group-focus-within:scale-x-100
                    "
                  />
                </div>
              </div>

              {/* Login button */}
              <button
                type="submit"
                disabled={loading}
                className="
                  group/button relative flex w-full
                  items-center justify-center gap-2
                  overflow-hidden rounded-2xl
                  border border-zinc-900 bg-zinc-900
                  px-5 py-3.5 text-sm font-semibold text-white
                  shadow-[0_10px_30px_rgba(0,0,0,0.10)]
                  transition-all duration-300
                  hover:-translate-y-0.5 hover:bg-zinc-800
                  hover:shadow-[0_14px_40px_rgba(0,0,0,0.14)]
                  active:translate-y-0 active:scale-[0.985]
                  disabled:cursor-not-allowed disabled:opacity-50
                "
              >
                {/* Sliding shine */}
                {!loading && (
                  <span
                    aria-hidden="true"
                    className="
                      pointer-events-none absolute inset-y-0
                      -left-1/2 w-1/3 -skew-x-12
                      bg-gradient-to-r from-transparent
                      via-white/[0.12] to-transparent
                      transition-transform duration-700
                      group-hover/button:translate-x-[430%]
                    "
                  />
                )}

                {/* Hover background */}
                <span
                  aria-hidden="true"
                  className="
                    absolute inset-0
                    bg-gradient-to-r from-zinc-800
                    via-zinc-900 to-zinc-800
                    opacity-0 transition-opacity duration-300
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
                          transition-all duration-300
                          group-hover/button:translate-x-1
                        "
                      />
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>

          {/* Public website link */}
          <div className="mt-5 text-center">
            <a
              href="https://content.glowventures.org/"
              className="
                inline-flex items-center gap-1.5
                text-sm font-medium text-zinc-500
                transition-colors duration-200
                hover:text-zinc-900
              "
            >
              Back to Website
              <ArrowRight
                size={15}
                className="transition-transform duration-200 hover:translate-x-0.5"
              />
            </a>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
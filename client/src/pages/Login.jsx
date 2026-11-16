import { useRef, useState } from "react";
import { Eye, EyeOff, ArrowRight, Loader2, LayoutGrid, Mail, LockKeyhole } from "lucide-react";
import "../styles/public.css";
import "../styles/login.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authSessionContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const submitting = useRef(false);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting.current) return;

    setError("");

    if (!identifier.trim() || !password) {
      setError("Please enter your username/email and password.");
      return;
    }

    submitting.current = true;
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
      submitting.current = false;
      setLoading(false);
    }
  };

  return (
    <main className="glow-login">
      <div className="glow-login-shell">
        <aside className="glow-login-brand">
          <Link to="/" aria-label="Glow Ventures home"><img src="/Logo.png" alt="Glow Ventures" /></Link>
          <div>
            <p className="glow-login-eyebrow">A smart way to move ideas forward.</p>
            <h2>Your work,<br /><span>all in one place.</span></h2>
            <p>Configure services, place orders, and keep track of the details from your client workspace.</p>
          </div>
          <p>Strategy · Progress · Growth</p>
        </aside>
        <section className="glow-login-content" aria-labelledby="login-title">
          <Link to="/" className="glow-login-mobile-logo"><img src="/Logo.png" alt="Glow Ventures home" /></Link>
          <p className="glow-login-eyebrow"><LayoutGrid size={17} /> Content Dashboard</p>
          <h1 id="login-title">Login</h1>
          <p>Sign in to access your content dashboard.</p>
          <form onSubmit={handleSubmit} aria-busy={loading}>
            {error && <div className="glow-login-error" id="login-error" role="alert">{error}</div>}
            <div className="glow-login-field">
              <label htmlFor="login-identifier">Email or Username</label>
              <div className="glow-login-input"><Mail aria-hidden="true" />
                <input id="login-identifier" name="username" type="text" autoCapitalize="none" spellCheck={false} disabled={loading} value={identifier} onChange={event => setIdentifier(event.target.value)} autoComplete="username" placeholder="Enter your email or username" aria-describedby={error ? 'login-error' : undefined} />
              </div>
            </div>
            <div className="glow-login-field">
              <label htmlFor="login-password">Password</label>
              <div className="glow-login-input"><LockKeyhole aria-hidden="true" />
                <input id="login-password" name="password" disabled={loading} type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter your password" aria-describedby={error ? 'login-error' : undefined} />
                <button type="button" onClick={() => setShowPassword(current => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="public-button public-button--primary">{loading ? <><Loader2 size={18} className="animate-spin" /> Logging in...</> : <>Login <ArrowRight size={20} /></>}</button>
          </form>
          <Link to="/" className="glow-login-back">Back to Website <ArrowRight size={20} /></Link>
        </section>
      </div>
    </main>
  );
};
export default Login;

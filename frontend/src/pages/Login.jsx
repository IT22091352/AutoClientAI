import { useState } from "react";
import { loginUser } from "../services/api";

export default function Login({ onSuccess, onNavigateSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await loginUser({ email, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.userId || res.data.user?._id || "");
      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card glass-panel">
        <div className="eyebrow">AutoClient AI</div>
        <h1>Login to your SaaS dashboard</h1>
        <p className="muted">
          Manage WhatsApp automation, upgrade to Pro, and unlock premium sales workflows.
        </p>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        {error ? <div className="error-banner">{error}</div> : null}

        <button className="primary-button" onClick={handleLogin} disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>

        <p className="auth-switch muted">
          Don&apos;t have an account?{" "}
          <button type="button" className="link-button" onClick={onNavigateSignup}>
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
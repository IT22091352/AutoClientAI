import { useState } from "react";
import { signupUser } from "../services/api";

export default function Signup({ onNavigateLogin }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      return "All fields are required.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(form.email)) {
      return "Please enter a valid email address.";
    }

    if (form.password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    return "";
  };

  const handleSubmit = async () => {
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");

      await signupUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      alert("Signup successful! Please login.");

      if (onNavigateLogin) {
        onNavigateLogin();
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell auth-shell-light">
      <div className="auth-card light-card">
        <div className="eyebrow eyebrow-dark">AutoClient AI</div>
        <h1 className="title-dark">Create your account</h1>
        <p className="muted-dark">Start with free plan and upgrade to Pro anytime.</p>

        <label className="field field-light">
          <span>Name</span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="John Doe"
          />
        </label>

        <label className="field field-light">
          <span>Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="you@company.com"
          />
        </label>

        <label className="field field-light">
          <span>Password</span>
          <input
            type="password"
            value={form.password}
            onChange={(e) => onChange("password", e.target.value)}
            placeholder="At least 6 characters"
          />
        </label>

        {error ? <div className="error-banner error-banner-light">{error}</div> : null}

        <button className="primary-button" onClick={handleSubmit} disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p className="auth-switch muted-dark">
          Already have an account?{" "}
          <button type="button" className="link-button link-dark" onClick={onNavigateLogin}>
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

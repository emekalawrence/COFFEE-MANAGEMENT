import { apiUrl } from "~/lib/api";
import { useState } from "react";
import { useNavigate } from "react-router";
import "./StaffLogin.css";

function StaffLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Login failed.");
      }

      localStorage.setItem("staffToken", result.token);
      localStorage.setItem("staff", JSON.stringify(result.staff));

      navigate("/staff/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="staff-auth-page">
      <div className="staff-auth-ornament staff-auth-ornament-left" aria-hidden="true" />
      <div className="staff-auth-ornament staff-auth-ornament-right" aria-hidden="true" />

      <section className="staff-auth-card">
        <div className="staff-brand-block">
          <div className="staff-brand-badge">W</div>
          <div>
            <p className="staff-brand-eyebrow">Staff Portal</p>
            <h1>Welcome back</h1>
          </div>
        </div>

        <p className="staff-auth-subtitle">
          Access the coffee bar operations dashboard and menu management tools.
        </p>

        <form className="staff-auth-form" onSubmit={handleLogin}>
          <label className="staff-field">
            <span>Email address</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@wingscafe.com"
              required
            />
          </label>

          <label className="staff-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />
          </label>

          <button className="staff-primary-button" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          {error && (
            <p className="staff-error-banner" role="alert">
              {error}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}

export default StaffLogin;

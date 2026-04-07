import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useTheme } from "../context/ThemeContext";

const API_BASE_URI = (import.meta.env.VITE_API_BASE_URI || "http://localhost:5000").replace(/\/$/, "");
const API = `${API_BASE_URI}/api`;

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API}/users/login`, { email, password });
      localStorage.setItem("userInfo", JSON.stringify(data));
      toast.success("Welcome back!");
      navigate(data.role === "admin" ? "/admin" : "/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid credentials");
    }
  };

  return (
    <div className="auth-shell" style={{ position: "relative" }}>
      <button
        type="button"
        className="theme-toggle"
        onClick={toggleTheme}
        title={theme === "dark" ? "Light mode" : "Dark mode"}
        aria-label="Toggle theme"
        style={{ position: "absolute", top: "1rem", right: "1rem" }}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">RX</div>
          <div>
            <h1>ResolveX</h1>
          </div>
        </div>
        <p className="subtitle">Sign in to track complaints and resolutions.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="input"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Sign in
          </button>
        </form>
        <p className="auth-footer">
          No account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;

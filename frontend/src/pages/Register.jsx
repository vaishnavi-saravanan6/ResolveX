import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useTheme } from "../context/ThemeContext";

const API_BASE_URI = (import.meta.env.VITE_API_BASE_URI || "http://localhost:5000").replace(/\/$/, "");
const API = `${API_BASE_URI}/api`;

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API}/users/register`, {
        name,
        email,
        password,
      });
      localStorage.setItem("userInfo", JSON.stringify(data));
      toast.success("Account created!");
      navigate(data.role === "admin" ? "/admin" : "/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
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
            <h1>Join ResolveX</h1>
          </div>
        </div>
        <p className="subtitle">Report issues in one place—transparent and trackable.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reg-name">Full name</label>
            <input
              id="reg-name"
              className="input"
              type="text"
              autoComplete="name"
              placeholder="Jane Citizen"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
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
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Create account
          </button>
        </form>
        <p className="auth-footer">
          Already registered? <Link to="/">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;

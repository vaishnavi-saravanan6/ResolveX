import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export function AppChrome({ title, subtitle, actions }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");

  const goHome = () => {
    if (!userInfo) {
      navigate("/");
      return;
    }
    navigate(userInfo.role === "admin" ? "/admin" : "/dashboard");
  };

  return (
    <header className="app-header">
      <div className="app-header-left">
        <button
          type="button"
          className="auth-logo"
          onClick={goHome}
          title="Home"
          style={{ border: "none", cursor: "pointer" }}
        >
          RX
        </button>
        <div>
          <div className="app-title">{title}</div>
          {subtitle && (
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {actions}
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>
    </header>
  );
}

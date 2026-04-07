import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie } from "react-chartjs-2";
import { toast } from "react-toastify";
import { AppChrome } from "../components/AppChrome";

ChartJS.register(ArcElement, Tooltip, Legend);

const API = "http://localhost:5000/api";

function daysSince(dateStr) {
  if (!dateStr) return 0;
  return (Date.now() - new Date(dateStr)) / (1000 * 60 * 60 * 24);
}

function displayStatus(comp) {
  if (comp.status === "Pending" && daysSince(comp.createdAt) > 3) {
    return "Escalated";
  }
  return comp.status;
}

function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");

  useEffect(() => {
    if (!userInfo) {
      navigate("/");
    } else if (userInfo.role !== "admin") {
      navigate("/dashboard");
    } else {
      fetchAllComplaints();
      fetchStats();
    }
  }, []);

  const fetchAllComplaints = async () => {
    try {
      const { data } = await axios.get(`${API}/complaints`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setComplaints(data);
    } catch {
      toast.error("Failed to load complaints");
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API}/complaints/stats`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setStats(data);
    } catch {
      toast.error("Failed to load statistics");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `${API}/complaints/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );
      toast.success("Status updated");
      fetchAllComplaints();
      fetchStats();
    } catch {
      toast.error("Update failed");
    }
  };

  const filteredComplaints = useMemo(() => {
    return complaints.filter((comp) => {
      const q = search.toLowerCase();
      const blob = `${comp.title} ${comp.user?.name || ""} ${comp.referenceCode || ""}`.toLowerCase();
      const matchesSearch = !q || blob.includes(q);
      const st = displayStatus(comp);
      const matchesStatus =
        !filterStatus || st.toLowerCase() === filterStatus.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [complaints, search, filterStatus]);

  const chartData = {
    labels: ["Pending", "In progress", "Resolved", "Escalated"],
    datasets: [
      {
        data: [
          stats.pending || 0,
          stats.inProgress || 0,
          stats.resolved || 0,
          stats.escalated || 0,
        ],
        backgroundColor: ["#fbbf24", "#6366f1", "#34d399", "#f87171"],
        borderWidth: 0,
      },
    ],
  };

  const priorityChartData = {
    labels: ["High", "Medium", "Low"],
    datasets: [
      {
        data: [
          stats.highPriority || 0,
          stats.mediumPriority || 0,
          stats.lowPriority || 0,
        ],
        backgroundColor: ["#f87171", "#fbbf24", "#34d399"],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        labels: {
          color: "var(--text)",
          font: { family: "DM Sans, sans-serif" },
        },
      },
    },
  };

  if (!userInfo || userInfo.role !== "admin") return null;

  return (
    <>
      <AppChrome
        title="Admin command center"
        subtitle={`Hello, ${userInfo.name}`}
        actions={
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              localStorage.removeItem("userInfo");
              navigate("/");
            }}
          >
            Log out
          </button>
        }
      />
      <main className="app-main">
        <p className="page-lead">
          Live volume, SLA-style escalations, and a 7-day resolution pulse in one view.
        </p>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="value">{stats.total ?? 0}</div>
            <div className="label">Total</div>
          </div>
          <div className="stat-card">
            <div className="value" style={{ color: "var(--warning)" }}>
              {stats.pending ?? 0}
            </div>
            <div className="label">Pending (&lt; SLA)</div>
          </div>
          <div className="stat-card">
            <div className="value" style={{ color: "var(--accent)" }}>
              {stats.inProgress ?? 0}
            </div>
            <div className="label">In progress</div>
          </div>
          <div className="stat-card">
            <div className="value" style={{ color: "var(--success)" }}>
              {stats.resolved ?? 0}
            </div>
            <div className="label">Resolved</div>
          </div>
          <div className="stat-card">
            <div className="value" style={{ color: "var(--danger)" }}>
              {stats.escalated ?? 0}
            </div>
            <div className="label">Escalated / SLA</div>
          </div>
          <div className="stat-card">
            <div className="value" style={{ color: "var(--accent)" }}>
              {stats.resolvedLast7d ?? 0}
            </div>
            <div className="label">Resolved (7d)</div>
          </div>
        </div>

        <div className="charts-row">
          <div className="chart-box">
            <h3>Status distribution</h3>
            <div style={{ maxWidth: 320, margin: "0 auto" }}>
              <Pie data={chartData} options={chartOptions} />
            </div>
          </div>
          <div className="chart-box">
            <h3>Priority mix</h3>
            <div style={{ maxWidth: 320, margin: "0 auto" }}>
              <Pie data={priorityChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        <h2 className="page-heading" style={{ fontSize: "1.35rem", marginTop: "2rem" }}>
          Inbox
        </h2>
        <div className="filter-bar">
          <input
            className="input"
            style={{ flex: 1, minWidth: 200, maxWidth: "none" }}
            type="search"
            placeholder="Search title, citizen, ticket ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Escalated">Escalated</option>
          </select>
        </div>

        {filteredComplaints.length === 0 ? (
          <p className="empty-state">No complaints match this filter.</p>
        ) : (
          <div className="card-grid">
            {filteredComplaints.map((comp) => {
              const st = displayStatus(comp);
              const atRisk = comp.status === "Pending" && daysSince(comp.createdAt) > 3;
              return (
                <div key={comp._id} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                    <h3 style={{ margin: 0 }}>{comp.title}</h3>
                    {atRisk && <span className="badge-at-risk">SLA breach risk</span>}
                  </div>
                  {comp.referenceCode && (
                    <p style={{ margin: "0.35rem 0 0" }}>
                      <span className="ticket-ref">{comp.referenceCode}</span>
                    </p>
                  )}
                  <p style={{ margin: "0.5rem 0" }}>
                    <strong>Priority:</strong>{" "}
                    <span
                      style={{
                        color:
                          comp.priority === "High"
                            ? "var(--danger)"
                            : comp.priority === "Medium"
                              ? "var(--warning)"
                              : "var(--success)",
                      }}
                    >
                      {comp.priority}
                    </span>
                  </p>
                  <p style={{ margin: "0.5rem 0", color: "var(--text-muted)", fontSize: "0.95rem" }}>
                    {comp.description}
                  </p>
                  {comp.image && (
                    <img
                      className="complaint-img"
                      src={`http://localhost:5000/uploads/${comp.image}`}
                      alt=""
                    />
                  )}
                  <p style={{ fontSize: "0.9rem", margin: "0.5rem 0 0" }}>
                    <strong>Citizen:</strong> {comp.user?.name} ({comp.user?.email})
                  </p>
                  <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <label htmlFor={`st-${comp._id}`} style={{ fontWeight: 600 }}>
                      Status
                    </label>
                    <select
                      id={`st-${comp._id}`}
                      className="select"
                      style={{ maxWidth: 200 }}
                      value={comp.status}
                      onChange={(e) => updateStatus(comp._id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Escalated">Escalated</option>
                    </select>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Display: {st}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}

export default AdminDashboard;

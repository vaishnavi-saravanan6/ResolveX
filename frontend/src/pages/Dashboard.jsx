import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AppChrome } from "../components/AppChrome";

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

function Dashboard() {
  const [complaints, setComplaints] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    navigate("/");
  };

  const fetchComplaints = async () => {
    if (!userInfo?.token) return;
    try {
      const { data } = await axios.get(`${API}/complaints/my`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setComplaints(data);
    } catch {
      toast.error("Failed to load complaints");
    }
  };

  const deleteComplaint = async (id) => {
    if (!window.confirm("Delete this complaint? This cannot be undone.")) return;
    try {
      await axios.delete(`${API}/complaints/${id}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      toast.success("Complaint removed");
      fetchComplaints();
    } catch {
      toast.error("Could not delete");
    }
  };

  const copyRef = async (code) => {
    try {
      await navigator.clipboard.writeText(code || "");
      toast.success("Ticket ID copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  useEffect(() => {
    if (!userInfo) {
      navigate("/");
    } else if (userInfo.role === "admin") {
      navigate("/admin");
    } else {
      fetchComplaints();
    }
  }, []);

  const filtered = useMemo(() => {
    return complaints.filter((comp) => {
      const q = search.toLowerCase();
      const text = `${comp.title} ${comp.description} ${comp.category} ${comp.referenceCode || ""}`.toLowerCase();
      const matchSearch = !q || text.includes(q);
      const st = displayStatus(comp);
      const matchStatus =
        !filterStatus || st.toLowerCase() === filterStatus.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [complaints, search, filterStatus]);

  const getStatusColor = (status) => {
    if (status === "Resolved") return "var(--success)";
    if (status === "In Progress") return "var(--accent)";
    if (status === "Escalated") return "var(--danger)";
    return "var(--text-muted)";
  };

  const chipClass = (status) => {
    if (status === "Resolved") return "chip chip-resolved";
    if (status === "In Progress") return "chip chip-progress";
    if (status === "Escalated") return "chip chip-escalated";
    return "chip chip-pending";
  };

  if (!userInfo || userInfo.role === "admin") return null;

  return (
    <>
      <AppChrome
        title="My dashboard"
        subtitle={`Signed in as ${userInfo.name}`}
        actions={
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate("/create")}>
              + New complaint
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={handleLogout}>
              Log out
            </button>
          </>
        }
      />
      <main className="app-main">
        <p className="page-lead">
          Track ticket IDs, timelines, and SLA signals for everything you have reported.
        </p>

        <div className="filter-bar">
          <input
            className="input"
            style={{ flex: 1, minWidth: 200, maxWidth: "none" }}
            type="search"
            placeholder="Search title, ticket ID, category…"
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

        {filtered.length === 0 ? (
          <div className="card empty-state">
            <p>{complaints.length === 0 ? "You have no complaints yet." : "No matches for this filter."}</p>
            <button type="button" className="btn btn-primary" style={{ width: "auto", marginTop: "1rem" }} onClick={() => navigate("/create")}>
              File your first report
            </button>
          </div>
        ) : (
          <div className="card-grid">
            {filtered.map((comp) => {
              const st = displayStatus(comp);
              const openDays = Math.floor(daysSince(comp.createdAt));
              return (
                <div key={comp._id} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", flexWrap: "wrap" }}>
                    <h3 style={{ margin: 0 }}>{comp.title}</h3>
                    <span className={chipClass(st)}>{st}</span>
                  </div>
                  {comp.referenceCode && (
                    <p style={{ margin: "0.5rem 0 0" }}>
                      <span className="ticket-ref">{comp.referenceCode}</span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ marginLeft: "0.5rem", verticalAlign: "middle" }}
                        onClick={() => copyRef(comp.referenceCode)}
                      >
                        Copy ID
                      </button>
                    </p>
                  )}
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: "0.5rem 0" }}>
                    Open · day {openDays + 1}
                    {st === "Pending" && openDays >= 2 && (
                      <span className="badge-at-risk">SLA watch</span>
                    )}
                  </p>
                  <p style={{ margin: "0.5rem 0" }}>{comp.description}</p>
                  <p style={{ fontSize: "0.9rem", margin: 0 }}>
                    <strong>Category:</strong> {comp.category}
                    {" · "}
                    <strong>Priority:</strong>{" "}
                    <span
                      style={{
                        color:
                          comp.priority === "High"
                            ? "var(--danger)"
                            : comp.priority === "Low"
                              ? "var(--success)"
                              : "var(--warning)",
                      }}
                    >
                      {comp.priority}
                    </span>
                  </p>

                  {comp.statusHistory && comp.statusHistory.length > 0 && (
                    <div className="timeline">
                      <strong style={{ fontSize: "0.85rem" }}>Timeline</strong>
                      {comp.statusHistory.map((item, index) => (
                        <div key={index} className="timeline-item">
                          <div
                            className="timeline-dot"
                            style={{ backgroundColor: getStatusColor(item.status) }}
                          />
                          <p style={{ margin: 0, fontWeight: 600 }}>{item.status}</p>
                          <small style={{ color: "var(--text-muted)" }}>
                            {new Date(item.date).toLocaleString()}
                          </small>
                        </div>
                      ))}
                    </div>
                  )}

      {comp.image && (
                    <img
                      className="complaint-img"
                      src={`http://localhost:5000/uploads/${comp.image}`}
                      alt=""
                    />
                  )}
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    style={{ marginTop: "1rem" }}
                    onClick={() => deleteComplaint(comp._id)}
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}

export default Dashboard;

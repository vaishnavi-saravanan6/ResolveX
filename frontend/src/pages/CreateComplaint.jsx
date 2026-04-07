import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AppChrome } from "../components/AppChrome";
import { matchedHighKeywords, predictPriority } from "../utils/priorityPreview";

const API = "http://localhost:5000/api";

const CATEGORIES = [
  "Infrastructure",
  "Sanitation",
  "Water & power",
  "Roads & traffic",
  "Noise",
  "Parks",
  "Other",
];

function CreateComplaint() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(null);
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");

  const preview = useMemo(
    () => predictPriority(description, category),
    [description, category]
  );
  const keywordHits = useMemo(
    () => matchedHighKeywords(description),
    [description]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInfo?.token) {
      toast.error("Please sign in again");
      navigate("/");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      if (image) formData.append("image", image);

      await axios.post(`${API}/complaints`, formData, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Complaint filed—reference sent to your dashboard.");
      navigate("/dashboard");
    } catch {
      toast.error("Could not submit complaint");
    }
  };

  useEffect(() => {
    if (!userInfo?.token) navigate("/");
  }, [userInfo, navigate]);

  if (!userInfo?.token) return null;

  return (
    <>
      <AppChrome
        title="New complaint"
        subtitle="Smart routing matches urgency from your description."
        actions={
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate("/dashboard")}>
            Cancel
          </button>
        }
      />
      <main className="app-main">
        <div className="card" style={{ maxWidth: 640 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="c-title">Title</label>
              <input
                id="c-title"
                className="input"
                placeholder="Short summary of the issue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="c-category">Category</label>
              <select
                id="c-category"
                className="select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="c-desc">Description</label>
              <textarea
                id="c-desc"
                className="textarea"
                placeholder="Include location, time, and any safety details. Words like “urgent” or “leak” raise priority automatically."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="priority-preview">
              <div>
                <strong>Live priority preview:</strong>{" "}
                <span
                  style={{
                    color:
                      preview === "High"
                        ? "var(--danger)"
                        : preview === "Low"
                          ? "var(--success)"
                          : "var(--warning)",
                  }}
                >
                  {preview}
                </span>
              </div>
              {keywordHits.length > 0 && (
                <p style={{ margin: "0.5rem 0 0", color: "var(--text-muted)" }}>
                  Matched urgency cues: {keywordHits.join(", ")}
                </p>
              )}
              {category === "Infrastructure" && (
                <p style={{ margin: "0.5rem 0 0", color: "var(--text-muted)" }}>
                  Infrastructure is always treated as high priority.
                </p>
              )}
            </div>

            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label htmlFor="c-file">Photo (optional)</label>
              <input
                id="c-file"
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                style={{ fontSize: "0.9rem" }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
              <button type="submit" className="btn btn-primary" style={{ width: "auto", flex: 1 }}>
                Submit complaint
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

export default CreateComplaint;

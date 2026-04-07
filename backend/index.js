import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./Routes/userRoutes.js";
import complaintRoutes from "./Routes/complaintRoutes.js";
import path from "path";
import connectDB from "./config/db.js";


dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/uploads", express.static("uploads"));


// Test Route
app.get("/", (req, res) => {
  res.send("ResolveX API Running...");
});

// MongoDB Connection (cached for serverless)
connectDB()
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((err) => console.log("MongoDB Error:", err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

import express from "express";
import {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintStats,
  updateComplaintStatus
} from "../Controllers/complaintController.js";
import upload from "../Middleware/uploadMiddleware.js";

import { protect, adminOnly } from "../Middleware/authMiddleware.js";
import { deleteComplaint } from "../Controllers/complaintController.js";

const router = express.Router();

// User Routes

router.get("/my", protect, getMyComplaints);
router.get("/stats", protect, adminOnly, getComplaintStats);
router.post("/", protect, upload.single("image"), createComplaint);
router.delete("/:id", protect, deleteComplaint);

// Admin Routes
router.get("/", protect, adminOnly, getAllComplaints);
router.put("/:id", protect, adminOnly, updateComplaintStatus);
// Add status update route (for timeline)
router.put(
  "/:id/status",
  protect,        // your auth middleware
  adminOnly,      // if you have admin middleware
  updateComplaintStatus
);

export default router;

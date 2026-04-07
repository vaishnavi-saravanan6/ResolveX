import crypto from "crypto";
import Complaint from "../Models/Complaint.js";
import connectDB from "../config/db.js";

async function generateUniqueReferenceCode() {
  const year = new Date().getFullYear();
  for (let i = 0; i < 8; i++) {
    const seg = crypto.randomBytes(3).toString("hex").toUpperCase();
    const code = `RX-${year}-${seg}`;
    const exists = await Complaint.exists({ referenceCode: code });
    if (!exists) return code;
  }
  return `RX-${year}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

// ✅ Create Complaint (With Smart Priority)
export const createComplaint = async (req, res) => {
  try {
    await connectDB();
    const { title, description, category } = req.body;

    // 🔥 SMART PRIORITY LOGIC
    let priority = "Medium";

    const highPriorityKeywords = [
      "urgent",
      "immediately",
      "danger",
      "fire",
      "electric",
      "leak",
      "accident",
      "emergency",
    ];

    const descriptionText = description.toLowerCase();

    if (
      highPriorityKeywords.some((word) =>
        descriptionText.includes(word)
      )
    ) {
      priority = "High";
    }

    if (category === "Infrastructure") {
      priority = "High";
    }

    const referenceCode = await generateUniqueReferenceCode();

    const complaint = new Complaint({
      referenceCode,
      title,
      description,
      category,
      user: req.user._id,
      image: req.file ? req.file.filename : null,
      status: "Pending",
      priority,
    });

    const createdComplaint = await complaint.save();
    res.status(201).json(createdComplaint);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get My Complaints (User)
export const getMyComplaints = async (req, res) => {
  try {
    await connectDB();
    const complaints = await Complaint.find({ user: req.user._id });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get All Complaints (Admin) + AUTO ESCALATION
export const getAllComplaints = async (req, res) => {
  try {
    await connectDB();
    const complaints = await Complaint.find()
      .populate("user", "name email");

    const updatedComplaints = complaints.map((complaint) => {
      const daysPending =
        complaint.createdAt
          ? (Date.now() - new Date(complaint.createdAt)) /
            (1000 * 60 * 60 * 24)
          : 0;

      // Only modify response, NOT database
      if (
        complaint.status === "Pending" &&
        daysPending > 3
      ) {
        return {
          ...complaint._doc,
          status: "Escalated",
        };
      }

      return complaint;
    });

    res.status(200).json(updatedComplaints);

  } catch (error) {
    console.error("GET ALL ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update Complaint Status (Admin)
export const updateComplaintStatus = async (req, res) => {
  try {
    await connectDB();
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.status = req.body.status;

    if (req.body.status === "Resolved") {
      complaint.resolvedAt = new Date();
    } else {
      complaint.resolvedAt = undefined;
    }

    complaint.statusHistory.push({
      status: req.body.status,
      date: new Date()
    });

    await complaint.save();

    res.json({ message: "Status updated successfully", complaint });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Complaint Statistics (Enhanced Analytics)
export const getComplaintStats = async (req, res) => {
  try {
    await connectDB();
    const total = await Complaint.countDocuments();
    const inProgress = await Complaint.countDocuments({ status: "In Progress" });
    const resolved = await Complaint.countDocuments({ status: "Resolved" });
    const dbEscalated = await Complaint.countDocuments({ status: "Escalated" });

    const pendingDocs = await Complaint.find({ status: "Pending" }).select("createdAt");
    let pending = 0;
    let autoEscalated = 0;
    for (const c of pendingDocs) {
      const days =
        (Date.now() - new Date(c.createdAt)) / (1000 * 60 * 60 * 24);
      if (days > 3) autoEscalated++;
      else pending++;
    }

    const escalated = dbEscalated + autoEscalated;

    const highPriority = await Complaint.countDocuments({ priority: "High" });
    const mediumPriority = await Complaint.countDocuments({ priority: "Medium" });
    const lowPriority = await Complaint.countDocuments({ priority: "Low" });

    const resolvedLast7d = await Complaint.countDocuments({
      status: "Resolved",
      resolvedAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      total,
      pending,
      inProgress,
      resolved,
      escalated,
      highPriority,
      mediumPriority,
      lowPriority,
      resolvedLast7d,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete Complaint (User)
export const deleteComplaint = async (req, res) => {
  try {
    await connectDB();
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (complaint.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await complaint.deleteOne();
    res.json({ message: "Complaint deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
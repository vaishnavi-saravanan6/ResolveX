import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema({
  referenceCode: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Resolved", "Escalated"],
    default: "Pending"
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  image: {
  type: String,
  },
  priority: {
  type: String,
  enum: ["Low", "Medium", "High"],
  default: "Medium",
},
resolvedAt: {
  type: Date,
},
statusHistory: [
  {
    status: { type: String },
    date: { type: Date }
  }
],



}, { timestamps: true });

const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint;

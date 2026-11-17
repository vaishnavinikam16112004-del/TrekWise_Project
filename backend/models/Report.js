const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  routeId: { type: String, required: true },
  type: { type: String, enum: ["Slippery trail", "Blocked path", "Landslide", "Low water", "Other"], required: true },
  description: { type: String, required: true, maxlength: 500 },
  status: { type: String, enum: ["Pending review", "Verified", "Rejected"], default: "Pending review" },
  createdAt: { type: Date, default: Date.now },
  submittedBy: { type: String, default: "Community member" }
});

module.exports = mongoose.model("Report", reportSchema);

const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  medicines: [{ name: String, dosage: String, duration: String }],
  notes: String,
  downloaded: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Prescription", prescriptionSchema);

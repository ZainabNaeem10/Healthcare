const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema({
  day: String,
  startTime: String,
  endTime: String
});

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  specialization: { type: String, required: true },
  availability: [availabilitySchema],
  approved: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Doctor", doctorSchema);

const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const { verifyToken, authorizeRoles } = require("../middleware/auth");

// GET: Pending doctor approvals
router.get("/doctors/pending", verifyToken, authorizeRoles("ADMIN"), async (req, res) => {
  try {
    const pendingDoctors = await Doctor.find({ approved: false }).populate("userId", "name email");
    res.status(200).json(pendingDoctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT: Approve doctor
router.put("/doctors/approve/:id", verifyToken, authorizeRoles("ADMIN"), async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
    res.status(200).json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET: Analytics
router.get("/analytics", verifyToken, authorizeRoles("ADMIN"), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const totalAppointments = await Appointment.countDocuments();
    res.status(200).json({ totalUsers, totalDoctors, totalAppointments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

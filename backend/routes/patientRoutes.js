const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Prescription = require("../models/Prescription");
const User = require("../models/User");
const { verifyToken, authorizeRoles } = require("../middleware/auth");
const { sendEmail } = require("../utils/email");

// GET: List doctors
router.get(
  "/doctors",
  verifyToken,
  authorizeRoles("PATIENT"),
  async (req, res) => {
    try {
      const { specialization } = req.query;

      const doctors = await Doctor.find({
        specialization,
        approved: true
      }).populate("userId", "name email");

      res.status(200).json(doctors);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// POST: Book appointment
router.post(
  "/appointments",
  verifyToken,
  authorizeRoles("PATIENT"),
  async (req, res) => {
    try {
      const { doctorId, date, startTime, endTime } = req.body;

      const conflict = await Appointment.findOne({
        doctorId,
        date,
        $or: [
          { startTime: { $lt: endTime, $gte: startTime } },
          { endTime: { $gt: startTime, $lte: endTime } }
        ]
      });

      if (conflict)
        return res.status(400).json({ message: "Slot already booked" });

      const appointment = await Appointment.create({
        patientId: req.user.userId,
        doctorId,
        date,
        startTime,
        endTime,
        status: "CONFIRMED"
      });

      const patient = await User.findById(req.user.userId);
      const doctor = await Doctor.findById(doctorId).populate(
        "userId",
        "name email"
      );

      // Confirmation email (safe)
      try {
        await sendEmail(
          patient.email,
          "Appointment Confirmed",
          `Your appointment with Dr. ${doctor.userId.name} is confirmed on ${date} from ${startTime} to ${endTime}.`
        );
      } catch (err) {
        console.error("Email failed:", err.message);
      }

      res.status(201).json({
  message: "Appointment booked successfully",
  appointment
});

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET: Patient prescriptions
router.get(
  "/prescriptions",
  verifyToken,
  authorizeRoles("PATIENT"),
  async (req, res) => {
    try {
      const prescriptions = await Prescription.find({
        patientId: req.user.userId
      }).populate({
        path: "doctorId",
        populate: { path: "userId", select: "name email" }
      });

      res.status(201).json({
  message: "Prescription created successfully",
  prescription,
  pdfPath: `/prescriptions/prescription_${prescription._id}.pdf` // relative URL
});

    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;

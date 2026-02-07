const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const { verifyToken, authorizeRoles } = require("../middleware/auth");
const { generatePrescriptionPDF } = require("../utils/pdf");
const path = require("path");
const fs = require("fs");
const { sendEmail } = require("../utils/email");

// GET: Doctor appointments
router.get(
  "/appointments",
  verifyToken,
  authorizeRoles("DOCTOR"),
  async (req, res) => {
    try {
      const doctor = await Doctor.findOne({ userId: req.user.userId });

      // 🔴 IMPORTANT GUARD (FIX)
      if (!doctor) {
        return res.status(404).json({
          message: "Doctor profile not found. Please contact admin."
        });
      }

      const appointments = await Appointment.find({
        doctorId: doctor._id
      })
        .populate("patientId", "name email")
        .sort({ date: 1, startTime: 1 });

      res.status(200).json(appointments);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  }
);

// POST: Create prescription + PDF + Email
router.post(
  "/prescriptions",
  verifyToken,
  authorizeRoles("DOCTOR"),
  async (req, res) => {
    try {
      const { patientId, medicines, notes } = req.body;

      const doctor = await Doctor.findOne({ userId: req.user.userId })
        .populate("userId", "name email");

      const patient = await User.findById(patientId);

      const prescription = await Prescription.create({
        patientId,
        doctorId: doctor._id,
        medicines,
        notes
      });

      const prescriptionsDir = path.join(__dirname, "../prescriptions");
      if (!fs.existsSync(prescriptionsDir)) {
        fs.mkdirSync(prescriptionsDir, { recursive: true });
      }

      const filePath = path.join(
        prescriptionsDir,
        `prescription_${prescription._id}.pdf`
      );

      await generatePrescriptionPDF(
        {
          patientName: patient.name,
          doctorName: doctor.userId.name,
          specialization: doctor.specialization,
          medicines,
          notes
        },
        filePath
      );

      // Email (safe)
      try {
        await sendEmail(
          patient.email,
          "New Prescription Created",
          "Your prescription has been created. Please log in to view it."
        );
      } catch (emailErr) {
        console.error("Email failed:", emailErr.message);
      }

      res.status(201).json({
        message: "Prescription created successfully",
        prescription,
        pdfPath: filePath
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  }
);

// PUT: Update availability
router.put(
  "/schedule",
  verifyToken,
  authorizeRoles("DOCTOR"),
  async (req, res) => {
    try {
      const { availability } = req.body;

      const doctor = await Doctor.findOneAndUpdate(
        { userId: req.user.userId },
        { availability },
        { new: true }
      );

      res.status(200).json(doctor);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;

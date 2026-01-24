const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const { verifyToken, authorizeRoles } = require("../middleware/auth");
const { generatePrescriptionPDF } = require("../utils/pdf");
const path = require("path");

// GET: Doctor appointments
router.get("/appointments", verifyToken, authorizeRoles("DOCTOR"), async (req, res) => {
  try {
    // Populate patient details
    const doctor = await Doctor.findOne({ userId: req.user.userId });
    const appointments = await Appointment.find({ doctorId: doctor._id })
      .populate("patientId", "name email")
      .sort({ date: 1, startTime: 1 });

    res.status(200).json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST: Create prescription + generate PDF
router.post("/prescriptions", verifyToken, authorizeRoles("DOCTOR"), async (req, res) => {
  try {
    const { patientId, medicines, notes } = req.body;

    const doctor = await Doctor.findOne({ userId: req.user.userId });
    const prescription = await Prescription.create({
      patientId,
      doctorId: doctor._id,
      medicines,
      notes
    });

    // Generate PDF and save on server
    const filePath = path.join(__dirname, `../prescriptions/prescription_${prescription._id}.pdf`);
    generatePrescriptionPDF(prescription, filePath);

    // Optional: send email to patient with info
    const patient = await User.findById(patientId);
    const { sendEmail } = require("../utils/email");
    sendEmail(patient.email, "New Prescription Created", `A new prescription has been created for you.`);

    res.status(201).json({ prescription, pdfPath: filePath });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT: Update schedule/availability
router.put("/schedule", verifyToken, authorizeRoles("DOCTOR"), async (req, res) => {
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
});

module.exports = router;

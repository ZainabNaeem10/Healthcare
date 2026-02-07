const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const { verifyToken, authorizeRoles } = require("../middleware/auth");
const { generatePrescriptionPDF } = require("../utils/pdf");
const cloudinary = require("../utils/cloudinary"); // add cloudinary config
const streamifier = require("streamifier");
const { sendEmail } = require("../utils/email");

// GET: Doctor appointments (only active ones)
router.get(
  "/appointments",
  verifyToken,
  authorizeRoles("DOCTOR"),
  async (req, res) => {
    try {
      const doctor = await Doctor.findOne({ userId: req.user.userId });

      if (!doctor)
        return res.status(404).json({ message: "Doctor profile not found" });

      const appointments = await Appointment.find({
        doctorId: doctor._id,
        status: { $in: ["PENDING", "CONFIRMED"] },
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

// POST: Create prescription + PDF + Upload + Mark appointment completed
router.post(
  "/prescriptions",
  verifyToken,
  authorizeRoles("DOCTOR"),
  async (req, res) => {
    try {
      const { patientId, medicines, notes } = req.body;

      const doctor = await Doctor.findOne({ userId: req.user.userId }).populate(
        "userId",
        "name email"
      );
      if (!doctor) return res.status(404).json({ message: "Doctor not found" });

      const patient = await User.findById(patientId);
      if (!patient) return res.status(404).json({ message: "Patient not found" });

      // Create prescription record
      const prescription = await Prescription.create({
        patientId,
        doctorId: doctor._id,
        medicines,
        notes,
      });

      // Generate PDF buffer
      const pdfBuffer = await generatePrescriptionPDF({
        patientName: patient.name,
        doctorName: doctor.userId.name,
        specialization: doctor.specialization,
        medicines,
        notes,
      });

      // Upload PDF buffer to Cloudinary (or Railway storage)
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "raw", folder: "prescriptions" },
        async (error, result) => {
          if (error) return res.status(500).json({ message: error.message });

          // Save PDF URL to prescription
          prescription.pdfUrl = result.secure_url;
          await prescription.save();

          // Mark appointment as COMPLETED
          await Appointment.findOneAndUpdate(
            { patientId, doctorId: doctor._id, status: "CONFIRMED" },
            { status: "COMPLETED" }
          );

          // Send email to patient
          try {
            await sendEmail(
              patient.email,
              "New Prescription Created",
              `Your prescription has been created. Download it here: ${result.secure_url}`
            );
          } catch (emailErr) {
            console.error("Email failed:", emailErr.message);
          }

          res.status(201).json({
            message: "Prescription created successfully",
            prescription,
            pdfUrl: result.secure_url,
          });
        }
      );

      streamifier.createReadStream(pdfBuffer).pipe(uploadStream);
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

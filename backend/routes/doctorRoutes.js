const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const { verifyToken, authorizeRoles } = require("../middleware/auth");
const { generatePrescriptionPDF } = require("../utils/pdf");
const cloudinary = require("../utils/cloudinary"); // your cloudinary config
const streamifier = require("streamifier");
const { sendEmail } = require("../utils/email");

// GET: Doctor appointments (only active)
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
      const patient = await User.findById(patientId);

      const prescription = await Prescription.create({
        patientId,
        doctorId: doctor._id,
        medicines,
        notes
      });

      const pdfBuffer = await generatePrescriptionPDF({
        patientName: patient.name,
        doctorName: doctor.userId.name,
        specialization: doctor.specialization,
        medicines,
        notes
      });

      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "raw", folder: "prescriptions" },
        async (error, result) => {
          if (error) return res.status(500).json({ message: error.message });

          prescription.pdfUrl = result.secure_url;
          await prescription.save();

          await Appointment.findOneAndUpdate(
            { patientId, doctorId: doctor._id, status: "CONFIRMED" },
            { status: "COMPLETED" }
          );

          await sendEmail(
            patient.email,
            "New Prescription Created",
            `Your prescription has been created. Download here: ${result.secure_url}`
          );

          res.status(201).json({
            message: "Prescription created successfully",
            prescription,
            pdfUrl: result.secure_url
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


// PUT: Mark prescription as downloaded
router.put(
  "/prescriptions/:id/download",
  verifyToken,
  authorizeRoles("PATIENT"),
  async (req, res) => {
    try {
      const prescription = await Prescription.findByIdAndUpdate(
        req.params.id,
        { downloaded: true },
        { new: true }
      );
      res.status(200).json({ message: "Prescription marked as downloaded" });
    } catch (err) {
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

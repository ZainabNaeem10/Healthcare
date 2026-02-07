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
      console.log("🔵 /prescriptions HIT");
      console.log("REQ BODY 👉", req.body);

      const { appointmentId, patientId, medicines, notes } = req.body;

      console.log("APPOINTMENT ID 👉", appointmentId);
      console.log("PATIENT ID 👉", patientId);

      if (!appointmentId || !patientId) {
        console.log("❌ MISSING appointmentId or patientId");
        return res.status(400).json({
          message: "appointmentId or patientId missing"
        });
      }

      const doctor = await Doctor.findOne({ userId: req.user.userId })
        .populate("userId", "name email");

      if (!doctor) {
        console.log("❌ DOCTOR NOT FOUND");
        return res.status(404).json({ message: "Doctor not found" });
      }

      console.log("DOCTOR FOUND 👉", doctor._id);

      const patient = await User.findById(patientId);
      if (!patient) {
        console.log("❌ PATIENT NOT FOUND");
        return res.status(404).json({ message: "Patient not found" });
      }

      console.log("PATIENT FOUND 👉", patient._id);

      // ---------- PDF GENERATION ----------
      let pdfBuffer;
      try {
        pdfBuffer = await generatePrescriptionPDF({
          patientName: patient.name,
          doctorName: doctor.userId.name,
          specialization: doctor.specialization,
          medicines,
          notes
        });
        console.log("✅ PDF GENERATED (buffer length):", pdfBuffer.length);
      } catch (pdfErr) {
        console.error("❌ PDF GENERATION ERROR 👉", pdfErr);
        return res.status(500).json({ message: "PDF generation failed" });
      }

      // ---------- CLOUDINARY UPLOAD ----------
      let uploadResult;
      try {
        uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: "raw", folder: "prescriptions" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );

          streamifier.createReadStream(pdfBuffer).pipe(uploadStream);
        });

        console.log("✅ CLOUDINARY UPLOAD SUCCESS");
        console.log("PDF URL 👉", uploadResult.secure_url);

      } catch (cloudErr) {
        console.error("❌ CLOUDINARY ERROR 👉", cloudErr);
        return res.status(500).json({ message: "Cloudinary upload failed" });
      }

      // ---------- CREATE PRESCRIPTION ----------
      const prescription = await Prescription.create({
        patientId,
        doctorId: doctor._id,
        medicines,
        notes,
        pdfUrl: uploadResult.secure_url
      });

      console.log("✅ PRESCRIPTION SAVED 👉", prescription._id);

      // ---------- UPDATE APPOINTMENT ----------
      const updatedAppointment = await Appointment.findByIdAndUpdate(
        appointmentId,
        { status: "COMPLETED" },
        { new: true }
      );

      console.log("APPOINTMENT UPDATED 👉", updatedAppointment?._id);

      // ---------- EMAIL ----------
      try {
        await sendEmail(
          patient.email,
          "New Prescription Created",
          `Your prescription is ready.\nDownload: ${uploadResult.secure_url}`
        );
        console.log("✅ EMAIL SENT");
      } catch (emailErr) {
        console.error("⚠️ EMAIL FAILED 👉", emailErr.message);
      }

      return res.status(201).json({
        message: "Prescription created successfully",
        prescription
      });

    } catch (err) {
      console.error("🔥 UNHANDLED ERROR 👉", err);
      return res.status(500).json({ message: err.message });
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

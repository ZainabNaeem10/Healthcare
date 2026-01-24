const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Doctor = require("../models/Doctor");
const authController = require("../controllers/authController");

// ======================
// SIGNUP
// ======================
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role, specialization } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    // Create doctor record if role = DOCTOR
    let doctorRecord = null;
    if (role === "DOCTOR") {
      if (!specialization) {
        return res.status(400).json({
          message: "Specialization is required for doctors"
        });
      }

      doctorRecord = await Doctor.create({
        userId: user._id,
        specialization,
        availability: [],
        approved: false
      });
    }

    res.status(201).json({
      message: "User registered successfully",
      user,
      doctor: doctorRecord
    });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ======================
// LOGIN
// ======================
router.post("/login", authController.login);

module.exports = router;

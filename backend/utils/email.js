const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // e.g., smtp.gmail.com
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: `"Healthcare System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    });
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error(err);
  }
};

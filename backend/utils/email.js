const nodemailer = require("nodemailer");

exports.sendEmail = async (to, subject, text) => {
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });

  const info = await transporter.sendMail({
    from: '"Healthcare App" <no-reply@healthcare.com>',
    to,
    subject,
    text
  });

  console.log("Email Preview URL:", nodemailer.getTestMessageUrl(info));
};

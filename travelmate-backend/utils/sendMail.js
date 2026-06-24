const nodemailer = require('nodemailer');

// ✅ Create transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,     // Gmail address from .env
    pass: process.env.GMAIL_PASS      // App password from .env
  }
});

// ✅ Reusable email sending function
const sendMail = async (to, subject, text) => {
  const mailOptions = {
    from: `"Nomad" <${process.env.GMAIL_USER}>`,  // Shows as "Nomad" in inbox
    to,
    subject,
    text
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendMail;

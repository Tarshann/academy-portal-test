// utils/sendEmail.js
const nodemailer = require('nodemailer');

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Email body text
 * @param {string} html - Optional HTML body
 * @returns {Promise} - Resolves when email is sent
 */
const sendEmail = async (to, subject, text, html) => {
  // For development, log the email instead of sending
  console.log(`
    ---------------- EMAIL ----------------
    To: ${to}
    Subject: ${subject}
    Body: ${text}
    --------------------------------------
  `);
  
  // Uncomment this section when you're ready to actually send emails
  /*
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html: html || text,
  });
  */
  
  return true; // Simulate successful sending
};

module.exports = sendEmail;

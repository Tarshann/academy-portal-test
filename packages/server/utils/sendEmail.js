const nodemailer = require('nodemailer');

/**
 * Send an email using Nodemailer
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email address
 * @param {String} options.subject - Email subject
 * @param {String} options.text - Plain text email body
 * @param {String} options.html - HTML email body (optional)
 * @returns {Promise<object>} - Nodemailer info object
 */
const sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // Define email options
  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
  };

  // Add HTML content if provided
  if (options.html) {
    mailOptions.html = options.html;
  }

  // Send email
  const info = await transporter.sendMail(mailOptions);
  
  console.log(`Email sent: ${info.messageId}`);
  
  return info;
};

module.exports = sendEmail; 
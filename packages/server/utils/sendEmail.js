const nodemailer = require('nodemailer');

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email
 * @param {String} options.subject - Email subject
 * @param {String} options.text - Plain text content
 * @param {String} options.html - HTML content
 */
const sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Message options
  const message = {
    from: `${process.env.FROM_NAME || 'Academy Portal'} <${process.env.EMAIL_FROM}>`,
    to: options.to,
    subject: options.subject,
    text: options.text || 'No text content provided',
    html: options.html || '<p>No HTML content provided</p>',
  };

  // Send email
  const info = await transporter.sendMail(message);
  
  console.log(`Email sent: ${info.messageId}`);
  
  return info;
};

module.exports = sendEmail; 
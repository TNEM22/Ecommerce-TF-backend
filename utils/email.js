const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Function to send OTP email
const sendOTPEmail = async (userEmail, otp) => {
  // console.log(process.env.EMAIL_USERNAME, process.env.EMAIL_PASSWORD);
  // console.log(userEmail, otp);
  // console.log(path.join(__dirname, ''));
  const htmlTemplate = fs
    .readFileSync(path.join(__dirname, 'emailOTPTemplate.html'), 'utf8')
    .replace('{{OTP}}', otp);

  const mailOptions = {
    from: process.env.EMAIL,
    to: userEmail,
    subject: 'Your OTP for Signup',
    html: htmlTemplate,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.response}`);
  } catch (error) {
    console.error(`Error: ${error}`);
  }
};

const sendOrderPlacedEmail = async (userEmail, orderId, amount) => {
  const htmlTemplate = fs
    .readFileSync(path.join(__dirname, 'emailOrderPlacedTemplate.html'), 'utf8')
    .replace('{{orderId}}', orderId)
    .replace('{{amount}}', amount);

  const mailOptions = {
    from: process.env.EMAIL,
    to: userEmail,
    subject: 'Order Placed | TeamFortrans Electronics',
    html: htmlTemplate,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.response}`);
  } catch (error) {
    console.error(`Error: ${error}`);
  }
};

module.exports = { sendOTPEmail, sendOrderPlacedEmail };

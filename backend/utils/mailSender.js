const nodemailer = require("nodemailer");
require("dotenv").config();

const mailSender = async (email, title, body) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: 587, // standard SMTP port
      secure: false, // upgrade later with STARTTLS
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `Pixora || By iamahmarfaraz`,
      to: email,
      subject: title,
      html: body,
    });

    console.log("Mail sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Mail sending failed:", error.message);
    throw error;
  }
};

module.exports = mailSender;
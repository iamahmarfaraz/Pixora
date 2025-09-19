const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const otpTemplate = require("../mailTemplates/emailVerification");

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 5 * 60, // 5 minutes
  },
});

// auto-send OTP email on save
otpSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      await mailSender(
        this.email,
        "Pixora Email Verification",
        otpTemplate(this.otp)
      );
      console.log("OTP email sent to", this.email);
    } catch (err) {
      console.error("Error sending OTP email:", err.message);
    }
  }
  next();
});

module.exports = mongoose.model("Otp", otpSchema);
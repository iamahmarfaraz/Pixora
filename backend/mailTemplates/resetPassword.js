require("dotenv").config();

module.exports = function resetPasswordTemplate({
  resetUrl,
  username = "User",
  productName = "Pixora",
}) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${productName} — Reset your password</title>
  <style>
    body { margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial; background:#f7f7f9; color:#111; }
    a { color: inherit; text-decoration: none; }
    .container { max-width:640px; margin:24px auto; background: #ffffff; border-radius:12px; overflow:hidden; box-shadow: 0 8px 30px rgba(12,20,30,0.08); }
    .inner { padding:28px; }
    .brand { text-align:center; padding-top:18px; }
    .logo { width:96px; height:96px; border-radius:50%; display:inline-block; border:4px solid #fff; box-shadow: 0 6px 18px rgba(12,20,30,0.08); }
    h1 { font-size:20px; margin:18px 0 6px; }
    p.lead { margin:0 0 18px; color:#3a3a3a; line-height:1.5; }
    .cta { display:block; width:100%; max-width:320px; margin:18px auto; text-align:center; background:#ffd60a; color:#000; padding:14px 20px; font-weight:700; border-radius:10px; }
    .muted { color:#7b7b7b; font-size:13px; margin-top:18px; text-align:center; }
    .footer { padding:18px; text-align:center; color:#7b7b7b; font-size:13px; background: #fbfbfb; }
    @media (max-width:420px) {
      .inner { padding:18px; }
      .logo { width:72px; height:72px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">
      <img alt="${productName} logo" src="https://res.cloudinary.com/dqahlmqsd/image/upload/v1758279770/IMG_5557_nxxxvy.jpg" class="logo" />
    </div>

    <div class="inner">
      <h1>Password reset request</h1>
      <p class="lead">
        Hi ${username},<br/>
        We received a request to reset the password for your ${productName} account.
      </p>

      <p style="text-align:center;">
        <a href="${resetUrl}" class="cta" target="_blank" rel="noopener noreferrer">Reset my password</a>
      </p>

      <p class="muted">
        This link will expire in <strong>15 minutes</strong>.  
        If you didn’t request a password reset, you can ignore this email.
      </p>

      <hr style="border:0;border-top:1px solid rgba(0,0,0,0.06); margin:22px 0;" />
      <p style="font-size:13px; color:#6f7b86;">
        If the button doesn’t work, copy this link into your browser:<br/>
        <a href="${resetUrl}" target="_blank" rel="noopener noreferrer">${resetUrl}</a>
      </p>
    </div>

    <div class="footer">
      <div>${productName} • <a href="${process.env.FRONTEND_URL || '#'}" target="_blank">Open ${productName}</a></div>
    </div>
  </div>
</body>
</html>`;
};



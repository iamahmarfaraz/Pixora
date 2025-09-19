// backend/mailTemplates/emailVerification.js

const otpTemplate = (otp) => {
	return `<!DOCTYPE html>
	<html>
	<head>
		<meta charset="UTF-8">
		<title>OTP Verification Email</title>
		<style>
			body {
				background-color: #121212;
				font-family: Arial, sans-serif;
				font-size: 16px;
				line-height: 1.6;
				color: #e0e0e0;
				margin: 0;
				padding: 0;
			}
	
			.container {
				max-width: 600px;
				margin: 0 auto;
				padding: 30px 20px;
				text-align: center;
				background: #1e1e1e;
				border-radius: 12px;
				box-shadow: 0 4px 15px rgba(0,0,0,0.6);
			}
	
			.logo {
				margin-bottom: 20px;
			}
	
			.message {
				font-size: 22px;
				font-weight: bold;
				color: #FFD60A;
				margin-bottom: 20px;
			}
	
			.body {
				font-size: 16px;
				margin-bottom: 20px;
				color: #cccccc;
			}
	
			.cta {
				display: inline-block;
				padding: 12px 24px;
				background-color: #FFD60A;
				color: #000000 !important;
				text-decoration: none;
				border-radius: 6px;
				font-size: 16px;
				font-weight: bold;
				margin-top: 20px;
			}
	
			.support {
				font-size: 14px;
				color: #999999;
				margin-top: 20px;
			}
	
			.highlight {
				font-weight: bold;
				color: #ffffff;
				font-size: 24px;
				letter-spacing: 2px;
			}
		</style>
	</head>
	<body>
		<div class="container">
			<a href="https://pixora-app.vercel.app">
				<img class="logo"
					src="https://res.cloudinary.com/dqahlmqsd/image/upload/v1758279770/IMG_5557_nxxxvy.jpg"
					alt="Pixora Logo"
					style="width:120px; height:120px; border-radius:50%; object-fit:cover;" />
			</a>
			<div class="message">OTP Verification</div>
			<div class="body">
				<p>Dear User,</p>
				<p>Welcome to <b>Pixora</b> 🎉<br>
				To complete your registration, please use the following OTP:</p>
				<h2 class="highlight">${otp}</h2>
				<p>This OTP is valid for <b>5 minutes</b>.<br>
				If you did not request this verification, please ignore this email.</p>
			</div>
			<a class="cta" href="https://pixora-app.vercel.app">Go to Pixora</a>
			<div class="support">
				Need help? Contact us at 
				<a href="backahmar@gmail.com" style="color:#FFD60A;">support@pixora.com</a>
			</div>
		</div>
	</body>
	</html>`;
};

module.exports = otpTemplate;
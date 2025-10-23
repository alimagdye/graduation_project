function otpMailTemplate({ name, otp }) {
    return `
    <div style="font-family: Arial; padding: 20px;">
      <h2>Hi ${name},</h2>
      <p>Your verification code is:</p>
      <h1 style="color:#4CAF50;">${otp}</h1>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;
}

export default otpMailTemplate;

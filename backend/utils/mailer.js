const nodemailer = require('nodemailer');

// A single reusable SMTP transporter. Built lazily (not at module load) so
// missing env vars fail with a clear error only when an email is actually
// sent, rather than crashing the whole server on boot.
let transporter = null;
function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    throw new Error(
      'EMAIL_USER and EMAIL_APP_PASSWORD must be set in the environment to send OTP emails.'
    );
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD, // Gmail App Password, NOT the account password
    },
  });
  return transporter;
}

async function sendOtpEmail(to, code) {
  const mailer = getTransporter();
  await mailer.sendMail({
    from: `"Studiction" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Your Studiction verification code: ${code}`,
    text: `Your Studiction verification code is ${code}. It expires in 5 minutes. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #131319;">Verify your email</h2>
        <p style="color: #444;">Enter this code in Studiction to finish creating your account:</p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #10b981; margin: 24px 0;">${code}</p>
        <p style="color: #888; font-size: 13px;">This code expires in 5 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}



async function sendDoctorRequestAlert(doctor, patientName, siteUrl) {
  const mailer = getTransporter();
  await mailer.sendMail({
    from: `"Studiction" <${process.env.EMAIL_USER}>`,
    to: doctor.email,
    subject: `🔔 New chat request from ${patientName}`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f4f6fb;padding:24px;">
        <div style="max-width:480px;margin:auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="background:linear-gradient(135deg,#0d9488,#38bdf8);padding:20px 24px;">
            <h2 style="color:#ffffff;margin:0;font-size:18px;">Studiction — New Chat Request</h2>
          </div>
          <div style="padding:24px;">
            <p style="color:#334155;font-size:14px;margin:0 0 8px;">Assalam-o-Alaikum, <strong>${doctor.name}</strong>,</p>
            <p style="color:#475569;font-size:14px;line-height:1.6;">
              A patient has submitted a premium chat request:
            </p>
            <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:12px 16px;margin:16px 0;">
              <p style="margin:0;color:#0f766e;font-size:14px;">
                🧑 Patient: <strong>${patientName}</strong><br/>
                🕒 Time: <strong>${new Date().toLocaleString()}</strong>
              </p>
            </div>
            <p style="text-align:center;margin:24px 0;">
              <a href="${siteUrl}" style="background:#0d9488;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:14px;font-weight:bold;">
                Open Doctor Dashboard
              </a>
            </p>
            <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
              Log in to view the request and accept the session.
            </p>
          </div>
        </div>
      </div>
    `,
  });
}






async function sendRequestAcceptedEmail(to, patientName, doctorName, chatUrl) {
  const mailer = getTransporter();
  await mailer.sendMail({
    from: `"Studiction" <${process.env.EMAIL_USER}>`,
    to,
    subject: `✅ ${doctorName} accepted your request — join your session`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f4f6fb;padding:24px;">
        <div style="max-width:480px;margin:auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="background:linear-gradient(135deg,#0d9488,#38bdf8);padding:20px 24px;">
            <h2 style="color:#ffffff;margin:0;font-size:18px;">Your doctor is ready</h2>
          </div>
          <div style="padding:24px;">
            <p style="color:#334155;font-size:14px;margin:0 0 8px;">Dear <strong>${patientName}</strong>,</p>
            <p style="color:#475569;font-size:14px;line-height:1.6;">
              <strong>${doctorName}</strong> has accepted your chat request and is waiting for you.
              Tap below to join your session now.
            </p>
            <p style="text-align:center;margin:24px 0;">
              <a href="${chatUrl}" style="background:#0d9488;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:14px;font-weight:bold;">
                Join Your Chat
              </a>
            </p>
            <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
              Sessions last 20 minutes — find a quiet spot if you can.
            </p>
          </div>
        </div>
      </div>
    `,
  });
}





module.exports = { sendOtpEmail, sendDoctorRequestAlert, sendRequestAcceptedEmail };

const nodemailer = require("nodemailer");

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;

let transporter = null;

if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
} else {
  console.warn("Mail not configured: missing SMTP env vars");
}

async function sendMail({ to, subject, text, html }) {
  if (!transporter) return; // no-op if mail not configured
  const from = MAIL_FROM || SMTP_USER;
  try {
    await transporter.sendMail({ from, to, subject, text, html });
  } catch (err) {
    console.error("Mail send failed", err.message);
  }
}

module.exports = { sendMail };

const SibApiV3Sdk = require("@getbrevo/brevo");

const { BREVO_API_KEY, MAIL_FROM, MAIL_FROM_NAME } = process.env;

let apiInstance = null;

if (BREVO_API_KEY) {
  apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  apiInstance.setApiKey(
    SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
    BREVO_API_KEY
  );
} else {
  console.warn("Mail not configured: missing BREVO_API_KEY env var");
}

async function sendMail({ to, subject, text, html }) {
  if (!apiInstance) return; // no-op if mail not configured

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = {
    email: MAIL_FROM || "noreply@spandan2026.com",
    name: MAIL_FROM_NAME || "Prakhar Gupta",
  };
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.subject = subject;
  if (html) sendSmtpEmail.htmlContent = html;
  if (text) sendSmtpEmail.textContent = text;

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
  } catch (err) {
    console.error("Mail send failed", err.message || err);
  }
}

module.exports = { sendMail };

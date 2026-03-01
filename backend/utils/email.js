const { BrevoClient } = require("@getbrevo/brevo");

const client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });

/**
 * Send a welcome / account-creation email via Brevo.
 * Fires-and-forgets so signup response is never delayed.
 */
async function sendWelcomeEmail({ name, email, pid }) {
  try {
    await client.transactionalEmails.sendTransacEmail({
      sender: {
        name: process.env.BREVO_SENDER_NAME || "Spandan 2026",
        email: process.env.BREVO_SENDER_MAIL || "noreply@srmscetrevents.in",
      },
      to: [{ email, name }],
      subject: "Welcome to Spandan 2026! 🎉",
      htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin:0; padding:0; background:#F8F3E1; font-family: 'Segoe UI', Arial, sans-serif; }
    .container { max-width:600px; margin:30px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(65,67,27,0.12); }
    .header { background: linear-gradient(135deg, #41431B, #5a5d26); padding:32px 24px; text-align:center; color:#F8F3E1; }
    .header h1 { margin:0; font-size:28px; color:#F8F3E1; }
    .header p  { margin:8px 0 0; font-size:14px; color:#E3DBBB; }
    .body { padding:32px 24px; color:#41431B; line-height:1.7; }
    .body h2 { margin-top:0; color:#41431B; }
    .pid-box { background:#F8F3E1; border:1px dashed #AEB784; border-radius:8px; padding:16px; text-align:center; margin:20px 0; }
    .pid-box .label { font-size:12px; text-transform:uppercase; color:#41431B; margin-bottom:4px; opacity:0.7; }
    .pid-box .pid   { font-size:24px; font-weight:700; color:#41431B; letter-spacing:2px; }
    .footer { text-align:center; padding:20px 24px; font-size:12px; color:#41431B; background:#E3DBBB; }
    .footer a { color:#41431B; text-decoration:none; font-weight:600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Spandan 2026</h1>
      <p>SRMS CET&R Annual College Fest</p>
    </div>
    <div class="body">
      <h2>Hey ${name}! 👋</h2>
      <p>Your account has been created successfully.</p>
      <p>Welcome aboard!</p>
      <div class="pid-box">
        <div class="label">Your Participant ID</div>
        <div class="pid">${pid}</div>
      </div>
      <p>Use this Participant ID for all event registrations and on-ground check-ins during Spandan 2026.</p>
      <p>Head over to <a href="https://srmscetrevents.in" style="color:#41431B;font-weight:600;">srmscetrevents.in</a> to explore events and register now!</p>
      <p style="margin-top:20px;">See you at the fest! 🎶</p>
      <p style="margin:0;">With Regards</p>
      <p style="margin:0;">Prakhar Gupta</p>
      <p style="margin:0;">Vice-President</p>
      <br>
      <p> Contact +91 8090016216 for any queries</p>
    </div>
    <div class="footer">
      &copy; 2026 Spandan &mdash; SRMS CET&R. All rights reserved.<br/>
      <a href="https://srmscetrevents.in">srmscetrevents.in</a>
    </div>
  </div>
</body>
</html>`,
    });
    console.log(`[Brevo] Welcome email sent to ${email}`);
  } catch (err) {
    // Log but don't throw – email failure must not break signup
    console.error("[Brevo] Failed to send welcome email:", err?.body || err.message);
  }
}

/**
 * Send registration summary as a styled HTML email.
 * Called when user clicks "Export PDF" on their dashboard.
 */
async function sendRegistrationsPdfEmail({ name, email, pid, rollNumber, college, registrations }) {
  try {
    const generatedOn = new Date().toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    const eventRows = registrations.length === 0
      ? `<tr><td colspan="4" style="padding:14px;text-align:center;color:#888;">No event registrations found.</td></tr>`
      : registrations.map((reg, i) => {
          const title = reg?.event?.title || "Unknown Event";
          const status = reg?.status || "Confirmed";
          const team = reg?.teamName ? `<br/><span style="font-size:11px;color:#666;">Team: ${reg.teamName}</span>` : "";
          const members = Array.isArray(reg?.teamMembers) && reg.teamMembers.length > 0
            ? `<br/><span style="font-size:11px;color:#666;">Members: ${reg.teamMembers.map(m => `${m?.name || "Member"} (${m?.pid || "-"})`).join(", ")}</span>`
            : "";
          const tid = reg?.tid ? `<br/><span style="font-size:11px;color:#41431B;">TID: ${reg.tid}</span>` : "";
          const bg = i % 2 === 0 ? "#F8F3E1" : "#ffffff";
          return `<tr style="background:${bg};">
            <td style="padding:10px 12px;border-bottom:1px solid #E3DBBB;text-align:center;">${i + 1}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #E3DBBB;">${title}${team}${members}${tid}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #E3DBBB;text-align:center;">
              <span style="background:#E3DBBB;color:#41431B;padding:3px 10px;border-radius:12px;font-size:12px;">${status}</span>
            </td>
          </tr>`;
        }).join("");

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#F8F3E1;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(65,67,27,0.12);">
    <div style="background:linear-gradient(135deg,#41431B,#5a5d26);padding:28px 24px;text-align:center;color:#F8F3E1;">
      <h1 style="margin:0;font-size:24px;color:#F8F3E1;">My Registration Summary</h1>
      <p style="margin:6px 0 0;font-size:13px;color:#E3DBBB;">Spandan 2026 &mdash; Generated on ${generatedOn}</p>
    </div>

    <div style="padding:24px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr>
          <td style="padding:6px 0;font-weight:bold;color:#41431B;width:100px;opacity:0.7;">Name</td>
          <td style="padding:6px 0;color:#41431B;">${name}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-weight:bold;color:#41431B;opacity:0.7;">PID</td>
          <td style="padding:6px 0;color:#41431B;font-family:monospace;font-size:16px;font-weight:bold;letter-spacing:2px;">${pid}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-weight:bold;color:#41431B;opacity:0.7;">Roll No.</td>
          <td style="padding:6px 0;color:#41431B;">${rollNumber || "-"}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-weight:bold;color:#41431B;opacity:0.7;">College</td>
          <td style="padding:6px 0;color:#41431B;">${college || "-"}</td>
        </tr>
      </table>

      <h3 style="margin:0 0 12px;color:#41431B;">Events Registered (${registrations.length})</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #AEB784;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#41431B;color:#F8F3E1;">
            <th style="padding:10px 12px;text-align:center;font-size:12px;">#</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;">Event Name</th>
            <th style="padding:10px 12px;text-align:center;font-size:12px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${eventRows}
        </tbody>
      </table>
        <br>
        <p style="margin:0;font-size:14px;color:#41431B;">With Regards,</p>
        <p style="margin:0;font-size:12px;color:#41431B;">Prakhar Gupta</p>
        <p style="margin:0;font-size:12px;color:#41431B;">Vice-President</p>
        <br>
        <p style="color:#41431B;">for more queries contact +91 8090016216</p>
    </div>

    <div style="text-align:center;padding:18px 24px;font-size:12px;color:#41431B;background:#E3DBBB;">
      &copy; 2026 Spandan &mdash; SRMS CET&R. All rights reserved.<br/>
      <a href="https://srmscetrevents.in" style="color:#41431B;text-decoration:none;font-weight:600;">srmscetrevents.in</a>
    </div>
  </div>
</body>
</html>`;

    await client.transactionalEmails.sendTransacEmail({
      sender: {
        name: process.env.BREVO_SENDER_NAME || "Spandan 2026",
        email: process.env.BREVO_SENDER_MAIL || "noreply@srmscetrevents.in",
      },
      to: [{ email, name }],
      subject: `Your Spandan 2026 Registration Summary (${registrations.length} events)`,
      htmlContent,
    });
    console.log(`[Brevo] Registration summary email sent to ${email}`);
    return { success: true };
  } catch (err) {
    console.error("[Brevo] Failed to send registration summary email:", err?.body || err.message);
    return { success: false, error: err?.body?.message || err.message };
  }
}

module.exports = { sendWelcomeEmail, sendRegistrationsPdfEmail };

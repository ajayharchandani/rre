// src/services/emailService.js
const nodemailer = require('nodemailer');
const { organization } = require('../data/catalog');

// SMTP credentials are never hardcoded — set these as environment variables
// on the server (e.g. in your hosting provider's control panel, or a local
// .env file that's gitignored). See RFQ_EMAIL_SETUP.md for details.
//   SMTP_HOST, SMTP_PORT, SMTP_SECURE ("true"/"false"), SMTP_USER, SMTP_PASS
//   RFQ_NOTIFICATION_EMAIL (defaults to organization.contact.email)
let transporter = null;
let configWarningLogged = false;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    if (!configWarningLogged) {
      console.warn(
        '[emailService] SMTP_HOST / SMTP_USER / SMTP_PASS not set — RFQ notification emails ' +
        'will be skipped (still logged to the console) until SMTP is configured. See RFQ_EMAIL_SETUP.md.'
      );
      configWarningLogged = true;
    }
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : Number(SMTP_PORT) !== 587,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 10000
  });

  return transporter;
}

class EmailService {
  /**
   * Emails a submitted RFQ to the export desk. Never throws — a delivery
   * failure must not break the buyer's RFQ submission or confirmation page;
   * it's logged to the console instead so it's visible in server logs.
   */
  static async sendRfqNotification(rfqRecord) {
    const to = process.env.RFQ_NOTIFICATION_EMAIL || organization.contact.email;
    const { customer, requirement, files, score, refId } = rfqRecord;

    const lines = [
      `New RFQ submitted — Reference: ${refId}`,
      `Lead Score: ${score.score} (${score.band})`,
      '',
      '--- Buyer ---',
      `Name: ${customer.name || '(not provided)'}`,
      `Company: ${customer.company}`,
      `Email: ${customer.email || '(not provided)'}`,
      `WhatsApp: ${customer.whatsapp}`,
      `Country: ${customer.country || '(not provided)'}`,
      `Buyer Type: ${customer.buyerType}`,
      '',
      '--- Requirement ---',
      `Machine Brand: ${requirement.machineBrand || '(not provided)'}`,
      `Machine Model: ${requirement.machineModel || '(not provided)'}`,
      `Part Number(s): ${requirement.partNumber || '(not provided)'}`,
      `Description / Notes: ${requirement.description || '(not provided)'}`,
      `Quantity: ${requirement.quantity}`,
      `Urgency: ${requirement.urgency}`,
      `Preferred Shipping: ${requirement.shippingMethod}`,
      requirement.message ? `Additional Message: ${requirement.message}` : null,
      '',
      files.length ? `--- Attachments (${files.length}) ---` : null,
      ...files.map(f => `  ${f.originalName} (${(f.size / 1024).toFixed(0)} KB)`)
    ].filter(line => line !== null);

    const text = lines.join('\n');
    const html = `<pre style="font-family: monospace; font-size: 14px; white-space: pre-wrap;">${text.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))}</pre>`;

    const mail = {
      from: `"RRE International Website" <${process.env.SMTP_USER || organization.contact.email}>`,
      to,
      replyTo: customer.email || undefined,
      subject: `New RFQ ${refId} — ${customer.company || customer.name || 'Website Inquiry'} (${score.band} lead)`,
      text,
      html,
      attachments: (rfqRecord.filePaths || []).map((path, i) => ({
        filename: files[i] ? files[i].originalName : undefined,
        path
      }))
    };

    const t = getTransporter();
    if (!t) {
      console.log('[emailService] RFQ notification NOT sent (SMTP not configured). Would have sent:\n' + text);
      return { sent: false, reason: 'smtp_not_configured' };
    }

    try {
      await t.sendMail(mail);
      return { sent: true };
    } catch (err) {
      console.error(`[emailService] Failed to send RFQ notification for ${refId}:`, err.message);
      return { sent: false, reason: err.message };
    }
  }
}

module.exports = EmailService;

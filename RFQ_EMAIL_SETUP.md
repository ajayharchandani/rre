# RFQ Email Notifications — Setup

Every RFQ form submission is now emailed to your export desk inbox
(`info@rreinternational.com` by default) as soon as it's submitted, with
the buyer's contact details, requirement, lead score, and any uploaded
attachments (BOM/parts list, photos). The buyer's own email is set as the
Reply-To, so replying to the notification goes straight to them.

This requires SMTP credentials for the mailbox you want to send from. No
credentials are stored in the code — they're read from environment
variables at runtime.

## 1. Get SMTP credentials for info@rreinternational.com

If this mailbox is hosted on Hostinger (same as your domain/hosting), the
usual settings are:

- Host: `smtp.hostinger.com`
- Port: `465` (SSL) or `587` (TLS)
- Username: `info@rreinternational.com`
- Password: the mailbox's own password — found in hPanel under
  **Emails → Email Accounts → info@rreinternational.com → Connect Devices**
  (or reset it there if you don't have it handy)

If the mailbox is hosted elsewhere (Google Workspace, Microsoft 365,
another provider), use that provider's SMTP settings instead — the app
doesn't care who the host is, only that it's valid SMTP.

## 2. Set the environment variables

Copy `.env.example` to `.env` in the project root and fill in the real
values:

```
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@rreinternational.com
SMTP_PASS=your-mailbox-password
RFQ_NOTIFICATION_EMAIL=info@rreinternational.com
```

`.env` is already gitignored — it will never be committed.

**On your live server**, don't rely on a `.env` file unless you know your
host loads it — set the same variables directly in your hosting control
panel's "Environment Variables" section (Hostinger's Node.js app screen
has one) or in whatever process manager starts the app (PM2 ecosystem
file, systemd unit, etc.), so they're present in production the same way.

## 3. Verify

Restart the app after setting the variables, then submit a test RFQ from
`/rfq`. Check the server console:

- If you see `[emailService] SMTP_HOST / SMTP_USER / SMTP_PASS not set...`
  — the variables aren't being picked up; double-check step 2.
- If you see `[emailService] Failed to send RFQ notification...` with an
  error message — the credentials or host/port are likely wrong; the
  error message from your SMTP provider usually says why (auth failed,
  wrong port, etc.).
- If neither appears, the email sent — check the inbox.

Until SMTP is configured, RFQ submissions still work exactly as before
(the buyer still gets their confirmation page) — the email step is simply
skipped, and the full submission is logged to the server console instead
so nothing is silently lost.

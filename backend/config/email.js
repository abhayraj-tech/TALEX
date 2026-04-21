const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Send an email
 * @param {Object} opts - { to, subject, html, text }
 */
async function sendEmail({ to, subject, html, text }) {
    if (!process.env.SMTP_USER) {
        console.log(`[Email skipped – no SMTP config] To: ${to} | Subject: ${subject}`);
        return;
    }
    await transporter.sendMail({
        from:    `"TALEX" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]+>/g, '')
    });
}

// ── Email templates ──────────────────────────────────────────────────────────

function welcomeEmail(name) {
    return {
        subject: 'Welcome to TALEX 🚀',
        html: `
        <div style="font-family:Inter,sans-serif;background:#0a0a0f;color:#f1f5f9;padding:40px;border-radius:16px;max-width:600px;margin:0 auto;">
            <h1 style="background:linear-gradient(135deg,#7c3aed,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:2rem;">Welcome to TALEX, ${name}!</h1>
            <p style="color:#94a3b8;margin:1rem 0;">You've joined the skill economy. Your journey starts now.</p>
            <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin:20px 0;">
                <p style="margin:0;font-weight:600;">🎁 You've received <span style="color:#f59e0b;">100 free credits</span> to get started!</p>
            </div>
            <a href="${process.env.FRONTEND_URL}/dashboard" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:white;border-radius:12px;text-decoration:none;font-weight:600;margin-top:16px;">Go to Dashboard →</a>
            <p style="color:#94a3b8;font-size:0.85rem;margin-top:24px;">© 2026 TALEX. All rights reserved.</p>
        </div>`
    };
}

function waitlistConfirmEmail(email) {
    return {
        subject: "You're on the TALEX waitlist! 🎉",
        html: `
        <div style="font-family:Inter,sans-serif;background:#0a0a0f;color:#f1f5f9;padding:40px;border-radius:16px;max-width:600px;margin:0 auto;">
            <h1 style="background:linear-gradient(135deg,#7c3aed,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">You're on the list!</h1>
            <p style="color:#94a3b8;">We'll notify <strong>${email}</strong> when TALEX launches. Get ready to learn, earn, and get hired.</p>
            <p style="color:#94a3b8;font-size:0.85rem;margin-top:24px;">© 2026 TALEX. All rights reserved.</p>
        </div>`
    };
}

function contactAckEmail(name) {
    return {
        subject: 'We received your message – TALEX',
        html: `
        <div style="font-family:Inter,sans-serif;background:#0a0a0f;color:#f1f5f9;padding:40px;border-radius:16px;max-width:600px;margin:0 auto;">
            <h2 style="color:#f1f5f9;">Hi ${name},</h2>
            <p style="color:#94a3b8;">Thanks for reaching out! We've received your message and will get back to you within 24 hours.</p>
            <p style="color:#94a3b8;font-size:0.85rem;margin-top:24px;">© 2026 TALEX. All rights reserved.</p>
        </div>`
    };
}

module.exports = { sendEmail, welcomeEmail, waitlistConfirmEmail, contactAckEmail };

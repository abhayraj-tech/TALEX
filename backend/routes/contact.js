const express  = require('express');
const { body, validationResult } = require('express-validator');
const Contact  = require('../models/Contact');
const { sendEmail, contactAckEmail } = require('../config/email');

const router = express.Router();

// ── POST /api/contact ────────────────────────────────────────────────────────
router.post('/', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, subject, message } = req.body;

    try {
        await Contact.create({ name, email, subject, message });

        // Acknowledge sender
        const ack = contactAckEmail(name);
        sendEmail({ to: email, subject: ack.subject, html: ack.html }).catch(console.error);

        // Notify admin
        if (process.env.ADMIN_EMAIL) {
            sendEmail({
                to:      process.env.ADMIN_EMAIL,
                subject: `[TALEX Contact] ${subject}`,
                html:    `<p><strong>From:</strong> ${name} (${email})</p>
                          <p><strong>Subject:</strong> ${subject}</p>
                          <p><strong>Message:</strong></p>
                          <p>${message.replace(/\n/g, '<br>')}</p>`
            }).catch(console.error);
        }

        res.status(201).json({ message: "Thanks for reaching out! We'll get back to you within 24 hours." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error sending message. Please try again.' });
    }
});

module.exports = router;

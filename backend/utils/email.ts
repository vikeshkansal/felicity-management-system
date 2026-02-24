import nodemailer from "nodemailer";

const getEmailConfig = () => {
    const host = process.env.EMAIL_HOST;
    const port = Number(process.env.EMAIL_PORT || 587);
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    const from = process.env.EMAIL_FROM || user;
    const secure = process.env.EMAIL_SECURE === "true";

    if (!host || !user || !pass || Number.isNaN(port)) {
        return null;
    }

    return { host, port, user, pass, from, secure };
};

export const sendRegistrationEmail = async (to: string, eventName: string, ticketId: string, eventDate?: string, participantName?: string): Promise<void> => {
    const config = getEmailConfig();
    if (!config) {
        console.error("[email] Missing/invalid SMTP config. Expected EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS");
        return;
    }

    const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.user,
            pass: config.pass,
        },
    });

    const mailOptions = {
        from: config.from,
        to,
        subject: `Registration Confirmation for ${eventName}`,
        html: `
            <h2>Registration Confirmation</h2>
            <p>Hello ${participantName || "Participant"},</p>
            <p>You have been successfully registered for the event:</p>
            <ul>
                <li><strong>Event:</strong> ${eventName}</li>
                <li><strong>Ticket ID:</strong> ${ticketId}</li>
                ${eventDate ? `<li><strong>Date:</strong> ${eventDate}</li>` : ""}
            </ul>
            <p>Please keep your ticket ID handy for reference.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("[email] Error sending registration email:", {
            to,
            eventName,
            ticketId,
            error
        });
    }
};
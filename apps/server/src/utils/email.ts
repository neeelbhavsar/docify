import nodemailer from 'nodemailer';

interface SendEmailOptions {
    email: string;
    subject: string;
    message: string;
    html?: string;
}

export const sendEmail = async (options: SendEmailOptions) => {
    // Basic fallback for development without SMTP setup.
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️ SMTP not fully configured in env variables, printing email to console instead:');
        console.log(`================================`);
        console.log(`TO: ${options.email}`);
        console.log(`SUBJECT: ${options.subject}`);
        console.log(`MESSAGE:\n${options.message}`);
        console.log(`================================`);
        return;
    }

    // Create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    // Define the email options
    const mailOptions = {
        from: `DevVault <${process.env.SMTP_FROM_EMAIL || 'noreply@devvault.local'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
};

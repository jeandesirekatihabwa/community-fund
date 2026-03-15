const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // This should be an App Password
    },
});

const sendVerificationEmail = async (email, code) => {
    const mailOptions = {
        from: `"Community Fund" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify your Community Fund Account',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                <h2 style="color: #4f46e5; text-align: center;">Welcome to Community Fund!</h2>
                <p>Thank you for signing up. Please use the verification code below to confirm your account:</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">${code}</span>
                </div>
                <p>This code will expire in 1 hour.</p>
                <p style="font-size: 12px; color: #6b7280; margin-top: 40px; text-align: center;">
                    If you didn't create an account, you can safely ignore this email.
                </p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${email}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send verification email');
    }
};

module.exports = { sendVerificationEmail };

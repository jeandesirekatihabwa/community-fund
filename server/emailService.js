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
        from: `"Community Fund Support" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `${code} is your Community Fund verification code`,
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 40px auto; padding: 40px; border-radius: 24px; background-color: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #f0f0f0;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <div style="display: inline-block; width: 48px; height: 48px; background: #4f46e5; border-radius: 12px; color: #ffffff; font-size: 24px; font-weight: 900; line-height: 48px; text-align: center;">C</div>
                </div>
                <h1 style="color: #1a1a1a; font-size: 24px; font-weight: 800; text-align: center; margin-bottom: 8px; letter-spacing: -0.02em;">Verify your account</h1>
                <p style="color: #666666; font-size: 15px; line-height: 24px; text-align: center; margin-bottom: 32px;">To complete your secure setup and join the community, please enter the following 6-digit code.</p>
                
                <div style="background-color: #f8fafc; padding: 32px; border-radius: 20px; text-align: center; border: 1px solid #e2e8f0; margin-bottom: 32px;">
                    <span style="font-family: 'SF Mono', 'Fira Code', monospace; font-size: 40px; font-weight: 800; letter-spacing: 8px; color: #1e293b;">${code}</span>
                </div>
                
                <p style="color: #94a3b8; font-size: 13px; line-height: 20px; text-align: center; margin-bottom: 0;">This security code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
                
                <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid #f0f0f0; text-align: center;">
                    <p style="color: #cbd5e1; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin: 0;">Secure Infrastructure &bull; 256-bit AES</p>
                </div>
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

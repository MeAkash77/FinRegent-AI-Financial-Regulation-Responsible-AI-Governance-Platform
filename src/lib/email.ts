import nodemailer from 'nodemailer';

// Email configuration interface
interface EmailConfig {
    host: string;
    port: number;
    auth: {
        user: string;
        pass: string;
    };
}

// Get email configuration from environment variables
const getEmailConfig = (): EmailConfig => {
    return {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
        },
    };
};

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
    const config = getEmailConfig();
    
    if (!config.auth.user || !config.auth.pass) {
        console.warn('SMTP credentials not configured. Email functionality will not work.');
        return null;
    }

    return nodemailer.createTransport(config);
};

// Email sending interface
export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

// Send email function
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
        const transporter = createTransporter();
        
        if (!transporter) {
            console.error('Email transporter not configured');
            return false;
        }

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

// Test email configuration
export async function testEmailConfiguration(): Promise<boolean> {
    try {
        const transporter = createTransporter();
        
        if (!transporter) {
            console.error('Email transporter not configured');
            return false;
        }

        await transporter.verify();
        console.log('SMTP connection verified successfully');
        return true;
    } catch (error) {
        console.error('SMTP connection verification failed:', error);
        return false;
    }
}

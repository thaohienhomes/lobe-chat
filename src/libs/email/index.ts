import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'hi@pho.chat';

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export const EmailService = {
    /**
     * Send an email using Resend
     */
    send: async ({ to, subject, html, text }: EmailOptions) => {
        try {
            if (!process.env.RESEND_API_KEY) {
                console.warn('⚠️ RESEND_API_KEY not found. Email sending skipped.');
                return { success: false, error: 'Missing API Key' };
            }

            const { data, error } = await resend.emails.send({
                from: `Phở Chat <${FROM_EMAIL}>`,
                to,
                subject,
                html,
                text,
            });

            if (error) {
                console.error('❌ EmailService Error:', error);
                return { success: false, error };
            }

            console.log(`✅ Email sent to ${to} (ID: ${data?.id})`);
            return { success: true, data };
        } catch (err) {
            console.error('❌ EmailService Unexpected Error:', err);
            return { success: false, error: err };
        }
    },
};

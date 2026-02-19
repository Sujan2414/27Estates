import { Resend } from 'resend';

// Initialize Resend with API key from environment variable
// Add RESEND_API_KEY to your .env.local file
export const resend = new Resend(process.env.RESEND_API_KEY);

// Your verified "from" email domain
// Once you verify your domain in Resend, update this
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
export const FROM_NAME = '27 Estates';

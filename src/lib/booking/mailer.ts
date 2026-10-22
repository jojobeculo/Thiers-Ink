import nodemailer, { type Transporter } from 'nodemailer';
import {
  BOOKING_FROM,
  BOOKING_TO,
  SMTP_HOST,
  SMTP_PASS,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
} from 'astro:env/server';
import { site } from '../../config/site';

export class MailNotConfiguredError extends Error {
  constructor() {
    super('SMTP non configuré (SMTP_HOST, SMTP_USER, SMTP_PASS).');
  }
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) throw new MailNotConfiguredError();
  transporter ??= nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return transporter;
}

export interface BookingMail {
  subject: string;
  text: string;
  replyTo: { name: string; address: string };
  attachment?: { filename: string; content: Buffer; contentType: string };
}

export async function sendBookingMail(mail: BookingMail): Promise<void> {
  const transport = getTransporter();
  await transport.sendMail({
    from: { name: `${site.name} — site web`, address: BOOKING_FROM || SMTP_USER! },
    to: BOOKING_TO || site.email,
    replyTo: mail.replyTo,
    subject: mail.subject,
    text: mail.text,
    attachments: mail.attachment ? [mail.attachment] : [],
  });
}

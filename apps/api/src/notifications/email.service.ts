import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';

function hasRealEnv(name: string) {
  const value = String(process.env[name] ?? '').trim();
  if (!value) return false;
  return !['seuemail@gmail.com', 'senha_app', 'PROPPGI <seuemail@gmail.com>'].includes(value);
}

@Injectable()
export class EmailService {
  private smtpConfigured() {
    return (
      hasRealEnv('SMTP_HOST') &&
      hasRealEnv('SMTP_PORT') &&
      hasRealEnv('SMTP_USER') &&
      hasRealEnv('SMTP_PASS') &&
      hasRealEnv('SMTP_FROM')
    );
  }

  async send(to: string, subject: string, html: string) {
    if (!this.smtpConfigured()) {
      throw new Error(
        'SMTP não configurado. Defina SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS e SMTP_FROM.',
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE ?? '').toLowerCase() === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
  }
}

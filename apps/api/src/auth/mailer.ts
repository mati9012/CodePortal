import { Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import { BIT_ATTACHMENT, type RenderedEmail } from '../emails/index.js';

const log = new Logger('Mailer');

/**
 * Wysyłka e-maili (szablony React Email w src/emails, podgląd: `pnpm email:dev`).
 * Bez SMTP_URL (dev) treść i link lądują w logu API zamiast w skrzynce.
 */
let transport: Transporter | null | undefined;

function getTransport() {
  if (transport === undefined) {
    transport = process.env.SMTP_URL ? createTransport(process.env.SMTP_URL) : null;
  }
  return transport;
}

export async function sendMail(to: string, email: Promise<RenderedEmail> | RenderedEmail) {
  const { subject, html, text } = await email;
  const t = getTransport();
  if (!t) {
    log.log(`[bez SMTP_URL] „${subject}” do ${to}\n${text}`);
    return;
  }
  try {
    const info = await t.sendMail({
      from: process.env.MAIL_FROM ?? 'CodePortal <no-reply@codeportal.local>',
      to,
      subject,
      text,
      html,
      attachments: [BIT_ATTACHMENT],
    });
    log.log(`Wysłano „${subject}” do ${to} (${info.messageId})`);
  } catch (err) {
    log.error(`Nie udało się wysłać „${subject}” do ${to}: ${(err as Error).message}`);
    throw err;
  }
}

import { render } from '@react-email/components';
import { fileURLToPath } from 'node:url';
import type { ReactElement } from 'react';
import ResetPassword from './reset-password.js';
import VerifyEmail from './verify-email.js';

/** Bit dołączany do każdego maila jako obraz inline (`cid:bit`). */
export const BIT_ATTACHMENT = {
  filename: 'bit.png',
  cid: 'bit',
  // dist/emails/index.js → src/emails/static (w obrazie Dockera kopiowane obok dist).
  path: fileURLToPath(new URL('../../src/emails/static/bit.png', import.meta.url)),
};

export type RenderedEmail = { subject: string; html: string; text: string };

async function renderEmail(subject: string, element: ReactElement): Promise<RenderedEmail> {
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);
  return { subject, html, text };
}

const webUrl = () => process.env.WEB_ORIGIN ?? 'http://localhost:3000';
const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

export const emails = {
  verifyEmail: (name: string, url: string) =>
    renderEmail(
      'Potwierdź adres e-mail w CodePortal',
      <VerifyEmail name={firstName(name)} url={url} webUrl={webUrl()} bitSrc="cid:bit" />,
    ),
  resetPassword: (name: string, url: string) =>
    renderEmail(
      'Ustaw nowe hasło w CodePortal',
      <ResetPassword name={firstName(name)} url={url} webUrl={webUrl()} bitSrc="cid:bit" />,
    ),
};

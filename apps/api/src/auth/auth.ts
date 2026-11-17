import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { Db } from '../db/index.js';
import { accounts, authSessions, users, verifications } from '../db/schema.js';
import { emails } from '../emails/index.js';
import { sendMail } from './mailer.js';

const DAY_IN_SECONDS = 60 * 60 * 24;
const SESSION_TTL_SECONDS = 30 * DAY_IN_SECONDS;
const SESSION_REFRESH_SECONDS = DAY_IN_SECONDS;

export function createAuth(db: Db) {
  const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
  const cookieDomain = process.env.COOKIE_DOMAIN;

  return betterAuth({
    appName: 'CodePortal',
    baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:4000',
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [webOrigin],
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: { user: users, session: authSessions, account: accounts, verification: verifications },
    }),
    user: {
      additionalFields: {
        role: { type: 'string', required: false, defaultValue: 'organizer', input: false },
        orgId: { type: 'string', required: false, input: false },
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 8,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        await sendMail(user.email, emails.resetPassword(user.name, url));
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        const link = new URL(url);
        link.searchParams.set('callbackURL', `${webOrigin}/weryfikacja`);
        await sendMail(user.email, emails.verifyEmail(user.name, link.toString()));
      },
    },
    session: {
      expiresIn: SESSION_TTL_SECONDS,
      updateAge: SESSION_REFRESH_SECONDS,
    },
    rateLimit: {
      customRules: {
        '/sign-in/email': { window: 60, max: 5 },
        '/request-password-reset': { window: 300, max: 3 },
      },
    },
    advanced: {
      cookiePrefix: 'cp',
      database: { generateId: 'uuid' },
      ...(cookieDomain && { crossSubDomainCookies: { enabled: true, domain: cookieDomain } }),
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

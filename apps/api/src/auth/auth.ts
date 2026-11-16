import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { Db } from '../db/index.js';
import { accounts, authSessions, users, verifications } from '../db/schema.js';
import { emails } from '../emails/index.js';
import { sendMail } from './mailer.js';

/**
 * Logowanie kont nauczycieli/organizatorów (SPEC: moduł auth, DESIGN: ekrany B1–B8).
 * Endpointy pod `${BETTER_AUTH_URL}/api/auth/*` — montowane w main.ts przed parserem JSON.
 * Uczniowie nie mają kont: wchodzą kodem testu i dostają osobny token sesji egzaminu.
 */
export function createAuth(db: Db) {
  const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
  // Front i API na subdomenach tej samej domeny (np. codeportal.mkucio.pl + api.mkucio.pl):
  // ciasteczko z Domain=mkucio.pl widzą oba. Lokalnie zbędne — ciasteczka nie zależą od portu.
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
        // Rolę i szkołę ustawia serwer (onboarding, zaproszenia) — nie formularz rejestracji.
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
        // Każdy link (po rejestracji, przy logowaniu, ponowna wysyłka) kończy na ekranie B5.
        const link = new URL(url);
        link.searchParams.set('callbackURL', `${webOrigin}/weryfikacja`);
        await sendMail(user.email, emails.verifyEmail(user.name, link.toString()));
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 dni
      updateAge: 60 * 60 * 24, // przedłużana raz na dobę aktywności
    },
    rateLimit: {
      // Domyślnie włączony tylko w produkcji; logowanie ma ostrzejszy limit.
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

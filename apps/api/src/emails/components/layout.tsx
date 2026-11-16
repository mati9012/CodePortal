import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import type { ReactNode } from 'react';
import { emailTheme } from './theme.js';

export type EmailLayoutProps = {
  /** Tekst podglądu w skrzynce (obok tematu). */
  preview: string;
  /** Adres strony (WEB_ORIGIN) do linków w stopce. */
  webUrl: string;
  /**
   * Źródło grafiki Bita. Przy wysyłce `cid:bit` (załącznik inline, działa też lokalnie),
   * w podglądzie `email dev` plik ze `src/emails/static`.
   */
  bitSrc?: string;
  children: ReactNode;
};

/** Wspólna rama e-maili: logo, karta z Bitem na gradiencie jak w panelu logowania, stopka. */
export function EmailLayout({ preview, webUrl, bitSrc = '/static/bit.png', children }: EmailLayoutProps) {
  const host = webUrl.replace(/^https?:\/\//, '');
  return (
    <Html lang="pl">
      <Tailwind config={emailTheme}>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="color-scheme" content="light" />
          <meta name="supported-color-schemes" content="light" />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@700;800&display=swap"
          />
        </Head>
        <Preview>{preview}</Preview>
        <Body className="m-0 bg-canvas py-10 font-sans">
          <Container className="mx-auto w-full max-w-[560px] px-4">
            {/* Logo: znak </> w niebieskim kwadracie + nazwa (bez SVG — Gmail go nie pokaże). */}
            <Section className="mb-6 px-1">
              <table role="presentation" cellPadding={0} cellSpacing={0}>
                <tbody>
                  <tr>
                    <td className="h-[30px] w-[30px] rounded-[8px] bg-accent text-center align-middle font-mono text-[12px] font-bold leading-[30px] text-white">
                      {'</>'}
                    </td>
                    <td className="pl-[10px] font-display text-[17px] font-bold tracking-tight text-ink">
                      CodePortal
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>

            <Section className="overflow-hidden rounded-[20px] border border-solid border-line bg-surface">
              {/* Pas z Bitem na miękkim gradiencie akcent → mięta */}
              <Section
                className="bg-accent-soft px-8 pb-6 pt-9 text-center"
                style={{ backgroundImage: 'linear-gradient(135deg, #eef2ff 0%, #f0fdfa 100%)' }}
              >
                <Img src={bitSrc} width="131" height="140" alt="" className="mx-auto block" />
              </Section>
              <Section className="px-8 pb-9 pt-8 max-sm:px-6">{children}</Section>
            </Section>

            <Section className="px-1 pt-6">
              <Text className="m-0 text-[12px] leading-[18px] text-ink-3">
                Sprawdziany z programowania, które oceniają się same.
                <br />
                Wiadomość wysłana automatycznie — nie odpowiadaj na nią.
              </Text>
              <Text className="m-0 mt-3 text-[12px] leading-[18px] text-ink-3">
                <Link href={webUrl} className="text-ink-3 underline">
                  {host}
                </Link>
                {' · '}
                <Link href={`${webUrl}/regulamin`} className="text-ink-3 underline">
                  Regulamin
                </Link>
                {' · '}
                <Link href={`${webUrl}/prywatnosc`} className="text-ink-3 underline">
                  Prywatność
                </Link>
                {' · © 2026 CodePortal'}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

/** Etykieta nad tytułem, jak `Eyebrow` na stronie. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <Text className="m-0 mb-2 text-[12px] font-semibold uppercase leading-[16px] tracking-[0.08em] text-accent-ink">
      {children}
    </Text>
  );
}

/** Akcja główna + zapasowy link pod kreską. */
export function ActionBlock({ label, url, note }: { label: string; url: string; note: string }) {
  return (
    <>
      <Section className="my-7">
        <Link
          href={url}
          className="box-border inline-block rounded-[12px] bg-accent px-6 py-[14px] text-center text-[15px] font-semibold leading-[20px] text-white no-underline"
        >
          {label}
        </Link>
      </Section>
      <Section className="rounded-[12px] bg-subtle px-4 py-3">
        <Text className="m-0 text-[13px] leading-[20px] text-ink-2">{note}</Text>
      </Section>
      <Hr className="my-7 border-line" />
      <Text className="m-0 text-[12px] leading-[18px] text-ink-3">
        Przycisk nie działa? Skopiuj ten adres do przeglądarki:
      </Text>
      <Text className="m-0 mt-1 break-all text-[12px] leading-[18px]">
        <Link href={url} className="text-accent-ink underline">
          {url}
        </Link>
      </Text>
    </>
  );
}

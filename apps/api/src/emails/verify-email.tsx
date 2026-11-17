import { Heading, Text } from '@react-email/components';
import { ActionBlock, EmailLayout, Eyebrow } from './components/layout.js';

export type VerifyEmailProps = { name: string; url: string; webUrl: string; bitSrc?: string };

export default function VerifyEmail({ name, url, webUrl, bitSrc }: VerifyEmailProps) {
  return (
    <EmailLayout preview="Jedno kliknięcie i możesz tworzyć pierwszy test." webUrl={webUrl} bitSrc={bitSrc}>
      <Eyebrow>Potwierdzenie konta</Eyebrow>
      <Heading as="h1" className="m-0 font-display text-[28px] font-extrabold leading-[36px] tracking-[-0.02em] text-ink">
        Cześć {name}, jeszcze tylko jeden klik!
      </Heading>
      <Text className="m-0 mt-4 text-[15px] leading-[24px] text-ink-2">
        Dzięki za założenie konta w CodePortal. Potwierdź adres e-mail, a od razu zalogujemy cię do
        panelu — tam w kilka minut przygotujesz pierwszy sprawdzian.
      </Text>
      <ActionBlock
        label="Potwierdź adres e-mail"
        url={url}
        note="Link działa przez godzinę. Jeśli to nie ty zakładasz konto — po prostu zignoruj tę wiadomość."
      />
    </EmailLayout>
  );
}

VerifyEmail.PreviewProps = {
  name: 'Anna',
  url: 'http://localhost:4000/api/auth/verify-email?token=przyklad&callbackURL=http%3A%2F%2Flocalhost%3A3000%2Fweryfikacja',
  webUrl: 'http://localhost:3000',
} satisfies VerifyEmailProps;

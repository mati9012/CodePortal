import { Heading, Text } from '@react-email/components';
import { ActionBlock, EmailLayout, Eyebrow } from './components/layout.js';

export type ResetPasswordProps = { name: string; url: string; webUrl: string; bitSrc?: string };

export default function ResetPassword({ name, url, webUrl, bitSrc }: ResetPasswordProps) {
  return (
    <EmailLayout preview="Link do ustawienia nowego hasła działa przez godzinę." webUrl={webUrl} bitSrc={bitSrc}>
      <Eyebrow>Reset hasła</Eyebrow>
      <Heading as="h1" className="m-0 font-display text-[28px] font-extrabold leading-[36px] tracking-[-0.02em] text-ink">
        Ustawmy nowe hasło
      </Heading>
      <Text className="m-0 mt-4 text-[15px] leading-[24px] text-ink-2">
        Cześć {name}, ktoś (miejmy nadzieję, że ty) poprosił o zmianę hasła do konta w CodePortal.
        Kliknij przycisk i wpisz nowe hasło — po zmianie wylogujemy cię ze wszystkich urządzeń.
      </Text>
      <ActionBlock
        label="Ustaw nowe hasło"
        url={url}
        note="Link działa przez godzinę i tylko raz. Jeśli to nie ty — zignoruj tę wiadomość, hasło się nie zmieni."
      />
    </EmailLayout>
  );
}

ResetPassword.PreviewProps = {
  name: 'Anna',
  url: 'http://localhost:4000/api/auth/reset-password/przyklad?callbackURL=http%3A%2F%2Flocalhost%3A3000%2Fnowe-haslo',
  webUrl: 'http://localhost:3000',
} satisfies ResetPasswordProps;

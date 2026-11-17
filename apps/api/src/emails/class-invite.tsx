import { Heading, Text } from '@react-email/components';
import { ActionBlock, EmailLayout, Eyebrow } from './components/layout.js';

export type ClassInviteProps = {
  name: string;
  teacher: string;
  group: string;
  url: string;
  webUrl: string;
  bitSrc?: string;
};

export default function ClassInvite({
  name,
  teacher,
  group,
  url,
  webUrl,
  bitSrc,
}: ClassInviteProps) {
  return (
    <EmailLayout
      preview={`${teacher} dodał(a) cię do: ${group}.`}
      webUrl={webUrl}
      bitSrc={bitSrc}
    >
      <Eyebrow>Zaproszenie do klasy</Eyebrow>
      <Heading
        as="h1"
        className="m-0 font-display text-[28px] font-extrabold leading-[36px] tracking-[-0.02em] text-ink"
      >
        Cześć {name}, jesteś na liście {group}
      </Heading>
      <Text className="m-0 mt-4 text-[15px] leading-[24px] text-ink-2">
        {teacher} dodał(a) cię do grupy „{group}” w CodePortal. Testy z
        programowania będziesz pisać w przeglądarce — kod testu poda nauczyciel
        na lekcji.
      </Text>
      <ActionBlock
        label="Otwórz CodePortal"
        url={url}
        note="Jeśli nie znasz tego nauczyciela, zignoruj tę wiadomość."
      />
    </EmailLayout>
  );
}

ClassInvite.PreviewProps = {
  name: 'Ola',
  teacher: 'Anna Nowak',
  group: '3B',
  url: 'http://localhost:3000',
  webUrl: 'http://localhost:3000',
} satisfies ClassInviteProps;

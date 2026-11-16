# CodePortal — design system 2.0 (notatki z projektu)

Źródło: `CodePortal.pdf` (design system 2.0, listopad 2026, 42 strony, ponad 120 ekranów i stanów).
PDF to płaskie zrzuty — grafiki (maskotka Bit) trzeba dostać osobno jako PNG/SVG.

## Marka

- **Hasło:** „Sprawdziany z kodu, które ocenia Bit.” / „Sprawdzian z programowania w 5 minut. Ocenia się sam.”
- **Maskotka Bit** (nazwa robocza) — robot-programista, rozmiary XL 240 px (hero, logowanie, CTA), L 150 px (sukces, powitanie), M 84 px (puste stany), S 56 px (checklista, toasty).
  - **Jest:** hero, logowanie, końcowe CTA, powitanie i checklista „Pierwsze kroki”, puste stany z CTA, sukces („Test zakończony”, dołączanie kodem).
  - **Nie ma:** w widoku zadania i podczas testu, przy ostrzeżeniach (fullscreen, wklejanie), w raporcie samodzielności i przy ryzyku, w błędach systemowych i przy ocenach ucznia.
- Logo: ikona `</>` w niebieskim zaokrąglonym kwadracie + „CodePortal”.
- Język interfejsu: polski, zwracanie się na „ty”; zdarzenia anty-AI to zawsze „sygnały do oceny nauczyciela, nie automatyczny werdykt”.

## Kolory

| Akcja · Blue | | Marka · Mint (z Bita) | |
| --- | --- | --- | --- |
| 50 | `#EEF2FF` | 50 | `#F0FDFA` |
| 100 | `#DFE6FF` | 100 | `#CCFBF1` |
| 300 | `#9AB2FF` | 300 | `#5EEAD4` |
| 500 | `#335CFF` | 500 | `#14B8A6` |
| 600 | `#2447E0` | 700 | `#0F766E` |
| 800 | `#1A36B8` | 900 | `#0B2A28` |

| Neutralne | jasny | ciemny (IDE) |
| --- | --- | --- |
| canvas | `#F6F7FB` | `#090B12` |
| surface | `#FFFFFF` | `#11141D` |
| subtle | `#F1F3F8` | `#181C27` |
| border | `#E6E9F0` | `#222737` |
| text-2 | `#475569` | `#A3ADC2` |
| text | `#0F172A` | `#F1F5F9` |

Neutralne są chłodne (slate), nie szare. Primary = blue-500, hover ciemniejszy (600).

**Werdykty** (pigułki z ikoną, kod monospace): OK zielony · WA czerwony · TLE żółty/bursztynowy · MLE pomarańczowy · RE różowy/czerwony · CE fioletowy · „Ocenianie…” niebieski ze spinnerem. Kolory semantyczne bez zmian względem v1 — zmienił się tylko kształt pigułki.

**Ryzyko samodzielności (0–100):** Niskie zielone · Średnie pomarańczowe · Wysokie czerwone (próg oznaczenia w wynikach: ≥ 60).
**Statusy ucznia:** online (zielony) · offline (pusty) · bezczynny (pomarańczowy) · zakończył (niebieski).

## Typografia

| Rola | Font | Rozmiar / interlinia |
| --- | --- | --- |
| Display | Plus Jakarta Sans 800 | 56/62 |
| H1 | Plus Jakarta Sans 800 | 32/40 |
| H3 | Plus Jakarta Sans 700 | 18/26 |
| Body | Inter 400 | 14/22 |
| Code | JetBrains Mono | 14/22, bez ligatur |

Nagłówki z ciasnym trackingiem. Etykiety sekcji: małe wersaliki z rozstrzeleniem (np. „ZADANIE 2 Z 4 · 30 PKT”).

## Kształty i głębia

- Promienie: **8** tag · **10** input / przycisk · **14** karta · **20** modal · pigułka (pełne zaokrąglenie).
- Cienie: **sm** karty · **md** popover · **lg** modal.
- Przyciski: primary / secondary (obrys) / ghost / danger / link; stany default, hover, focus (ring), disabled, loading (spinner + „Wysyłanie…”), z ikoną. Rozmiary sm 28 · md 36 · lg 44.

## Komponenty (strona 3–4)

Formularze (input z sufiksem „min”, błąd pod polem, licznik znaków 48/280, checkbox, radio, toggle), selection cards (poziom ochrony Luźny / Standard / Egzamin), zakładki (podkreślenie + segmented control), verdict pill, score chip, risk meter, kropki statusu, timer (normalny / < 10 min bursztynowy / < 5 min czerwony / „Czas minął”), wskaźnik autozapisu, kafelki zadań w nagłówku testu („1 · 100”, „2 · 70”, aktywny z obrysem), bannery (błąd / ostrzeżenie / info z akcją), toasty z akcją „Cofnij”, modal blokujący, karty statystyk, histogram ocen 1–6, diff oczekiwane/otrzymane, pusty stan z Bitem i CTA, stepper kreatora, wiersz rankingu.

Wzorce stanów dla ekranów z danymi (S.1–S.3): skeleton zachowujący układ tabeli/kart; pusty stan zawsze z CTA; błąd mówi co się stało, co zrobić, ma „Spróbuj ponownie”, „Status systemu” i ID błędu.

## Layouty

- **Aplikacja organizatora:** lewy sidebar (logo; Pulpit, Testy i konkursy, Bank zadań, Klasy i grupy, Wyniki z licznikiem, Ustawienia; na dole przełącznik organizacji i użytkownik z planem), górny pasek z wyszukiwarką „Ctrl K” i dzwonkiem, treść na `canvas`, karty na `surface`. Okruszki nad tytułem H1, akcje po prawej.
- **Widok testu ucznia (E2):** ciemny motyw IDE domyślnie. Pasek: nazwa testu + klasa/nauczyciel, kafelki zadań z punktami, „Zapisano 2 s temu”, „Połączono”, timer, przełącznik motywu, „Zakończ test”. Lewa kolumna: treść zadania (tagi, Wejście/Wyjście, przykład z „Kopiuj do konsoli”, limity). Prawa: Monaco (język, plik, „Formatuj ⇧⌥F”, A−/A+ rozmiar fontu), pod spodem panel Konsola / Przykłady / Zgłoszenia z przyciskami Uruchom · Sprawdź na przykładach · Zgłoś rozwiązanie i tabelą wyników testów.
- **Auth:** karta 400 px z logo; na desktopie lewa połowa z ciemnym hero i podglądem produktu.
- **E-maile:** jedna kolumna 560 px, logo, treść, jeden przycisk, stopka.

## Mapa ekranów

Oznaczenia z PDF. „później” = poza MVP według projektu. Ekrany pełnostronicowe bez podpisu w PDF (szczegóły testu, edytor zadania, raport ucznia, profil) mają oznaczenia F6 / F9 / F16 / G1 nadane w tych notatkach.

| Sekcja | Ekrany |
| --- | --- |
| **A · Publiczne** | A1 strona główna (hero + „Masz kod testu?”, 3 kroki, Edytor, Ocenianie, Samodzielność, Konkursy, języki, Cennik, FAQ, końcowe CTA, stopka) · A2 cennik z tabelą porównawczą · A5 kontakt (+ wysłano) · A6 szablon strony prawnej / RODO dla uczniów · *później:* A3 Dla szkół, A4 Pomoc, A7 Status systemu |
| **B · Konto** | B1 logowanie (+ stany: błędne dane, niezweryfikowane, zablokowane, zbyt wiele prób, ładowanie, mobile) · B2–B3 rejestracja 2 kroki (konto + profil z wyborem roli i szkoły) · B4 sprawdź skrzynkę · B5 weryfikacja (sukces / wygasł / nieprawidłowy) · B6–B8 reset hasła · B9 SSO (w toku, odmowa, domena niedozwolona, konto powiązane) · B12 sesja wygasła (modal bez utraty zmian) · *później:* B10 2FA, B11 zaproszenie do organizacji |
| **C · Onboarding** | C1 powitanie z Bitem · C2 checklista „Pierwsze kroki” na pulpicie · C3 „Wypróbuj jako uczeń” (tryb podglądu) |
| **D · Wejście ucznia** | D1 dołącz kodem (6 znaków, np. `7K2-9QX`) · D2 strona testu (info, „Kim jesteś?”, zasady, zgoda) · D3.1–D3.9 stany (jeszcze nieaktywny z odliczaniem, zamknięty, brak na liście, limit prób, już ukończony, wznów sesję, wymagany SEB, nieobsługiwana przeglądarka, urządzenie mobilne) · *później:* D4–D7 konto ucznia, moje testy, wynik, profil |
| **E · Test** | E1 sprawdzenie sprzętu (fullscreen, połączenie, kamera + stany) · E2 widok zadania (+ uruchamianie, limit uruchomień) · E4 ostrzeżenia (modal fullscreen, toast wklejenia, bannery połączenia, dodany czas, zakończony przez nauczyciela) · E6 modal zakończenia z listą zadań · E7 czas minął · E8 ekran końcowy (A: wynik od razu, B: po zatwierdzeniu) · *później:* E3 pytanie zamknięte, E5 pytanie kontrolne po zgłoszeniu |
| **F · Organizator** | F1 pulpit · F2 lista testów (zakładki statusów, filtry, menu wiersza) · F3 kreator 4 kroki (Podstawy, Zadania z przeciąganiem z banku i pulami, Dostęp i ochrona, Ocenianie i publikacja z progami ocen) · F4 opublikowano (link, kod, QR) · F5 widok rzutnika · F6 szczegóły testu · F7 panel na żywo (+ dodaj czas, zakończ z wpisaniem „ZAKOŃCZ”, menu ucznia, wpuść ponownie) · F8 bank zadań · F9 edytor zadania (zakładki Treść / Testy / Ustawienia / Rozwiązanie wzorcowe / Warianty) · F11–F13 klasy, szczegóły klasy, import CSV · F15 wyniki testu · F16 raport ucznia (sygnały z wagami, odtwarzacz przebiegu, podobne rozwiązania, rubryka, korekta) · *później:* F10 import zadań, F14 wyniki zbiorczo, F17 diff podobieństwa, F18 ranking konkursu, F19 ogłoszenia i pytania, F20 Ctrl+K, F21 powiadomienia |
| **G · Ustawienia** | G1 profil + wygląd (motyw, język), domyślne ustawienia testów · *później:* powiadomienia, szkoła, członkowie, plan i płatności, integracje, G7 checkout |
| **I · Systemowe** | 404, 500 (z ID błędu), 403, brak internetu, potwierdzenie usunięcia (wpisz nazwę), niezapisane zmiany, udostępnij link, baner cookies · *później:* przerwa techniczna |
| **J · E-maile** | MVP: J1 potwierdź e-mail, J2 reset hasła, J4 wyniki do sprawdzenia, J8 alert bezpieczeństwa · *później:* J3 zaproszenie, J5 wyniki dostępne, J6 przypomnienie, J7 faktura |
| **H · Admin** | *później:* przegląd, organizacje + impersonacja, kolejka oceniania (workery), moderacja |

## Różnice względem SPEC.md (do decyzji)

1. **Kamera:** projekt mówi „tylko podgląd na żywo, bez nagrywania”; SPEC zakłada zdjęcie co N sekund zapisywane w S3.
2. **Limit uruchomień:** projekt — co 5 s; SPEC — 1 na 3 s.
3. **Języki:** ✅ ustalone (15.11.2026) — HTML, CSS, JavaScript, Python, Java, C#, C++, PHP oraz zadania łączące kilka języków (np. HTML + CSS + PHP). Pascal odpada. SPEC zaktualizowany (zadania łączone typu `web`).
4. **Zatwierdzanie wyników:** projekt ma stan „Do sprawdzenia” i przycisk „Zatwierdź i pokaż wyniki uczniom” — model danych potrzebuje pola typu `results_approved_at` na `exams` oraz statusu przeglądu per uczeń (Do przejrzenia / Oznaczony / Zatwierdzony).
5. **Limit wyjść z pełnego ekranu** i „sesja czeka na decyzję nauczyciela” po przekroczeniu — brak w modelu (`settings` JSON + status sesji).
6. **Klasy i grupy, organizacje z członkami, pule zadań „losuj 1 z N”, progi ocen per test** — są w projekcie, w modelu danych częściowo (brak tabel klas/uczniów klasy).
7. **Kod dostępu:** format `XXX-XXX` (6 znaków A–Z/0–9), wejście przez `codeportal.pl/dolacz` lub `codeportal.pl/t/<kod>`.
8. **Fonty:** aplikacja web używa dziś Geist — do zmiany na Plus Jakarta Sans + Inter + JetBrains Mono.

## Implementacja (apps/web)

- **Tokeny:** `src/app/globals.css` (Tailwind v4 `@theme`). W komponentach używaj wyłącznie klas semantycznych — wtedy motyw przełącza się sam:
  - tła i tekst: `bg-canvas`, `bg-surface`, `bg-subtle`, `border-line`, `text-ink`, `text-ink-2`, `text-ink-3`
  - akcja: `bg-accent`, `hover:bg-accent-hover`, `bg-accent-soft`, `text-accent-ink`
  - statusy: `{success,danger,warning,orange,pink,violet,info}` + `-soft` (tło) i `-ink` (tekst)
  - paleta stała: `primary-{50…800}`, `mint-{50…900}`
  - typografia: `font-display`, `font-mono`, `text-display`, `text-h1`, `text-h2`*, `text-h3`, `text-body`, `text-code`, `text-label`
  - kształty: `rounded-tag` / `-input` / `-card` / `-modal`, cienie `shadow-sm` / `-md` / `-lg`
  - *H2 (24/32) nie ma w projekcie — dodany jako stopień pośredni.
- **Motyw:** `data-theme="light" | "dark"` na `<html>` (wybór użytkownika, zapisany w `localStorage` pod `cp-theme`) albo na dowolnym kontenerze — widok testu ustawia `data-theme="dark"` lokalnie. Bez atrybutu obowiązuje motyw systemu. Wariant `dark:` działa tylko dla jawnego `data-theme="dark"`, dlatego komponenty opierają się na tokenach, a nie na `dark:`.
- **Komponenty:** `src/components/ui` (Button, Field/TextField/SelectField/TextareaField, Checkbox/Radio/Switch/SelectionCard, Tabs/SegmentedControl, Card/Tag/Kbd/Avatar/StatCard/Eyebrow, Banner/Toast/ModalPanel/Skeleton, EmptyState, Stepper, ThemeSwitcher), `src/components/exam` (VerdictPill/VerdictDetail/TestResultsBar, ScoreChip, RiskMeter, StatusDot, ProblemTiles, Timer, AutosaveStatus), `src/components/brand` (Bit, Logo).
- **Katalog:** strona `/design` pokazuje wszystkie tokeny i komponenty w obu motywach.
- **Bit:** `public/brand/bit.webp` (oryginał, przycięty) i `bit-480.webp` (do rozmiarów ≤ 150 px).

import { EXAMS, GROUPS, type Group } from "./panel";

export type AccountState = "linked" | "invited" | "none";

export const ACCOUNT_LABEL: Record<AccountState, string> = {
  linked: "powiązane",
  invited: "zaproszony",
  none: "brak",
};

export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  account: AccountState;
  average: number;
  exams: number;
};

const NAMES = [
  ["Szymon", "Dąbrowski"], ["Filip", "Jankowski"], ["Zofia", "Kamińska"], ["Hanna", "Kozłowska"], ["Wiktor", "Krawczyk"],
  ["Jakub", "Lewandowski"], ["Julia", "Mazur"], ["Oliwia", "Piotrowska"], ["Antoni", "Szymański"], ["Kacper", "Wiśniewski"],
  ["Lena", "Woźniak"], ["Maja", "Zielińska"], ["Natalia", "Adamczyk"], ["Igor", "Bąk"], ["Amelia", "Chmielewska"],
  ["Franciszek", "Czarnecki"], ["Pola", "Dudek"], ["Tymon", "Górski"], ["Alicja", "Jasińska"], ["Leon", "Kaczmarek"],
  ["Laura", "Kowalczyk"], ["Stanisław", "Michalski"], ["Nadia", "Nowicka"], ["Ignacy", "Ostrowski"], ["Michalina", "Pawlak"],
  ["Aleksander", "Sikora"], ["Gabriela", "Wójcik"], ["Bartosz", "Zając"],
] as const;

const AVERAGES = [64, 41, 91, 52, 70, 58, 73, 66, 47, 88, 61, 78, 55, 69, 82, 49, 74, 63, 90, 57, 68, 45, 80, 59, 72, 53, 86, 60];

const plainAscii = (s: string) =>
  s
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

export const emailFor = (firstName: string, lastName: string) => `${plainAscii(firstName[0]!)}.${plainAscii(lastName)}@sp12.edu.pl`;

export function groupRoster(group: Group): Student[] {
  const exams = groupExams(group).filter((e) => e.status !== "draft" && e.status !== "scheduled").length;
  return NAMES.slice(0, group.students).map(([firstName, lastName], i) => {
    const account: AccountState = i % 9 === 1 ? "none" : i % 7 === 6 ? "invited" : "linked";
    return {
      id: `${group.id}-st${i + 1}`,
      firstName,
      lastName,
      email: account === "none" ? undefined : emailFor(firstName, lastName),
      account,
      average: AVERAGES[i]!,
      exams: Math.max(0, exams - (i % 5 === 1 ? 1 : 0)),
    };
  });
}

export const groupById = (id: string) => GROUPS.find((g) => g.id === id);

export const groupExams = (group: Group) => EXAMS.filter((e) => e.group === group.name);

export const SAMPLE_CSV = `Nazwisko;Imię;E-mail;Klasa
Nowakowska;Ewa;e.nowakowska@sp12.edu.pl;3B
Wróbel;Mikołaj;m.wrobel@sp12.edu.pl;3B
Pietrzak;Oskar;;3B
Kubiak;Weronika;w.kubiak@sp12;3B
Lewandowski;Jakub;j.lewandowski@sp12.edu.pl;3B
Sadowska;Kinga;k.sadowska@sp12.edu.pl;3B
Majewski;Dawid;d.majewski@sp12.edu.pl;3B
Baran;Zuzanna;z.baran@sp12.edu.pl;3B`;

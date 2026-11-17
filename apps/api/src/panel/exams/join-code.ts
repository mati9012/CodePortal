import { randomInt } from 'node:crypto';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_PART_LENGTH = 3;

const codePart = () =>
  Array.from(
    { length: CODE_PART_LENGTH },
    () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)],
  ).join('');

export const joinCode = () => `${codePart()}-${codePart()}`;

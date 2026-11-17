import { fromWarsaw, toWarsaw } from './warsaw-time.js';

describe('warsaw time', () => {
  it('converts winter local time (UTC+1)', () => {
    expect(fromWarsaw('2026-11-20', '08:55').toISOString()).toBe(
      '2026-11-20T07:55:00.000Z',
    );
  });

  it('converts summer local time (UTC+2)', () => {
    expect(fromWarsaw('2026-06-15', '12:00').toISOString()).toBe(
      '2026-06-15T10:00:00.000Z',
    );
  });

  it('round-trips to the same local date and time', () => {
    expect(toWarsaw(fromWarsaw('2026-03-29', '10:30'))).toEqual({
      date: '2026-03-29',
      time: '10:30',
    });
  });
});

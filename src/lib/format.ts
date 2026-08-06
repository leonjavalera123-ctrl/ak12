// Small formatting helpers shared by components. All of this runs at build
// time — none of it ships to the browser.

// Circuit country -> FIA-style 3-letter badge. Flag emoji are unreliable
// (Chromium on Windows renders them as plain letters), so entry-list style
// country codes are both more robust and more "motorsport".
const COUNTRY_CODES: Record<string, string> = {
  Australia: 'AUS',
  Austria: 'AUT',
  Azerbaijan: 'AZE',
  Bahrain: 'BRN',
  Belgium: 'BEL',
  Brazil: 'BRA',
  Canada: 'CAN',
  China: 'CHN',
  France: 'FRA',
  Germany: 'GER',
  Hungary: 'HUN',
  Italy: 'ITA',
  Japan: 'JPN',
  Malaysia: 'MAS',
  Mexico: 'MEX',
  Monaco: 'MON',
  Netherlands: 'NED',
  Portugal: 'POR',
  Qatar: 'QAT',
  'Saudi Arabia': 'KSA',
  Singapore: 'SIN',
  Spain: 'ESP',
  UAE: 'UAE',
  UK: 'GBR',
  USA: 'USA',
  'United States': 'USA',
};

export function countryCode(country: string): string {
  return COUNTRY_CODES[country] ?? country.slice(0, 3).toUpperCase();
}

export function shortDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

// Ergast/Jolpica positionText codes for non-classified results. Only "R"
// appears in the data today, but a DSQ or DNS mid-season must not silently
// render as "DNF".
const POSITION_CODES: Record<string, string> = {
  R: 'DNF', // retired
  D: 'DSQ', // disqualified
  E: 'EX', //  excluded
  W: 'WD', //  withdrew
  N: 'NC', //  not classified
  F: 'DNQ', // failed to qualify
};

// One-word result label for a race card corner.
export function resultLabel(race: {
  upcoming: boolean;
  finish: number | null;
  positionText: string | null;
}): string {
  if (race.upcoming) return 'Soon';
  if (race.finish !== null) return `P${race.finish}`;
  return POSITION_CODES[race.positionText ?? ''] ?? 'DNF';
}

// "13 wins · 14 poles · 15 podiums · 362 pts" for junior-career entries;
// null fields (unverified) are simply omitted.
export function statLine(entry: {
  wins?: number | null;
  poles?: number | null;
  podiums?: number | null;
  points?: number | null;
}): string {
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  return [
    entry.wins != null ? plural(entry.wins, 'win') : null,
    entry.poles != null ? plural(entry.poles, 'pole') : null,
    entry.podiums != null ? plural(entry.podiums, 'podium') : null,
    entry.points != null ? `${entry.points} pts` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

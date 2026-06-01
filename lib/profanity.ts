const BLOCKED = [
  'fuck','shit','bitch','cunt','dick','cock','pussy','fag','nigger','nigga',
  'retard','whore','slut','asshole','bastard','prick','twat','wanker',
];

export function containsProfanity(str: string): boolean {
  const lower = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return BLOCKED.some(w => lower.includes(w));
}

const KEY_SCORE = 'galactic-oof-high-score';
const KEY_WAVE  = 'galactic-oof-high-wave';

export function getHighScore(): number {
  return parseInt(localStorage.getItem(KEY_SCORE) ?? '0', 10);
}

export function getHighWave(): number {
  return parseInt(localStorage.getItem(KEY_WAVE) ?? '0', 10);
}

/** Saves new records if beaten. Returns which records were broken. */
export function submitRun(score: number, wave: number): { newHighScore: boolean; newHighWave: boolean } {
  const newHighScore = score > getHighScore();
  const newHighWave  = wave  > getHighWave();
  if (newHighScore) localStorage.setItem(KEY_SCORE, String(score));
  if (newHighWave)  localStorage.setItem(KEY_WAVE,  String(wave));
  return { newHighScore, newHighWave };
}

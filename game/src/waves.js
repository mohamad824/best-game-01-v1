// waves.js — what each of the 12 waves throws at the caravan.
// A wave is a timed list of raiders; later waves mix faster, tougher
// and armoured kinds, and wave 12 ends with the Dune Tyrant.
import { TOTAL_WAVES } from './state.js';

export function buildWave(n) {
  const queue = [];
  let t = 0;
  const push = (type, count, gap) => {
    for (let i = 0; i < count; i++) {
      queue.push({ type, at: t });
      t += gap;
    }
    t += 1.2;
  };
  push('runner', 4 + n, 0.9);
  if (n >= 2) push('thief', 2 + Math.floor(n / 2), 1.1);
  if (n >= 3) push('runner', 2 + n, 0.55);
  if (n >= 4) push('beetle', 1 + Math.floor(n / 3), 1.6);
  if (n >= 5) push('thief', 2 + Math.floor(n / 2), 0.8);
  if (n >= 7) push('wraith', 1 + Math.floor((n - 6) / 2), 1.3);
  if (n >= 8) push('beetle', 2 + Math.floor(n / 4), 1.2);
  if (n >= 10) push('wraith', 2, 1.0);
  if (n === TOTAL_WAVES) push('tyrant', 1, 0.5);
  return queue;
}

// Health multiplier so the same kinds stay threatening as waves grow.
export function waveHpMul(n) {
  return 1 + 0.18 * (n - 1);
}

// Salt paid when a wave is cleared, before kill rewards.
export function waveBonus(n) {
  return 25 + 5 * n;
}

export function waveTitle(n) {
  if (n === TOTAL_WAVES) return 'WAVE 12 — THE DUNE TYRANT';
  if (n === 1) return 'WAVE 1 — DUST RUNNERS';
  const names = {
    2: 'SALT THIEVES', 3: 'THE PACK GROWS', 4: 'DUNE BEETLES',
    5: 'THIEVES RETURN', 6: 'THE LONG ROAD', 7: 'SAND WRAITHS',
    8: 'ARMOURED COLUMN', 9: 'THE HOT WIND', 10: 'WRAITH STORM',
    11: 'THE LAST MILE',
  };
  return `WAVE ${n} — ${names[n] || 'RAIDERS'}`;
}

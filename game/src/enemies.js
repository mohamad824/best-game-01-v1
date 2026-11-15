// enemies.js — the raiders: their stats, spawning, movement along
// the road, and what they do when they catch the heart-cart or meet
// a barricade. Damage to the cart is resolved here.
import { roadPoint } from './state.js';
import { waveHpMul as hpMul } from './waves.js';

export const ENEMY_TYPES = {
  runner: { name: 'Dust Runner', hp: 30, speed: 62, reward: 6, dmg: 1, hitEvery: 0.9, radius: 13, color: '#c96f3f', score: 10 },
  thief: { name: 'Salt Thief', hp: 55, speed: 48, reward: 10, dmg: 1, hitEvery: 0.7, radius: 14, color: '#8a5a9e', score: 15 },
  beetle: { name: 'Dune Beetle', hp: 150, speed: 30, reward: 16, dmg: 2, hitEvery: 1.4, radius: 18, color: '#5d6b4a', score: 25 },
  wraith: { name: 'Sand Wraith', hp: 80, speed: 78, reward: 14, dmg: 1, hitEvery: 0.6, radius: 14, color: '#3fa7a0', score: 30 },
  tyrant: { name: 'Dune Tyrant', hp: 900, speed: 24, reward: 120, dmg: 4, hitEvery: 1.2, radius: 30, color: '#a33327', score: 200 },
};

let nextId = 1;

export function spawnEnemy(game, type, wave) {
  const def = ENEMY_TYPES[type];
  const mul = hpMul(wave);
  const hp = Math.round(def.hp * mul);
  game.enemies.push({
    id: nextId++,
    type,
    name: def.name,
    x: -40, y: 600,
    dist: 0,
    hp, maxHp: hp,
    speed: def.speed,
    reward: def.reward,
    dmg: def.dmg,
    hitEvery: def.hitEvery,
    hitTimer: 0,
    radius: def.radius,
    color: def.color,
    score: def.score,
    slowUntil: 0,
    slowFactor: 1,
    wobble: Math.random() * Math.PI * 2,
    flash: 0,
  });
}

// How far an enemy is from the heart-cart along the road.
function cartGap(game, enemy) {
  return game.cart.dist - enemy.dist;
}

export function updateEnemies(game, dt, sfx) {
  const now = game.time;
  for (const e of game.enemies) {
    e.flash = Math.max(0, e.flash - dt * 4);
    e.wobble += dt * 6;
    const slowed = now < e.slowUntil;
    const speed = e.speed * (slowed ? e.slowFactor : 1);
    const gap = cartGap(game, e);
    // Caught the cart: stop and chew it.
    if (gap > -34 && gap < 34) {
      e.hitTimer -= dt;
      if (e.hitTimer <= 0) {
        e.hitTimer = e.hitEvery;
        game.cart.hp -= e.dmg;
        game.shake = Math.max(game.shake, 5);
        game.flash = Math.max(game.flash, 0.35);
        addFloat(game, game.cart.x, game.cart.y - 34, `-${e.dmg}`, '#ff5a4a');
        sfx.cartHit();
        if (game.cart.hp <= 0) {
          game.cart.hp = 0;
          game.screen = 'lost';
        }
      }
      continue;
    }
    // Blocked by a living barricade standing on the road ahead.
    const block = blockingBarricade(game, e);
    if (block) {
      e.hitTimer -= dt;
      if (e.hitTimer <= 0) {
        e.hitTimer = e.hitEvery;
        block.hp -= e.dmg;
        addFloat(game, block.x, block.y - 26, `-${e.dmg}`, '#ffb347');
        sfx.thud();
        if (block.hp <= 0) {
          burst(game, block.x, block.y, '#b08954', 14);
          game.towers = game.towers.filter((t) => t !== block);
          addFloat(game, block.x, block.y - 40, 'BARRICADE BROKEN', '#ff8a5a');
        }
      }
      continue;
    }
    // Otherwise march on down the road, never passing the cart.
    const next = Math.min(e.dist + speed * dt, game.cart.dist - 34);
    if (next > e.dist) {
      e.dist = next;
      const p = roadPoint(e.dist);
      e.x = p.x + Math.sin(e.wobble) * 3;
      e.y = p.y + Math.cos(e.wobble * 0.8) * 3;
    } else {
      // Reached the cart's bumper from behind: wait to strike.
      const p = roadPoint(e.dist);
      e.x = p.x;
      e.y = p.y;
    }
  }
}

// A barricade counts as blocking when it sits on the road within a
// short stretch ahead of the enemy.
function blockingBarricade(game, e) {
  for (const t of game.towers) {
    if (t.kind !== 'barricade' || t.hp <= 0) continue;
    if (Math.abs(t.roadDist - e.dist) < 26 && t.roadDist > e.dist - 10) return t;
  }
  return null;
}

export function addFloat(game, x, y, text, color) {
  game.floats.push({ x, y, text, color, life: 1 });
  if (game.floats.length > 40) game.floats.shift();
}

export function burst(game, x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 40 + Math.random() * 120;
    game.particles.push({
      x, y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
      life: 0.5 + Math.random() * 0.4, maxLife: 0.9,
      size: 2 + Math.random() * 4, color,
    });
  }
  if (game.particles.length > 300) game.particles.splice(0, game.particles.length - 300);
}

// Damage an enemy; returns true when it dies (reward paid by caller).
export function damageEnemy(game, e, dmg, sfx) {
  e.hp -= dmg;
  e.flash = 1;
  if (e.hp > 0) return false;
  game.salt += e.reward;
  game.score += e.score;
  game.kills += 1;
  game.stats.earned += e.reward;
  burst(game, e.x, e.y, e.color, e.type === 'tyrant' ? 40 : 12);
  addFloat(game, e.x, e.y - 20, `+${e.reward} salt`, '#ffd76a');
  sfx.pop();
  return true;
}

// towers.js — the four buildables, their costs, the wind rule that
// makes sail-towers fire only downwind, wind charges, placement,
// selling, and the per-frame firing + projectile step.
import { PLOTS, ROAD_TOTAL, isDownwind, roadPoint, windOf } from './state.js';
import { damageEnemy, burst, addFloat } from './enemies.js';

export const TOWER_DEFS = {
  barricade: {
    key: '1', name: 'Barricade', cost: 20, range: 0,
    desc: 'Roadblock on the road. Raiders stop and chew it.',
    hp: 120, color: '#b08954',
  },
  sail: {
    key: '2', name: 'Sail Tower', cost: 50, range: 155, dmg: 9, rate: 0.55,
    desc: 'Fires only DOWNWIND. Fast, long reach.',
    color: '#e8f4f0',
  },
  windmill: {
    key: '3', name: 'Windmill', cost: 80, range: 125, dmg: 26, rate: 1.5,
    desc: 'Fires in every direction. Slow, heavy shots.',
    color: '#d97b4f',
  },
  saltcart: {
    key: '4', name: 'Salt Cart', cost: 40, range: 100, dmg: 4, rate: 0.8,
    desc: 'Weak shots — but earns +8 salt every wave.',
    income: 8, color: '#2fa8a0',
  },
};

export const TOWER_ORDER = ['barricade', 'sail', 'windmill', 'saltcart'];

export function nearestPlot(x, y, maxDist = 34) {
  let best = null;
  let bestD = maxDist;
  for (const p of PLOTS) {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}

export function plotTaken(game, plot) {
  return game.towers.some((t) => t.plot === plot);
}

// Nearest distance along the road to a point, and how far the point
// sits from the road itself. Used to snap barricades onto the road.
export function nearestRoad(x, y) {
  let best = { dist: 0, off: Infinity };
  // Walk the road in small steps — cheap and exact enough for a click.
  const step = 4;
  for (let d = 0; d <= ROAD_TOTAL; d += step) {
    const p = roadPoint(d);
    const off = Math.hypot(p.x - x, p.y - y);
    if (off < best.off) best = { dist: d, off };
  }
  return best;
}

export function tryPlace(game, kind, x, y, sfx) {
  const def = TOWER_DEFS[kind];
  if (!def) return false;
  if (game.salt < def.cost) {
    game.message = `Need ${def.cost} salt for ${def.name}`;
    game.messageTimer = 2;
    sfx.deny();
    return false;
  }
  if (kind === 'barricade') {
    const near = nearestRoad(x, y);
    if (near.off > 46) {
      game.message = 'Barricades go ON the road — click the road';
      game.messageTimer = 2;
      sfx.deny();
      return false;
    }
    if (game.towers.some((t) => t.kind === 'barricade' && Math.abs(t.roadDist - near.dist) < 40)) {
      game.message = 'A barricade already stands there';
      game.messageTimer = 2;
      sfx.deny();
      return false;
    }
    const p = roadPoint(near.dist);
    game.towers.push({
      kind, x: p.x, y: p.y, roadDist: near.dist,
      hp: def.hp, maxHp: def.hp, cooldown: 0, angle: 0, flash: 0, born: game.time,
    });
  } else {
    const plot = nearestPlot(x, y);
    if (!plot) {
      game.message = 'Build on a marked plot — the pale circles';
      game.messageTimer = 2;
      sfx.deny();
      return false;
    }
    if (plotTaken(game, plot)) {
      game.message = 'That plot is already built on';
      game.messageTimer = 2;
      sfx.deny();
      return false;
    }
    game.towers.push({
      kind, x: plot.x, y: plot.y, plot,
      hp: 0, maxHp: 0, cooldown: 0, angle: 0, flash: 0, born: game.time,
    });
  }
  game.salt -= def.cost;
  game.stats.built += 1;
  game.score += 2;
  burst(game, x, y, '#ffd76a', 10);
  sfx.place();
  return true;
}

export function sellTower(game, tower, sfx) {
  if (!tower) return;
  const refund = Math.floor(TOWER_DEFS[tower.kind].cost * 0.7);
  game.salt += refund;
  game.towers = game.towers.filter((t) => t !== tower);
  game.selectedTower = null;
  addFloat(game, tower.x, tower.y - 30, `+${refund} salt`, '#ffd76a');
  sfx.coin();
}

export function shiftWind(game, sfx) {
  if (game.windCharges <= 0) {
    game.message = 'No wind charges — clear a wave to earn one';
    game.messageTimer = 2;
    sfx.deny();
    return false;
  }
  game.windCharges -= 1;
  game.windIndex = (game.windIndex + 1) % 8;
  game.stats.gusts += 1;
  const w = windOf(game);
  game.message = `Wind turns ${w.label} — sails follow it`;
  game.messageTimer = 2.5;
  sfx.gust();
  return true;
}

// One tower's shot at one enemy, gated by the wind for sail-towers.
function fireAt(game, tower, target, sfx) {
  const def = TOWER_DEFS[tower.kind];
  if (def.range === 0) return;
  if (tower.kind === 'sail' && !isDownwind(game, tower.x, tower.y, target.x, target.y)) return;
  tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
  tower.flash = 1;
  game.projectiles.push({
    x: tower.x, y: tower.y - 6,
    target, kind: tower.kind,
    dmg: def.dmg, speed: 420,
    color: tower.kind === 'windmill' ? '#ffd76a' : '#e8f4f0',
    radius: tower.kind === 'windmill' ? 6 : 3,
  });
  sfx.shoot(tower.kind);
}

export function updateTowers(game, dt, sfx) {
  for (const t of game.towers) {
    t.cooldown -= dt;
    t.flash = Math.max(0, t.flash - dt * 5);
    const def = TOWER_DEFS[t.kind];
    if (def.range === 0 || t.cooldown > 0) continue;
    // Nearest enemy in range; sail-towers additionally need it downwind.
    let best = null;
    let bestD = def.range;
    for (const e of game.enemies) {
      const d = Math.hypot(e.x - t.x, e.y - t.y);
      if (d > bestD) continue;
      if (t.kind === 'sail' && !isDownwind(game, t.x, t.y, e.x, e.y)) continue;
      best = e;
      bestD = d;
    }
    if (best) {
      t.cooldown = def.rate;
      fireAt(game, t, best, sfx);
    }
  }
}

export function updateProjectiles(game, dt, sfx) {
  const alive = [];
  for (const p of game.projectiles) {
    const target = p.target;
    if (!target || target.hp <= 0 || !game.enemies.includes(target)) continue;
    const dx = target.x - p.x;
    const dy = target.y - p.y;
    const d = Math.hypot(dx, dy);
    const step = p.speed * dt;
    if (d <= step + target.radius * 0.5) {
      burst(game, target.x, target.y, p.color, 4);
      const died = damageEnemy(game, target, p.dmg, sfx);
      if (died) game.enemies = game.enemies.filter((e) => e !== target);
      continue;
    }
    p.x += (dx / d) * step;
    p.y += (dy / d) * step;
    alive.push(p);
  }
  game.projectiles = alive;
}

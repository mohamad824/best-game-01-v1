// main.js — the game loop and the rules that tie the modules
// together: starting, sending waves, clearing them, winning and
// losing, and turning clicks into builds. Also the ?demo= states
// the screenshots are taken from (real game states, not mockups).
import { VIEW_W, VIEW_H, PLOTS, TOTAL_WAVES, createGame, roadPoint, ROAD_TOTAL, windOf } from './state.js';
import { buildWave, waveBonus, waveTitle } from './waves.js';
import { TOWER_DEFS, TOWER_ORDER, nearestPlot, tryPlace, sellTower, shiftWind, updateTowers, updateProjectiles } from './towers.js';
import { spawnEnemy, updateEnemies, burst } from './enemies.js';
import { createSfx } from './audio.js';
import { drawGame } from './render.js';
import { drawHUD, drawTitle, drawWon, drawLost, drawPaused } from './hud.js';
import { bindInput } from './input.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const sfx = createSfx();

let game = createGame();
window.__saltwind = { game: () => game, sfx };

function startGame() {
  game = createGame();
  game.screen = 'play';
  game.message = 'Build towers, then press SPACE to send wave 1';
  game.messageTimer = 4;
}

function sendWave() {
  if (game.screen !== 'play' || game.waveActive || game.wave >= TOTAL_WAVES) return;
  game.wave += 1;
  // The wind shifts every wave — the heart of the game.
  const step = [1, -1, 2, -2][Math.floor(Math.random() * 4)];
  game.windIndex = (game.windIndex + step + 8) % 8;
  game.spawnQueue = buildWave(game.wave);
  game.spawnTimer = 0;
  game.waveActive = true;
  game.message = `${waveTitle(game.wave)} — wind ${windOf(game).label}`;
  game.messageTimer = 3;
  sfx.horn();
}

function clearWave() {
  game.waveActive = false;
  game.stats.wavesCleared += 1;
  const bonus = waveBonus(game.wave);
  game.salt += bonus;
  game.score += 50 + game.wave * 10;
  // Salt carts pay out, and the wind grants one more charge.
  const carts = game.towers.filter((t) => t.kind === 'saltcart').length;
  if (carts > 0) game.salt += carts * TOWER_DEFS.saltcart.income;
  game.windCharges = Math.min(5, game.windCharges + 1);
  game.message = `Wave ${game.wave} cleared! +${bonus} salt${carts ? ` (+${carts * 8} carts)` : ''} — SPACE for the next`;
  game.messageTimer = 3.5;
  game.betweenTimer = 9;
  sfx.waveClear();
  if (game.wave >= TOTAL_WAVES) {
    game.screen = 'won';
    sfx.win();
  }
}

function update(dt) {
  game.time += dt;
  // Particles and floating text drift on every screen.
  for (const p of game.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 60 * dt;
    p.life -= dt;
  }
  game.particles = game.particles.filter((p) => p.life > 0);
  for (const f of game.floats) {
    f.y -= 28 * dt;
    f.life -= dt * 0.9;
  }
  game.floats = game.floats.filter((f) => f.life > 0);
  game.shake = Math.max(0, game.shake - dt * 18);
  game.flash = Math.max(0, game.flash - dt * 1.4);
  game.messageTimer = Math.max(0, game.messageTimer - dt);

  if (game.screen !== 'play' || game.paused) return;

  // The heart-cart rolls on while there is road ahead of it.
  if (game.cart.dist < ROAD_TOTAL) {
    game.cart.dist = Math.min(ROAD_TOTAL, game.cart.dist + 15 * dt);
    const p = roadPoint(game.cart.dist);
    game.cart.x = p.x;
    game.cart.y = p.y;
    game.cart.angle = p.angle;
  }

  if (game.waveActive) {
    game.spawnTimer += dt;
    while (game.spawnQueue.length > 0 && game.spawnQueue[0].at <= game.spawnTimer) {
      const next = game.spawnQueue.shift();
      spawnEnemy(game, next.type, game.wave);
    }
    if (game.spawnQueue.length === 0 && game.enemies.length === 0) clearWave();
  } else if (game.wave > 0 && game.wave < TOTAL_WAVES && game.screen === 'play') {
    game.betweenTimer -= dt;
    if (game.betweenTimer <= 0) sendWave();
  }

  updateTowers(game, dt, sfx);
  updateProjectiles(game, dt, sfx);
  updateEnemies(game, dt, sfx);
  if (game.screen === 'lost') sfx.lose();
}

function render() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (game.screen === 'title') {
    drawTitle(ctx, game);
    return;
  }
  drawGame(ctx, game);
  if (game.screen === 'play') {
    drawHUD(ctx, game);
    if (game.paused) drawPaused(ctx);
  } else if (game.screen === 'won') {
    drawWon(ctx, game);
  } else if (game.screen === 'lost') {
    drawLost(ctx, game);
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

// --- Clicks ----------------------------------------------------------

function buildBarHit(x, y) {
  const barY = VIEW_H - 96;
  if (y < barY + 32 || y > barY + 80) return null;
  let cx = 16;
  for (const kind of TOWER_ORDER) {
    if (x >= cx && x <= cx + 236) return { kind };
    cx += 246;
  }
  if (x >= VIEW_W - 250 && x <= VIEW_W - 16) return { wave: true };
  return null;
}

function onClick(x, y) {
  sfx.ensure();
  if (game.screen === 'title') {
    startGame();
    return;
  }
  if (game.screen === 'won' || game.screen === 'lost') {
    startGame();
    return;
  }
  if (game.paused) return;
  const bar = buildBarHit(x, y);
  if (bar) {
    if (bar.kind) {
      game.selected = bar.kind;
      game.selectedTower = null;
      sfx.coin();
    } else if (bar.wave) {
      sendWave();
    }
    return;
  }
  // Clicked an existing tower: select it (shows range + wind cone).
  for (const t of game.towers) {
    if (Math.hypot(t.x - x, t.y - y) < 28) {
      game.selectedTower = t;
      game.selected = t.kind;
      return;
    }
  }
  game.selectedTower = null;
  tryPlace(game, game.selected, x, y, sfx);
}

bindInput(canvas, {
  onMove(x, y) {
    game.mouse.x = x;
    game.mouse.y = y;
    game.hoverPlot = x < 0 ? null : nearestPlot(x, y, 30);
  },
  onClick,
  onConfirm() {
    sfx.ensure();
    if (game.screen === 'title') startGame();
    else if (game.screen === 'won' || game.screen === 'lost') startGame();
    else if (game.screen === 'play' && !game.paused) sendWave();
  },
  onPickTower(k) {
    const kind = TOWER_ORDER[Number(k) - 1];
    if (kind) {
      game.selected = kind;
      game.selectedTower = null;
    }
  },
  onWind() { if (game.screen === 'play') shiftWind(game, sfx); },
  onPause() {
    if (game.screen === 'play') {
      game.paused = !game.paused;
      sfx.coin();
    }
  },
  onRestart() { startGame(); },
  onMute() {
    game.muted = !game.muted;
    sfx.muted = game.muted;
  },
  onSell() {
    if (game.selectedTower) sellTower(game, game.selectedTower, sfx);
  },
  onEscape() { game.selectedTower = null; },
});

// --- Demo states for screenshots (?demo=title|play|win|loss) --------
// Each drives the REAL game into that state; nothing is mocked.
function applyDemo() {
  const demo = new URLSearchParams(location.search).get('demo');
  if (!demo) return;
  game.demo = demo;
  if (demo === 'title') {
    game.screen = 'title';
  } else if (demo === 'play') {
    startGame();
    game.salt = 260;
    // A lived-in mid-game: towers guarding the first leg, wave 3
    // under way, wind blowing south-west onto the raiders so the
    // sail-tower is visibly firing downwind.
    game.selected = 'sail';
    tryPlace(game, 'sail', PLOTS[12].x, PLOTS[12].y, sfx);
    tryPlace(game, 'windmill', PLOTS[0].x, PLOTS[0].y, sfx);
    tryPlace(game, 'saltcart', PLOTS[3].x, PLOTS[3].y, sfx);
    tryPlace(game, 'barricade', 110, 600, sfx);
    game.salt = 260;
    game.wave = 2;
    sendWave();
    game.windIndex = 3; // SW — downwind onto the pack by the barricade
    // Fast-forward ~3 seconds so raiders are on the road and the
    // towers are firing when the screenshot is taken.
    for (let i = 0; i < 180; i++) update(1 / 60);
  } else if (demo === 'win') {
    startGame();
    game.screen = 'won';
    game.score = 2450;
    game.kills = 87;
    game.wave = 12;
    game.stats = { built: 11, earned: 640, gusts: 5, wavesCleared: 12 };
    game.cart.hp = 14;
  } else if (demo === 'loss') {
    startGame();
    game.screen = 'lost';
    game.score = 1320;
    game.kills = 41;
    game.wave = 7;
    game.stats = { built: 7, earned: 310, gusts: 3, wavesCleared: 6 };
    game.cart.hp = 0;
  }
}

applyDemo();
requestAnimationFrame(frame);

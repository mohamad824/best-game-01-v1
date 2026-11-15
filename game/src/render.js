// render.js — everything the eye sees, drawn in code on one canvas:
// desert flat, caravan road, far gate, towers, the heart-cart,
// raiders, projectiles, sand and wind. No images anywhere.
import { VIEW_W, VIEW_H, ROAD, PLOTS, roadPoint, windOf } from './state.js';
import { TOWER_DEFS } from './towers.js';

const SAND_TOP = '#f2d8a0';
const SAND_BOT = '#e0b878';
const ROAD_EDGE = '#a97c46';
const ROAD_FILL = '#c99a5e';
const TURQ = '#2fa8a0';
const TERRA = '#c96f3f';

// Fixed decorations so the flat reads the same every run.
const DECOR = [
  { x: 90, y: 90, k: 'cactus' }, { x: 560, y: 90, k: 'rock' },
  { x: 700, y: 180, k: 'cactus' }, { x: 60, y: 540, k: 'bones' },
  { x: 1180, y: 90, k: 'rock' }, { x: 1020, y: 660, k: 'cactus' },
  { x: 420, y: 700, k: 'rock' }, { x: 300, y: 120, k: 'bones' },
  { x: 900, y: 90, k: 'cactus' },
];

export function drawGame(ctx, game) {
  ctx.save();
  if (game.shake > 0.2) {
    ctx.translate((Math.random() - 0.5) * game.shake, (Math.random() - 0.5) * game.shake);
  }
  drawSand(ctx, game);
  drawRoad(ctx);
  drawGate(ctx, game);
  drawPlots(ctx, game);
  drawTowers(ctx, game);
  drawCart(ctx, game);
  drawEnemies(ctx, game);
  drawProjectiles(ctx, game);
  drawParticles(ctx, game);
  drawFloats(ctx, game);
  drawWindStreaks(ctx, game);
  ctx.restore();
  if (game.flash > 0) {
    ctx.fillStyle = `rgba(255,60,40,${game.flash * 0.25})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

function drawSand(ctx, game) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, SAND_TOP);
  g.addColorStop(1, SAND_BOT);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Dune ripples.
  ctx.strokeStyle = 'rgba(160,110,50,0.18)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    const y = 40 + i * 78;
    ctx.beginPath();
    for (let x = 0; x <= VIEW_W; x += 32) {
      const yy = y + Math.sin(x * 0.012 + i * 1.7) * 10;
      if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  // Turquoise oasis pond, right of the flat.
  ctx.fillStyle = 'rgba(47,168,160,0.85)';
  ctx.beginPath();
  ctx.ellipse(1060, 560, 90, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(1040, 554, 40, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const d of DECOR) {
    if (d.k === 'cactus') drawCactus(ctx, d.x, d.y);
    else if (d.k === 'rock') drawRock(ctx, d.x, d.y);
    else drawBones(ctx, d.x, d.y);
  }
}

function drawCactus(ctx, x, y) {
  ctx.strokeStyle = '#5d8a4a';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 34);
  ctx.moveTo(x, y - 16);
  ctx.lineTo(x - 12, y - 16);
  ctx.lineTo(x - 12, y - 26);
  ctx.moveTo(x, y - 22);
  ctx.lineTo(x + 12, y - 22);
  ctx.lineTo(x + 12, y - 32);
  ctx.stroke();
}

function drawRock(ctx, x, y) {
  ctx.fillStyle = '#b98d5f';
  ctx.beginPath();
  ctx.ellipse(x, y, 16, 10, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.ellipse(x - 4, y - 3, 8, 4, 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawBones(ctx, x, y) {
  ctx.strokeStyle = '#f5ead0';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 12, y);
  ctx.lineTo(x + 12, y - 4);
  ctx.moveTo(x - 8, y + 6);
  ctx.lineTo(x + 6, y + 2);
  ctx.stroke();
  ctx.fillStyle = '#f5ead0';
  ctx.beginPath();
  ctx.arc(x + 16, y - 6, 6, 0, Math.PI * 2);
  ctx.fill();
}

function roadPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(ROAD[0].x, ROAD[0].y);
  for (let i = 1; i < ROAD.length; i++) ctx.lineTo(ROAD[i].x, ROAD[i].y);
}

function drawRoad(ctx) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  roadPath(ctx);
  ctx.strokeStyle = ROAD_EDGE;
  ctx.lineWidth = 52;
  ctx.stroke();
  roadPath(ctx);
  ctx.strokeStyle = ROAD_FILL;
  ctx.lineWidth = 42;
  ctx.stroke();
  // Wheel ruts.
  roadPath(ctx);
  ctx.strokeStyle = 'rgba(120,80,35,0.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([14, 18]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawGate(ctx, game) {
  const x = 1252;
  const y = 240;
  ctx.save();
  ctx.translate(x, y);
  // Turquoise arch over the road's end.
  ctx.fillStyle = TURQ;
  ctx.fillRect(-14, -58, 10, 58);
  ctx.fillRect(4, -58, 10, 58);
  ctx.beginPath();
  ctx.arc(0, -58, 16, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#1d7a74';
  ctx.beginPath();
  ctx.arc(0, -58, 9, Math.PI, 0);
  ctx.fill();
  // Pennants fluttering in the wind.
  const w = windOf(game);
  const flutter = Math.sin(game.time * 5) * 3;
  ctx.strokeStyle = '#8a4a2a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-9, -74);
  ctx.lineTo(-9 + w.dx * 22, -74 + w.dy * 22 + flutter);
  ctx.moveTo(9, -74);
  ctx.lineTo(9 + w.dx * 22, -74 + w.dy * 22 - flutter);
  ctx.stroke();
  ctx.fillStyle = '#e8543f';
  ctx.beginPath();
  ctx.moveTo(-9, -74);
  ctx.lineTo(-9 + w.dx * 22, -74 + w.dy * 22 + flutter);
  ctx.lineTo(-9 + w.dx * 12, -66 + w.dy * 12 + flutter);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.moveTo(9, -74);
  ctx.lineTo(9 + w.dx * 22, -74 + w.dy * 22 - flutter);
  ctx.lineTo(9 + w.dx * 12, -66 + w.dy * 12 - flutter);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#5a3a22';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FAR GATE', x - 30, y + 78);
}

function drawPlots(ctx, game) {
  for (const p of PLOTS) {
    const taken = game.towers.some((t) => t.plot === p);
    if (taken) continue;
    const hover = game.hoverPlot === p;
    ctx.beginPath();
    ctx.arc(p.x, p.y, hover ? 26 : 22, 0, Math.PI * 2);
    ctx.fillStyle = hover ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.28)';
    ctx.fill();
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = 'rgba(120,80,35,0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    if (hover) {
      ctx.fillStyle = '#5a3a22';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BUILD HERE', p.x, p.y - 30);
    }
  }
}

function drawTowers(ctx, game) {
  for (const t of game.towers) {
    const def = TOWER_DEFS[t.kind];
    const selected = game.selectedTower === t;
    if (selected) {
      ctx.beginPath();
      ctx.arc(t.x, t.y, (def.range || 40) + 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Downwind cone for sail-towers, so the wind rule is visible.
      if (t.kind === 'sail') {
        const w = windOf(game);
        ctx.beginPath();
        ctx.moveTo(t.x, t.y);
        ctx.arc(t.x, t.y, def.range, w.angle - Math.PI / 3, w.angle + Math.PI / 3);
        ctx.closePath();
        ctx.fillStyle = 'rgba(47,168,160,0.16)';
        ctx.fill();
      }
    }
    ctx.save();
    ctx.translate(t.x, t.y);
    if (t.kind === 'barricade') drawBarricade(ctx, t);
    else if (t.kind === 'sail') drawSailTower(ctx, t, game);
    else if (t.kind === 'windmill') drawWindmill(ctx, t, game);
    else drawSaltCartTower(ctx, t, game);
    ctx.restore();
    if (t.kind === 'barricade') {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(t.x - 22, t.y - 38, 44, 6);
      ctx.fillStyle = '#e8543f';
      ctx.fillRect(t.x - 22, t.y - 38, 44 * Math.max(0, t.hp / t.maxHp), 6);
    }
  }
}

function drawBarricade(ctx, t) {
  ctx.fillStyle = '#8a5a2a';
  ctx.fillRect(-20, -12, 40, 24);
  ctx.fillStyle = '#b08954';
  ctx.fillRect(-20, -12, 40, 8);
  ctx.strokeStyle = '#5a3a22';
  ctx.lineWidth = 2;
  ctx.strokeRect(-20, -12, 40, 24);
  ctx.beginPath();
  ctx.moveTo(-20, -12);
  ctx.lineTo(20, 12);
  ctx.moveTo(20, -12);
  ctx.lineTo(-20, 12);
  ctx.stroke();
}

function drawSailTower(ctx, t, game) {
  // Stone base.
  ctx.fillStyle = '#9a7a52';
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c9a06a';
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fill();
  // Mast + sail, the sail bellied out downwind.
  const w = windOf(game);
  const flutter = Math.sin(game.time * 4 + t.x) * 0.08;
  const a = w.angle + flutter;
  ctx.strokeStyle = '#6b4a2a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(a) * -6, Math.sin(a) * -6 - 26);
  ctx.stroke();
  ctx.fillStyle = '#f4ead2';
  ctx.beginPath();
  ctx.moveTo(Math.cos(a) * -6, Math.sin(a) * -6 - 26);
  ctx.lineTo(Math.cos(a) * 20, Math.sin(a) * 20 - 4);
  ctx.lineTo(Math.cos(a) * -6, Math.sin(a) * -6 + 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = TERRA;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (t.flash > 0) {
    ctx.fillStyle = `rgba(255,240,180,${t.flash})`;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 20, Math.sin(a) * 20 - 4, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWindmill(ctx, t, game) {
  ctx.fillStyle = '#a35a34';
  ctx.beginPath();
  ctx.moveTo(-10, 12);
  ctx.lineTo(-6, -14);
  ctx.lineTo(6, -14);
  ctx.lineTo(10, 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7a3a22';
  ctx.fillRect(-11, 8, 22, 5);
  const spin = game.time * (1.2 + (game.windIndex % 3) * 0.4);
  ctx.save();
  ctx.translate(0, -16);
  ctx.rotate(spin);
  ctx.fillStyle = '#f4ead2';
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(26, -5);
    ctx.lineTo(26, 5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = '#5a3a22';
  ctx.beginPath();
  ctx.arc(0, -16, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawSaltCartTower(ctx, t, game) {
  ctx.fillStyle = '#8a5a2a';
  ctx.fillRect(-14, -6, 28, 12);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-12, -6);
  ctx.quadraticCurveTo(0, -22, 12, -6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = TURQ;
  ctx.beginPath();
  ctx.arc(-10, 8, 5, 0, Math.PI * 2);
  ctx.arc(10, 8, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5a3a22';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-14, -6);
  ctx.lineTo(-22, -12);
  ctx.stroke();
}

function drawCart(ctx, game) {
  const c = game.cart;
  const bob = Math.sin(game.time * 6) * 2;
  ctx.save();
  ctx.translate(c.x, c.y + bob);
  ctx.rotate(Math.sin(game.time * 3) * 0.03);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 14, 26, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wheels.
  ctx.fillStyle = '#5a3a22';
  ctx.beginPath();
  ctx.arc(-14, 8, 7, 0, Math.PI * 2);
  ctx.arc(14, 8, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9b06a';
  ctx.beginPath();
  ctx.arc(-14, 8, 3, 0, Math.PI * 2);
  ctx.arc(14, 8, 3, 0, Math.PI * 2);
  ctx.fill();
  // Cart bed + salt sacks.
  ctx.fillStyle = '#8a5a2a';
  ctx.fillRect(-24, -10, 48, 14);
  ctx.fillStyle = '#f4ead2';
  ctx.beginPath();
  ctx.arc(-12, -10, 8, Math.PI, 0);
  ctx.arc(10, -10, 8, Math.PI, 0);
  ctx.fill();
  // The heart: a turquoise salt crystal, glowing.
  const pulse = 1 + Math.sin(game.time * 4) * 0.08;
  ctx.save();
  ctx.scale(pulse, pulse);
  ctx.fillStyle = TURQ;
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(10, -18);
  ctx.lineTo(0, -8);
  ctx.lineTo(-10, -18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(4, -20);
  ctx.lineTo(0, -16);
  ctx.lineTo(-4, -20);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.restore();
  // HP bar above the cart.
  const w = 56;
  const frac = Math.max(0, c.hp / c.maxHp);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(c.x - w / 2, c.y - 48, w, 7);
  ctx.fillStyle = frac > 0.5 ? '#58c96b' : frac > 0.25 ? '#ffb347' : '#e8543f';
  ctx.fillRect(c.x - w / 2, c.y - 48, w * frac, 7);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`HEART-CART ${c.hp}/${c.maxHp}`, c.x, c.y - 54);
}

function drawEnemies(ctx, game) {
  for (const e of game.enemies) {
    ctx.save();
    ctx.translate(e.x, e.y);
    const wob = Math.sin(e.wobble) * 0.1;
    ctx.rotate(wob);
    if (e.type === 'runner') {
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-10, -10);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-10, 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f4ead2';
      ctx.beginPath();
      ctx.arc(4, -3, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.type === 'thief') {
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a2a4a';
      ctx.beginPath();
      ctx.moveTo(-12, -4);
      ctx.lineTo(0, -18);
      ctx.lineTo(12, -4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd76a';
      ctx.beginPath();
      ctx.arc(0, 2, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.type === 'beetle') {
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2e3a26';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.lineTo(0, 13);
      ctx.stroke();
      ctx.fillStyle = '#ffd76a';
      ctx.beginPath();
      ctx.arc(12, -4, 2.5, 0, Math.PI * 2);
      ctx.arc(12, 4, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.type === 'wraith') {
      ctx.fillStyle = 'rgba(63,167,160,0.75)';
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.quadraticCurveTo(14, -6, 10, 10);
      ctx.lineTo(4, 4);
      ctx.lineTo(0, 12);
      ctx.lineTo(-4, 4);
      ctx.lineTo(-10, 10);
      ctx.quadraticCurveTo(-14, -6, 0, -16);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-4, -6, 2.5, 0, Math.PI * 2);
      ctx.arc(5, -6, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Dune Tyrant: big horned bulk.
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f4ead2';
      ctx.beginPath();
      ctx.moveTo(-22, -14);
      ctx.lineTo(-34, -30);
      ctx.lineTo(-14, -20);
      ctx.closePath();
      ctx.moveTo(22, -14);
      ctx.lineTo(34, -30);
      ctx.lineTo(14, -20);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd76a';
      ctx.beginPath();
      ctx.arc(-9, -6, 4, 0, Math.PI * 2);
      ctx.arc(9, -6, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    if (e.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${e.flash * 0.7})`;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // HP bar.
    if (e.hp < e.maxHp) {
      const w = Math.max(24, e.radius * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(e.x - w / 2, e.y - e.radius - 10, w, 5);
      ctx.fillStyle = '#e8543f';
      ctx.fillRect(e.x - w / 2, e.y - e.radius - 10, w * Math.max(0, e.hp / e.maxHp), 5);
    }
  }
}

function drawProjectiles(ctx, game) {
  for (const p of game.projectiles) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(p.x - 1, p.y - 1, p.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawParticles(ctx, game) {
  for (const p of game.particles) {
    const frac = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = frac;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * frac + 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFloats(ctx, game) {
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  for (const f of game.floats) {
    ctx.globalAlpha = Math.max(0, f.life);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

function drawWindStreaks(ctx, game) {
  const w = windOf(game);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 14; i++) {
    const seed = (i * 97.3 + game.time * 90) % 1400;
    const x = ((i * 173) % VIEW_W + seed * w.dx + 1400) % VIEW_W;
    const y = ((i * 211) % VIEW_H + seed * w.dy + 1400) % VIEW_H;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w.dx * 26, y + w.dy * 26);
    ctx.stroke();
  }
}

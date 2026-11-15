// hud.js — the heads-up display and the menu screens: the top bar
// (salt, wave, cart health, score, wind compass), the bottom build
// bar with costs and hotkeys, and the title / victory / defeat /
// pause screens. All text is drawn by the game itself.
import { VIEW_W, VIEW_H, TOTAL_WAVES, windOf } from './state.js';
import { TOWER_DEFS, TOWER_ORDER } from './towers.js';
import { waveTitle } from './waves.js';

const BAR_H = 54;
const BUILD_H = 96;

export function drawHUD(ctx, game) {
  // Top bar.
  ctx.fillStyle = 'rgba(60,32,14,0.88)';
  ctx.fillRect(0, 0, VIEW_W, BAR_H);
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`◆ SALT ${game.salt}`, 16, 34);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px sans-serif';
  const waveLabel = game.wave === 0 ? 'WAVE — / 12' : `WAVE ${game.wave} / ${TOTAL_WAVES}`;
  ctx.fillText(waveLabel, 210, 33);
  // Cart health.
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(360, 20, 130, 14);
  ctx.fillStyle = game.cart.hp > 10 ? '#58c96b' : '#e8543f';
  ctx.fillRect(360, 20, 130 * Math.max(0, game.cart.hp / game.cart.maxHp), 14);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`HEART ${game.cart.hp}`, 496, 32);
  // Score + kills.
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(`SCORE ${game.score}`, 640, 33);
  ctx.fillStyle = '#fff';
  ctx.font = '15px sans-serif';
  ctx.fillText(`kills ${game.kills}`, 790, 32);
  // Wind compass.
  drawCompass(ctx, game, 920, 27);
  // Mute state.
  ctx.fillStyle = game.muted ? '#e8543f' : '#fff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(game.muted ? 'SOUND OFF [M]' : 'SOUND ON [M]', VIEW_W - 16, 33);
  ctx.textAlign = 'left';
  // Wave banner / message.
  if (game.messageTimer > 0 && game.message) {
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(60,32,14,0.85)';
    const w = ctx.measureText(game.message).width + 36;
    ctx.fillRect(VIEW_W / 2 - w / 2, 62, w, 34);
    ctx.fillStyle = '#ffd76a';
    ctx.fillText(game.message, VIEW_W / 2, 86);
    ctx.textAlign = 'left';
  }
  drawBuildBar(ctx, game);
}

function drawCompass(ctx, game, cx, cy) {
  const w = windOf(game);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = '#f4ead2';
  ctx.beginPath();
  ctx.arc(0, 0, 21, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8a5a2a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#5a3a22';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('N', 0, -24);
  // Wind arrow.
  ctx.rotate(w.angle);
  ctx.fillStyle = '#2fa8a0';
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-8, -7);
  ctx.lineTo(-8, 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`WIND ${w.name} · ${w.label}`, cx + 28, cy + 5);
  ctx.fillStyle = '#ffd76a';
  ctx.font = '13px sans-serif';
  ctx.fillText(`charges ${game.windCharges}  [5] turn wind`, cx + 28, cy + 22);
}

function drawBuildBar(ctx, game) {
  const y = VIEW_H - BUILD_H;
  ctx.fillStyle = 'rgba(60,32,14,0.88)';
  ctx.fillRect(0, y, VIEW_W, BUILD_H);
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('BUILD  —  click a plot, or a barricade spot on the road', 16, y + 22);
  let x = 16;
  for (const kind of TOWER_ORDER) {
    const def = TOWER_DEFS[kind];
    const selected = game.selected === kind;
    const afford = game.salt >= def.cost;
    const w = 236;
    ctx.fillStyle = selected ? '#2fa8a0' : 'rgba(255,255,255,0.12)';
    ctx.fillRect(x, y + 32, w, 48);
    ctx.strokeStyle = selected ? '#ffd76a' : 'rgba(255,255,255,0.35)';
    ctx.lineWidth = selected ? 3 : 1;
    ctx.strokeRect(x, y + 32, w, 48);
    ctx.fillStyle = afford ? '#fff' : '#c96a5a';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`[${def.key}] ${def.name} — ${def.cost} salt`, x + 10, y + 51);
    ctx.fillStyle = '#ffe9b0';
    ctx.font = '12px sans-serif';
    ctx.fillText(def.desc, x + 10, y + 70);
    x += w + 10;
  }
  // Send-wave + selected-tower actions, right side.
  const bx = VIEW_W - 250;
  ctx.fillStyle = game.waveActive ? 'rgba(255,255,255,0.15)' : '#e8543f';
  ctx.fillRect(bx, y + 32, 234, 48);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(game.waveActive ? 'WAVE RUNNING…' : '[SPACE] SEND NEXT WAVE', bx + 117, y + 54);
  ctx.font = '12px sans-serif';
  ctx.fillText(game.wave === 0 ? 'first wave is free' : waveTitle(Math.min(game.wave + 1, TOTAL_WAVES)), bx + 117, y + 70);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffe9b0';
  ctx.font = '12px sans-serif';
  ctx.fillText('1–4 pick tower · 5 turn wind · P pause · R restart · M mute · X sell tower', 16, VIEW_H - 8);
}

// --- Screens ---------------------------------------------------------

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(60,32,14,0.92)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
}

function bigTitle(ctx, text, y, color) {
  ctx.fillStyle = color || '#ffd76a';
  ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, VIEW_W / 2, y);
  ctx.textAlign = 'left';
}

export function drawTitle(ctx, game) {
  ctx.fillStyle = '#f2d8a0';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Sun + dunes backdrop.
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.arc(1060, 120, 64, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e0b878';
  ctx.beginPath();
  ctx.moveTo(0, 520);
  ctx.quadraticCurveTo(320, 420, 640, 500);
  ctx.quadraticCurveTo(960, 580, 1280, 480);
  ctx.lineTo(1280, 720);
  ctx.lineTo(0, 720);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c99a5e';
  ctx.beginPath();
  ctx.moveTo(0, 600);
  ctx.quadraticCurveTo(400, 520, 800, 590);
  ctx.quadraticCurveTo(1080, 640, 1280, 580);
  ctx.lineTo(1280, 720);
  ctx.lineTo(0, 720);
  ctx.closePath();
  ctx.fill();
  // A little caravan crossing the dunes, off to the left so it never
  // covers the start line.
  ctx.fillStyle = '#8a5a2a';
  ctx.fillRect(140, 596, 120, 22);
  ctx.fillStyle = '#2fa8a0';
  ctx.beginPath();
  ctx.moveTo(200, 560);
  ctx.lineTo(214, 584);
  ctx.lineTo(200, 596);
  ctx.lineTo(186, 584);
  ctx.closePath();
  ctx.fill();
  bigTitle(ctx, 'SALTWIND', 150, '#8a4a2a');
  bigTitle(ctx, 'CARAVAN', 220, '#2fa8a0');
  ctx.fillStyle = '#5a3a22';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('A tower defence on the desert flat — the wind decides who shoots.', VIEW_W / 2, 268);
  ctx.font = '17px sans-serif';
  ctx.fillText('Escort the heart-cart across 12 waves to the Far Gate.', VIEW_W / 2, 300);
  ctx.fillText('The wind shifts every wave. Sail-towers fire ONLY downwind —', VIEW_W / 2, 328);
  ctx.fillText('spend a wind charge [5] to turn it. Barricades hold the road.', VIEW_W / 2, 352);
  ctx.textAlign = 'left';
  panel(ctx, 340, 392, 600, 150);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HOW TO PLAY', VIEW_W / 2, 420);
  ctx.font = '15px sans-serif';
  ctx.fillText('Mouse — click a plot to build · click the road for a barricade', VIEW_W / 2, 448);
  ctx.fillText('1–4 pick a tower · 5 turn the wind · SPACE send the next wave', VIEW_W / 2, 472);
  ctx.fillText('P pause · R restart · M mute · X sell a selected tower', VIEW_W / 2, 496);
  ctx.fillText('Lose if the heart-cart falls. Win by surviving all 12 waves.', VIEW_W / 2, 520);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e8543f';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  const pulse = 1 + Math.sin(game.time * 4) * 0.06;
  ctx.save();
  ctx.translate(VIEW_W / 2, 600);
  ctx.scale(pulse, pulse);
  ctx.fillText('CLICK OR PRESS ENTER TO START', 0, 0);
  ctx.restore();
  ctx.textAlign = 'left';
}

function statLine(ctx, label, value, y) {
  ctx.fillStyle = '#ffe9b0';
  ctx.font = '17px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${label}:  ${value}`, VIEW_W / 2, y);
  ctx.textAlign = 'left';
}

export function drawWon(ctx, game) {
  ctx.fillStyle = 'rgba(20,60,55,0.82)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  bigTitle(ctx, 'THE CARAVAN', 180, '#ffd76a');
  bigTitle(ctx, 'ARRIVES!', 250, '#2fa8a0');
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('All 12 waves survived. The heart-cart rolls through the Far Gate,', VIEW_W / 2, 300);
  ctx.fillText('salt glittering, sails full of the turning wind.', VIEW_W / 2, 330);
  ctx.textAlign = 'left';
  statLine(ctx, 'FINAL SCORE', game.score, 390);
  statLine(ctx, 'Raiders beaten', game.kills, 420);
  statLine(ctx, 'Towers built', game.stats.built, 450);
  statLine(ctx, 'Salt earned', game.stats.earned, 480);
  statLine(ctx, 'Heart-cart health left', `${game.cart.hp}/${game.cart.maxHp}`, 510);
  ctx.fillStyle = '#e8543f';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PRESS R TO PLAY AGAIN', VIEW_W / 2, 580);
  ctx.textAlign = 'left';
}

export function drawLost(ctx, game) {
  ctx.fillStyle = 'rgba(60,16,10,0.85)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  bigTitle(ctx, 'THE HEART-CART', 180, '#e8543f');
  bigTitle(ctx, 'HAS FALLEN', 250, '#ffd76a');
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('The salt scatters across the flat. The wind keeps blowing —', VIEW_W / 2, 300);
  ctx.fillText('but the caravan will not cross today.', VIEW_W / 2, 330);
  ctx.textAlign = 'left';
  statLine(ctx, 'Waves survived', `${game.stats.wavesCleared} / ${TOTAL_WAVES}`, 390);
  statLine(ctx, 'FINAL SCORE', game.score, 420);
  statLine(ctx, 'Raiders beaten', game.kills, 450);
  statLine(ctx, 'Towers built', game.stats.built, 480);
  ctx.fillStyle = '#ffd76a';
  ctx.font = '17px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Tip: barricades buy time, and a wind charge turns your sails onto the pack.', VIEW_W / 2, 530);
  ctx.fillStyle = '#e8543f';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('PRESS R TO TRY AGAIN', VIEW_W / 2, 580);
  ctx.textAlign = 'left';
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', VIEW_W / 2, 350);
  ctx.fillStyle = '#fff';
  ctx.font = '18px sans-serif';
  ctx.fillText('Press P to carry on · R to restart', VIEW_W / 2, 390);
  ctx.textAlign = 'left';
}

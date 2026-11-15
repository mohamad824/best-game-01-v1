// input.js — mouse and keyboard, translated into game actions.
// Knows nothing about waves or towers; it only reports what the
// player did, through the handlers main.js hands it.
import { VIEW_W, VIEW_H } from './state.js';

export function bindInput(canvas, handlers) {
  function toGameCoords(ev) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((ev.clientX - rect.left) / rect.width) * VIEW_W,
      y: ((ev.clientY - rect.top) / rect.height) * VIEW_H,
    };
  }

  canvas.addEventListener('mousemove', (ev) => {
    const p = toGameCoords(ev);
    handlers.onMove(p.x, p.y);
  });
  canvas.addEventListener('mouseleave', () => handlers.onMove(-1, -1));
  canvas.addEventListener('click', (ev) => {
    const p = toGameCoords(ev);
    handlers.onClick(p.x, p.y);
  });

  window.addEventListener('keydown', (ev) => {
    if (ev.repeat) return;
    const k = ev.key.toLowerCase();
    if (k === ' ' || k === 'enter') {
      ev.preventDefault();
      handlers.onConfirm();
    } else if (k === '1' || k === '2' || k === '3' || k === '4') {
      handlers.onPickTower(k);
    } else if (k === '5') {
      handlers.onWind();
    } else if (k === 'p') {
      handlers.onPause();
    } else if (k === 'r') {
      handlers.onRestart();
    } else if (k === 'm') {
      handlers.onMute();
    } else if (k === 'x') {
      handlers.onSell();
    } else if (k === 'escape') {
      handlers.onEscape();
    }
  });
}

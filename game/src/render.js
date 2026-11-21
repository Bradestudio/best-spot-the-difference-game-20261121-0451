// Drawing only: the world's state and the current screen in, pixels out. The two picture
// panels are pre-rendered once per round into offscreen canvases (left as-is, right with the
// differences) and blitted every frame; the HUD, markers, hints and overlays are drawn on top.
// The canvas is fixed at 1280x480 logical pixels and scaled by devicePixelRatio for crispness.
import { CANVAS, FONT, MARKER, PALETTE, PANEL, PANEL_LEFT, PANEL_RIGHT, ROUND } from './config.js';
import { LEVELS, PANEL_H, PANEL_W } from './scenes.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_ROUND_WIN = 'round-win';
export const SCREEN_GAME_WIN = 'game-win';
export const SCREEN_TIME_UP = 'time-up';

/** HUD button rects, in logical canvas coordinates. */
const BUTTONS = {
  hint: { x: 916, y: 10, w: 148, h: 36 },
  mute: { x: 1072, y: 10, w: 84, h: 36 },
  restart: { x: 1164, y: 10, w: 92, h: 36 },
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function drawStars(ctx, x, y, count, size) {
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i < count ? '#ffd166' : '#4a3f66';
    ctx.fillText('★', x + i * (size + 6), y);
  }
}

export function createRenderer(canvas) {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = CANVAS.width * dpr;
  canvas.height = CANVAS.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  let panelCache = { round: 0, left: null, right: null };

  function panelsFor(round) {
    if (panelCache.round !== round) {
      const level = LEVELS[round - 1];
      const left = document.createElement('canvas');
      left.width = PANEL_W;
      left.height = PANEL_H;
      const right = document.createElement('canvas');
      right.width = PANEL_W;
      right.height = PANEL_H;
      level.draw(left.getContext('2d'), PANEL_W, PANEL_H, new Set());
      const changed = new Set(level.diffs.map((diff) => diff.id));
      level.draw(right.getContext('2d'), PANEL_W, PANEL_H, changed);
      panelCache = { round, left, right };
    }
    return panelCache;
  }

  function drawButton(rect, label, enabled) {
    ctx.fillStyle = enabled ? PALETTE.button : '#4a3f66';
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.fillStyle = enabled ? PALETTE.buttonText : '#b9a8d8';
    ctx.font = `bold 15px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
  }

  function drawHud(state, screen) {
    ctx.fillStyle = PALETTE.hud;
    ctx.fillRect(0, 0, CANVAS.width, 56);
    ctx.fillStyle = PALETTE.hudLine;
    ctx.fillRect(0, 56, CANVAS.width, 2);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.accent;
    ctx.font = `bold 22px ${FONT}`;
    ctx.fillText('PASAR MALAM', 24, 29);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `15px ${FONT}`;
    ctx.fillText('Cari Perbedaannya', 196, 30);
    if (screen === SCREEN_PLAY || screen === SCREEN_ROUND_WIN || screen === SCREEN_TIME_UP) {
      const remaining = 8 - state.found.length;
      ctx.fillStyle = PALETTE.text;
      ctx.font = `17px ${FONT}`;
      ctx.fillText(`Ronde ${state.round}/3`, 392, 29);
      ctx.fillStyle = remaining === 0 ? PALETTE.good : PALETTE.accent;
      ctx.font = `bold 24px ${FONT}`;
      ctx.fillText(`Tersisa: ${remaining}`, 500, 29);
      ctx.fillStyle = state.timeLeft < 30 ? PALETTE.timerLow : PALETTE.text;
      ctx.font = `bold 22px ${FONT}`;
      ctx.fillText(`Waktu ${formatTime(state.timeLeft)}`, 664, 29);
      ctx.fillStyle = PALETTE.text;
      ctx.font = `bold 20px ${FONT}`;
      ctx.fillText(`Skor ${state.score}`, 800, 29);
      drawButton(BUTTONS.hint, `Petunjuk (H) ×${state.hintsLeft}`, state.hintsLeft > 0);
      drawButton(BUTTONS.mute, state.muted ? 'Suara ✕' : 'Suara ✓', true);
      drawButton(BUTTONS.restart, 'Ulang (R)', true);
    }
  }

  function drawPanelFrame(x, y, label) {
    ctx.strokeStyle = PALETTE.panelFrame;
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 2, y - 2, PANEL_W + 4, PANEL_H + 4);
    ctx.fillStyle = 'rgba(20, 16, 31, 0.85)';
    ctx.fillRect(x + 6, y + 6, 58, 22);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 13px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + 12, y + 18);
  }

  function drawMarker(x, y, pulse) {
    const r = MARKER.radius + (pulse ? (1 - pulse) * 10 : 0);
    ctx.strokeStyle = '#ff5d5d';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, r + 4, 0, Math.PI * 2);
    ctx.stroke();
    // Check mark at the ring's top right.
    ctx.fillStyle = '#7ee081';
    ctx.beginPath();
    ctx.arc(x + r * 0.7, y - r * 0.7, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + r * 0.7 - 5, y - r * 0.7);
    ctx.lineTo(x + r * 0.7 - 1, y - r * 0.7 + 4);
    ctx.lineTo(x + r * 0.7 + 5, y - r * 0.7 - 4);
    ctx.stroke();
  }

  function drawPanels(state, screen) {
    const { left, right } = panelsFor(state.round);
    ctx.drawImage(left, PANEL_LEFT.x, PANEL_LEFT.y);
    ctx.drawImage(right, PANEL_RIGHT.x, PANEL_RIGHT.y);
    drawPanelFrame(PANEL_LEFT.x, PANEL_LEFT.y, 'KIRI');
    drawPanelFrame(PANEL_RIGHT.x, PANEL_RIGHT.y, 'KANAN');
    const level = LEVELS[state.round - 1];
    for (const diff of level.diffs) {
      if (!state.found.includes(diff.id)) continue;
      const pulse = state.foundPulse && state.foundPulse.x === diff.x && state.foundPulse.y === diff.y
        ? state.foundPulse.t / MARKER.pulseSeconds
        : 0;
      drawMarker(PANEL_LEFT.x + diff.x, PANEL_LEFT.y + diff.y, pulse);
      drawMarker(PANEL_RIGHT.x + diff.x, PANEL_RIGHT.y + diff.y, pulse);
    }
    if (state.hint !== null) {
      const pulse = 0.5 + 0.5 * Math.sin((performance.now() / 180) % (Math.PI * 2));
      for (const panel of [PANEL_LEFT, PANEL_RIGHT]) {
        ctx.strokeStyle = `rgba(255, 209, 102, ${0.55 + pulse * 0.45})`;
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(panel.x + state.hint.x, panel.y + state.hint.y, MARKER.radius + 6 + pulse * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    if (state.wrongFlash !== null) {
      const panel = state.wrongFlash.panel === 1 ? PANEL_RIGHT : PANEL_LEFT;
      const wx = panel.x + state.wrongFlash.x;
      const wy = panel.y + state.wrongFlash.y;
      ctx.strokeStyle = '#ff5d5d';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(wx - 12, wy - 12);
      ctx.lineTo(wx + 12, wy + 12);
      ctx.moveTo(wx + 12, wy - 12);
      ctx.lineTo(wx - 12, wy + 12);
      ctx.stroke();
      ctx.fillStyle = '#ff5d5d';
      ctx.font = `bold 13px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('-3 detik', wx, wy + 26);
    }
    void screen;
  }

  function drawFooter(state) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `14px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(LEVELS[state.round - 1].name, 24, 458);
    ctx.textAlign = 'center';
    ctx.fillText('Klik perbedaan di kedua gambar  •  H: petunjuk  •  M: suara  •  R: ulang  •  Esc: menu', 640, 458);
    ctx.textAlign = 'right';
    // After a round is won the round score already sits inside totalScore.
    const total = state.gameOver ? state.totalScore : state.totalScore + state.score;
    ctx.fillText(`Total skor: ${total}`, 1256, 458);
  }

  function drawOverlayPanel(x, y, w, h) {
    ctx.fillStyle = PALETTE.overlay;
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
    ctx.fillStyle = '#241c3d';
    roundRect(ctx, x, y, w, h, 16);
    ctx.fill();
    ctx.strokeStyle = PALETTE.panelFrame;
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, h, 16);
    ctx.stroke();
  }

  function drawCenterButton(rect, label) {
    ctx.fillStyle = PALETTE.button;
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.buttonText;
    ctx.font = `bold 18px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
    return rect;
  }

  function drawTitle(state, best) {
    const { left, right } = panelsFor(1);
    ctx.globalAlpha = 0.55;
    ctx.drawImage(left, PANEL_LEFT.x, PANEL_LEFT.y);
    ctx.drawImage(right, PANEL_RIGHT.x, PANEL_RIGHT.y);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(12, 8, 24, 0.55)';
    ctx.fillRect(0, 56, CANVAS.width, 424);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = PALETTE.accent;
    ctx.font = `bold 64px ${FONT}`;
    ctx.fillText('PASAR MALAM', 640, 150);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 30px ${FONT}`;
    ctx.fillText('Cari Perbedaannya', 640, 200);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `17px ${FONT}`;
    ctx.fillText('Dua gambar hampir sama — temukan 8 perbedaan di setiap ronde sebelum waktu habis.', 640, 244);
    ctx.fillText('Klik perbedaan di gambar kiri atau kanan. Petunjuk (H) tersedia 3× per ronde.', 640, 272);
    ctx.fillText('3 ronde: Pasar Malam  •  Taman Lampion  •  Pantai Senja', 640, 300);
    if (best > 0) {
      ctx.fillStyle = PALETTE.accent2;
      ctx.font = `bold 18px ${FONT}`;
      ctx.fillText(`Skor terbaik: ${best}`, 640, 332);
    }
    drawCenterButton({ x: 490, y: 356, w: 300, h: 52 }, '▶  MULAI BERMAIN');
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `14px ${FONT}`;
    ctx.fillText('Spasi / klik untuk mulai  •  M: suara  •  R: ulang', 640, 436);
    void state;
  }

  function drawRoundWin(state) {
    drawOverlayPanel(390, 90, 500, 300);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = PALETTE.good;
    ctx.font = `bold 36px ${FONT}`;
    ctx.fillText('Ronde Selesai!', 640, 140);
    drawStars(ctx, 565, 188, state.roundStars, 34);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `19px ${FONT}`;
    ctx.fillText(`8 perbedaan ditemukan  •  Bonus waktu: +${Math.floor(state.timeLeft) * ROUND.timeBonusPerSecond}`, 640, 232);
    ctx.fillStyle = PALETTE.accent;
    ctx.font = `bold 24px ${FONT}`;
    ctx.fillText(`Skor ronde: ${state.score}   •   Total: ${state.totalScore}`, 640, 268);
    const label = state.round >= 3 ? 'Lihat Hasil Akhir' : `Lanjut: Ronde ${state.round + 1}  →`;
    drawCenterButton({ x: 470, y: 306, w: 300, h: 52 }, label);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `14px ${FONT}`;
    ctx.fillText('Spasi / klik untuk lanjut', 640, 372);
  }

  function drawGameWin(state, best) {
    drawOverlayPanel(370, 70, 540, 340);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = PALETTE.accent;
    ctx.font = `bold 40px ${FONT}`;
    ctx.fillText('Kamu Menang!', 640, 122);
    drawStars(ctx, 540, 172, Math.max(1, Math.round(state.totalStars / 3)), 38);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `19px ${FONT}`;
    ctx.fillText('Semua 3 ronde selesai — 24 perbedaan ditemukan!', 640, 222);
    ctx.fillStyle = PALETTE.accent;
    ctx.font = `bold 28px ${FONT}`;
    ctx.fillText(`Skor akhir: ${state.totalScore}`, 640, 262);
    if (state.totalScore >= best && best > 0) {
      ctx.fillStyle = PALETTE.accent2;
      ctx.font = `bold 18px ${FONT}`;
      ctx.fillText('★ Skor terbaik baru! ★', 640, 296);
    }
    drawCenterButton({ x: 470, y: 330, w: 300, h: 52 }, '↻  MAIN LAGI');
  }

  function drawTimeUp(state) {
    drawOverlayPanel(390, 90, 500, 300);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = PALETTE.bad;
    ctx.font = `bold 36px ${FONT}`;
    ctx.fillText('Waktu Habis!', 640, 140);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `19px ${FONT}`;
    ctx.fillText(`Kamu menemukan ${state.found.length} dari 8 perbedaan di ronde ini.`, 640, 196);
    ctx.fillStyle = PALETTE.accent;
    ctx.font = `bold 22px ${FONT}`;
    ctx.fillText(`Skor ronde: ${state.score}`, 640, 236);
    drawCenterButton({ x: 470, y: 306, w: 300, h: 52 }, '↻  COBA LAGI');
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `14px ${FONT}`;
    ctx.fillText('Spasi / R untuk mencoba lagi  •  Esc untuk menu', 640, 372);
  }

  function draw(state, screen, best) {
    ctx.fillStyle = PALETTE.backdrop;
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
    drawHud(state, screen);
    if (screen === SCREEN_TITLE) {
      drawTitle(state, best);
      return;
    }
    drawPanels(state, screen);
    drawFooter(state);
    if (screen === SCREEN_ROUND_WIN) drawRoundWin(state);
    else if (screen === SCREEN_GAME_WIN) drawGameWin(state, best);
    else if (screen === SCREEN_TIME_UP) drawTimeUp(state);
  }

  function inRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  }

  /** What a click at logical canvas coordinates hits: a button, a panel, or nothing. */
  function hit(x, y, screen) {
    if (screen === SCREEN_TITLE) {
      if (inRect(x, y, { x: 490, y: 356, w: 300, h: 52 })) return { type: 'start' };
      return { type: 'none' };
    }
    if (screen === SCREEN_ROUND_WIN || screen === SCREEN_GAME_WIN || screen === SCREEN_TIME_UP) {
      if (inRect(x, y, { x: 470, y: 306, w: 300, h: 52 }) || inRect(x, y, { x: 470, y: 330, w: 300, h: 52 })) {
        return { type: screen === SCREEN_ROUND_WIN ? 'next' : 'again' };
      }
      return { type: 'none' };
    }
    if (screen !== SCREEN_PLAY) return { type: 'none' };
    if (inRect(x, y, BUTTONS.hint)) return { type: 'hint' };
    if (inRect(x, y, BUTTONS.mute)) return { type: 'mute' };
    if (inRect(x, y, BUTTONS.restart)) return { type: 'restart' };
    if (x >= PANEL_LEFT.x && x <= PANEL_LEFT.x + PANEL_W && y >= PANEL_LEFT.y && y <= PANEL_LEFT.y + PANEL_H) {
      return { type: 'panel', panel: 0, x: x - PANEL_LEFT.x, y: y - PANEL_LEFT.y };
    }
    if (x >= PANEL_RIGHT.x && x <= PANEL_RIGHT.x + PANEL_W && y >= PANEL_RIGHT.y && y <= PANEL_RIGHT.y + PANEL_H) {
      return { type: 'panel', panel: 1, x: x - PANEL_RIGHT.x, y: y - PANEL_RIGHT.y };
    }
    return { type: 'none' };
  }

  return { draw, hit };
}

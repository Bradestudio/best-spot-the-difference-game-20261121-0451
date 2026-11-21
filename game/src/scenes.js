// The three rounds, each a rich procedural picture drawn twice: once as-is (left panel) and
// once with its differences applied (right panel). Every difference is one entry in the
// level's DIFFS list with a fixed spot, so both panels agree on where a difference lives.
// `changed` is the set of difference ids the right panel shows. All random positions are
// drawn from a seeded RNG in a fixed order before any conditional, so the two panels can
// never drift apart.

import { createRandom, randomInt } from './random.js';

export const PANEL_W = 608;
export const PANEL_H = 368;

function sky(ctx, w, h, top, bottom) {
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

function star(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawStars(ctx, rng, count, w, h, maxY) {
  for (let i = 0; i < count; i += 1) {
    const x = rng() * w;
    const y = rng() * maxY;
    const r = 0.8 + rng() * 1.6;
    star(ctx, x, y, r, rng() > 0.25 ? '#fff6d8' : '#ffd166');
  }
}

function drawMoon(ctx, x, y, r, crescent) {
  ctx.fillStyle = '#ffeec2';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2d492';
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.2, r * 0.16, 0, Math.PI * 2);
  ctx.arc(x + r * 0.25, y + r * 0.3, r * 0.12, 0, Math.PI * 2);
  ctx.fill();
  if (crescent) {
    ctx.fillStyle = '#2a1a4e';
    ctx.beginPath();
    ctx.arc(x + r * 0.45, y - r * 0.15, r * 0.92, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStringLights(ctx, w, y, sag, rng, lanternSpot) {
  // Two swags of warm bulbs across the top of the scene.
  for (let swag = 0; swag < 2; swag += 1) {
    const x0 = swag === 0 ? 0 : w / 2;
    const x1 = swag === 0 ? w / 2 : w;
    ctx.strokeStyle = '#3a2f5e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y - 6);
    ctx.quadraticCurveTo((x0 + x1) / 2, y + sag, x1, y - 6);
    ctx.stroke();
    const bulbs = 7;
    for (let i = 0; i < bulbs; i += 1) {
      const t = i / (bulbs - 1);
      const bx = x0 + (x1 - x0) * t;
      // Point on the quadratic curve: (1-t)^2 * (y-6) + 2(1-t)t * (y+sag) + t^2 * (y-6).
      const by = (1 - t) * (1 - t) * (y - 6) + 2 * (1 - t) * t * (y + sag) + t * t * (y - 6);
      const colors = ['#ff5d73', '#ffd166', '#7ee081', '#4fc3f7'];
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(bx, by + 8, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 220, 130, 0.25)';
      ctx.beginPath();
      ctx.arc(bx, by + 8, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // The big paper lantern hanging in the middle of the swag.
  if (lanternSpot) {
    drawLantern(ctx, lanternSpot.x, lanternSpot.y, lanternSpot.color);
  }
}

function drawLantern(ctx, x, y, color) {
  ctx.strokeStyle = '#8a6420';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - 26);
  ctx.lineTo(x, y - 14);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, 15, 19, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120, 40, 20, 0.55)';
  ctx.lineWidth = 1.5;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.ellipse(x, y, 15 - Math.abs(i) * 4, 19, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(x - 6, y - 24, 12, 5);
  ctx.fillRect(x - 6, y + 19, 12, 5);
  ctx.fillStyle = 'rgba(255, 209, 102, 0.3)';
  ctx.beginPath();
  ctx.arc(x, y, 26, 0, Math.PI * 2);
  ctx.fill();
}

function drawCat(ctx, x, y) {
  ctx.fillStyle = '#2b2b33';
  // Body, head, ears, tail.
  ctx.beginPath();
  ctx.ellipse(x, y, 16, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 12, y - 12, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 19);
  ctx.lineTo(x + 7, y - 28);
  ctx.lineTo(x + 11, y - 19);
  ctx.closePath();
  ctx.moveTo(x + 14, y - 20);
  ctx.lineTo(x + 18, y - 28);
  ctx.lineTo(x + 21, y - 19);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 14, y + 4);
  ctx.quadraticCurveTo(x - 26, y - 6, x - 18, y - 18);
  ctx.quadraticCurveTo(x - 12, y - 10, x - 10, y + 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(x + 15, y - 14, 1.8, 0, Math.PI * 2);
  ctx.fill();
}

function drawAwning(ctx, x, y, w, h, colorA, colorB) {
  const stripes = 6;
  for (let i = 0; i < stripes; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? colorA : colorB;
    ctx.fillRect(x + (w / stripes) * i, y, w / stripes + 1, h);
  }
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.fillRect(x, y + h - 6, w, 6);
  // Scalloped edge.
  ctx.fillStyle = colorA;
  for (let i = 0; i < stripes; i += 1) {
    ctx.beginPath();
    ctx.arc(x + (w / stripes) * (i + 0.5), y + h, w / stripes / 2, 0, Math.PI);
    ctx.fill();
  }
}

function drawStall(ctx, x, y, w, awningA, awningB, signText, signPrice, signColor) {
  // Counter and posts.
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(x, y + 96, w, 12);
  ctx.fillStyle = '#8a5a33';
  ctx.fillRect(x + 6, y + 108, w - 12, 34);
  ctx.fillStyle = '#5a3820';
  ctx.fillRect(x, y + 40, 6, 102);
  ctx.fillRect(x + w - 6, y + 40, 6, 102);
  drawAwning(ctx, x - 8, y, w + 16, 40, awningA, awningB);
  // Sign board with the stall's name and price.
  ctx.fillStyle = signColor;
  ctx.fillRect(x + 18, y + 52, w - 36, 34);
  ctx.strokeStyle = '#3a2f5e';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 18, y + 52, w - 36, 34);
  ctx.fillStyle = '#fff7e6';
  ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(signText, x + w / 2 - 14, y + 70);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 16px "Trebuchet MS", sans-serif';
  ctx.fillText(signPrice, x + w - 34, y + 70);
}

function drawCart(ctx, x, y, skewers) {
  // A gerobak (pushcart) with two big wheels and satay skewers on top.
  ctx.fillStyle = '#7a4a21';
  ctx.fillRect(x, y, 120, 46);
  ctx.fillStyle = '#9c6230';
  ctx.fillRect(x, y, 120, 10);
  ctx.fillStyle = '#5a3820';
  ctx.fillRect(x - 14, y + 40, 10, 26);
  ctx.fillRect(x + 124, y + 40, 10, 26);
  ctx.fillStyle = '#3a2f5e';
  ctx.beginPath();
  ctx.arc(x + 22, y + 56, 16, 0, Math.PI * 2);
  ctx.arc(x + 98, y + 56, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(x + 22, y + 56, 6, 0, Math.PI * 2);
  ctx.arc(x + 98, y + 56, 6, 0, Math.PI * 2);
  ctx.fill();
  // Skewers fanned on the cart's top.
  for (let i = 0; i < skewers; i += 1) {
    const sx = x + 14 + i * 26;
    ctx.strokeStyle = '#d8b98a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx, y - 4);
    ctx.lineTo(sx + 8, y - 30);
    ctx.stroke();
    ctx.fillStyle = '#c96f2e';
    for (let k = 0; k < 3; k += 1) {
      ctx.beginPath();
      ctx.arc(sx + 3 + k * 2.5, y - 12 - k * 7, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // A little smoke curl above the grill.
  ctx.strokeStyle = 'rgba(255, 247, 230, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 60, y - 34);
  ctx.quadraticCurveTo(x + 66, y - 48, x + 58, y - 58);
  ctx.stroke();
}

function drawBalloons(ctx, x, y, count) {
  const colors = ['#ff5d73', '#ffd166', '#4fc3f7'];
  for (let i = 0; i < count; i += 1) {
    const bx = x + (i - (count - 1) / 2) * 26;
    const by = y + (i % 2) * 10;
    ctx.strokeStyle = 'rgba(255, 247, 230, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx, by + 18);
    ctx.quadraticCurveTo(bx + 6, by + 44, bx - 2, by + 62);
    ctx.stroke();
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.ellipse(bx, by, 13, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.ellipse(bx - 4, by - 6, 4, 6, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBunting(ctx, w, y) {
  const colors = ['#ff5d73', '#ffd166', '#7ee081', '#4fc3f7', '#c77dff'];
  ctx.strokeStyle = '#3a2f5e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.quadraticCurveTo(w / 2, y + 34, w, y);
  ctx.stroke();
  for (let i = 0; i < 12; i += 1) {
    const t = i / 11;
    const fx = w * t;
    const fy = y + 34 * 2 * t * (1 - t) * 0.9;
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.moveTo(fx - 9, fy);
    ctx.lineTo(fx + 9, fy);
    ctx.lineTo(fx, fy + 16);
    ctx.closePath();
    ctx.fill();
  }
}

/* ------------------------------------------------------------------ */
/* Round 1 — Pasar Malam (night market)                                */
/* ------------------------------------------------------------------ */

export const LEVEL_1_DIFFS = [
  { id: 'moon', x: 500, y: 58, r: 36, label: 'Bulan sabit' },
  { id: 'lantern', x: 304, y: 92, r: 22, label: 'Warna lampion' },
  { id: 'cat', x: 330, y: 322, r: 26, label: 'Kucing hilang' },
  { id: 'balloons', x: 556, y: 118, r: 30, label: 'Balon berkurang' },
  { id: 'awning', x: 128, y: 148, r: 30, label: 'Warna tenda' },
  { id: 'skewers', x: 318, y: 226, r: 22, label: 'Sate berkurang' },
  { id: 'star', x: 92, y: 56, r: 16, label: 'Bintang ekstra' },
  { id: 'price', x: 128, y: 208, r: 20, label: 'Harga berubah' },
];

export function drawLevel1(ctx, w, h, changed) {
  const rng = createRandom(11);
  sky(ctx, w, h, '#160d33', '#3b1d5a');
  drawStars(ctx, rng, 46, w, h, 170);
  // The extra bright star only exists on the right panel.
  if (changed.has('star')) star(ctx, 92, 56, 3.4, '#ffffff');
  drawMoon(ctx, 500, 58, 32, changed.has('moon'));
  // Ground: the night street.
  ctx.fillStyle = '#241a38';
  ctx.fillRect(0, 296, w, h - 296);
  ctx.fillStyle = '#2e2347';
  ctx.fillRect(0, 296, w, 6);
  drawStringLights(ctx, w, 34, 26, rng, { x: 304, y: 92, color: changed.has('lantern') ? '#2ec4b6' : '#ff5d73' });
  drawBunting(ctx, w, 128);
  drawStall(ctx, 22, 148, 210, changed.has('awning') ? '#ff8c42' : '#e63946', '#fff1d6', 'SATE', changed.has('price') ? '7K' : '5K', '#3a2f5e');
  drawStall(ctx, 376, 148, 210, '#2a9d8f', '#fff1d6', 'ES TEH', '3K', '#1d3557');
  // Jars of sweets on the right stall.
  const jarColors = ['#ffd166', '#ff8fa3', '#7ee081'];
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = jarColors[i];
    ctx.beginPath();
    ctx.arc(416 + i * 44, 268, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(411 + i * 44, 262, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  drawCart(ctx, 258, 252, changed.has('skewers') ? 3 : 4);
  drawBalloons(ctx, 556, 96, changed.has('balloons') ? 2 : 3);
  if (!changed.has('cat')) drawCat(ctx, 330, 322);
  // Cobblestones.
  ctx.fillStyle = 'rgba(255, 247, 230, 0.08)';
  for (let i = 0; i < 14; i += 1) {
    ctx.beginPath();
    ctx.ellipse(20 + rng() * (w - 40), 312 + rng() * 48, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ------------------------------------------------------------------ */
/* Round 2 — Taman Lampion (lantern garden at dusk)                    */
/* ------------------------------------------------------------------ */

export const LEVEL_2_DIFFS = [
  { id: 'sun', x: 92, y: 68, r: 36, label: 'Sinar matahari' },
  { id: 'kite', x: 428, y: 82, r: 26, label: 'Warna layang-layang' },
  { id: 'lilies', x: 300, y: 330, r: 24, label: 'Daun teratai' },
  { id: 'birds', x: 252, y: 58, r: 24, label: 'Burung berkurang' },
  { id: 'apples', x: 72, y: 182, r: 26, label: 'Apel berkurang' },
  { id: 'treelamp', x: 520, y: 172, r: 22, label: 'Lampion menyala' },
  { id: 'butterfly', x: 182, y: 252, r: 18, label: 'Kupu-kupu hilang' },
  { id: 'pot', x: 470, y: 284, r: 22, label: 'Pot bunga hilang' },
];

function drawTree(ctx, x, y, scale, apples) {
  ctx.fillStyle = '#5a3820';
  ctx.fillRect(x - 7 * scale, y, 14 * scale, 70 * scale);
  ctx.fillStyle = '#2f7d32';
  ctx.beginPath();
  ctx.arc(x, y - 18 * scale, 52 * scale, 0, Math.PI * 2);
  ctx.arc(x - 36 * scale, y + 6 * scale, 34 * scale, 0, Math.PI * 2);
  ctx.arc(x + 36 * scale, y + 6 * scale, 34 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#43a047';
  ctx.beginPath();
  ctx.arc(x - 16 * scale, y - 34 * scale, 26 * scale, 0, Math.PI * 2);
  ctx.arc(x + 20 * scale, y - 26 * scale, 22 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e63946';
  const spots = [[-30, -30], [8, -44], [30, -8], [-8, 2], [22, -34]];
  for (let i = 0; i < apples; i += 1) {
    ctx.beginPath();
    ctx.arc(x + spots[i][0] * scale, y + spots[i][1] * scale, 6 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBird(ctx, x, y) {
  ctx.strokeStyle = '#22303c';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - 9, y);
  ctx.quadraticCurveTo(x - 4, y - 7, x, y);
  ctx.quadraticCurveTo(x + 4, y - 7, x + 9, y);
  ctx.stroke();
}

function drawKite(ctx, x, y, color) {
  ctx.strokeStyle = '#22303c';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y + 16);
  ctx.quadraticCurveTo(x - 30, y + 70, x - 44, y + 108);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 20);
  ctx.lineTo(x + 22, y + 4);
  ctx.lineTo(x, y + 18);
  ctx.lineTo(x - 22, y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#fff7e6';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - 20);
  ctx.lineTo(x, y + 18);
  ctx.moveTo(x - 22, y + 4);
  ctx.lineTo(x + 22, y + 4);
  ctx.stroke();
  ctx.fillStyle = color;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.arc(x - 22 - i * 8, y + 44 + i * 22, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBench(ctx, x, y, withPot) {
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(x, y, 96, 10);
  ctx.fillRect(x + 6, y + 10, 8, 22);
  ctx.fillRect(x + 82, y + 10, 8, 22);
  ctx.fillRect(x, y - 26, 96, 8);
  ctx.fillRect(x, y - 26, 8, 34);
  ctx.fillRect(x + 88, y - 26, 8, 34);
  if (withPot) {
    ctx.fillStyle = '#c96f2e';
    ctx.beginPath();
    ctx.moveTo(x + 34, y - 26);
    ctx.lineTo(x + 62, y - 26);
    ctx.lineTo(x + 58, y - 10);
    ctx.lineTo(x + 38, y - 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ff8fa3';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(x + 40 + i * 8, y - 30, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawButterfly(ctx, x, y) {
  ctx.fillStyle = '#c77dff';
  ctx.beginPath();
  ctx.ellipse(x - 7, y - 4, 8, 6, -0.5, 0, Math.PI * 2);
  ctx.ellipse(x + 7, y - 4, 8, 6, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7b2fbe';
  ctx.beginPath();
  ctx.ellipse(x, y, 2.5, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7b2fbe';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 2, y - 6);
  ctx.lineTo(x - 5, y - 12);
  ctx.moveTo(x + 2, y - 6);
  ctx.lineTo(x + 5, y - 12);
  ctx.stroke();
}

export function drawLevel2(ctx, w, h, changed) {
  const rng = createRandom(23);
  sky(ctx, w, h, '#0f5257', '#7fb069');
  // Sun with or without rays.
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(92, 68, 26, 0, Math.PI * 2);
  ctx.fill();
  if (!changed.has('sun')) {
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 4;
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(92 + Math.cos(a) * 32, 68 + Math.sin(a) * 32);
      ctx.lineTo(92 + Math.cos(a) * 42, 68 + Math.sin(a) * 42);
      ctx.stroke();
    }
  }
  // Clouds.
  ctx.fillStyle = 'rgba(255, 247, 230, 0.85)';
  for (const [cx, cy, s] of [[180, 52, 1], [330, 40, 0.8], [520, 60, 0.9]]) {
    ctx.beginPath();
    ctx.arc(cx, cy, 18 * s, 0, Math.PI * 2);
    ctx.arc(cx + 18 * s, cy - 6 * s, 14 * s, 0, Math.PI * 2);
    ctx.arc(cx + 36 * s, cy, 16 * s, 0, Math.PI * 2);
    ctx.fill();
  }
  drawBird(ctx, 232, 58);
  drawBird(ctx, 272, 46);
  if (!changed.has('birds')) drawBird(ctx, 312, 62);
  drawKite(ctx, 428, 82, changed.has('kite') ? '#4fc3f7' : '#ff5d73');
  // Grass.
  ctx.fillStyle = '#4c9a4c';
  ctx.fillRect(0, 250, w, h - 250);
  ctx.fillStyle = '#5cb85c';
  ctx.fillRect(0, 250, w, 8);
  drawTree(ctx, 72, 210, 1, changed.has('apples') ? 4 : 5);
  drawTree(ctx, 540, 216, 0.8, 3);
  // Lantern hanging from the right tree, lit or dark.
  if (changed.has('treelamp')) {
    ctx.fillStyle = 'rgba(255, 209, 102, 0.35)';
    ctx.beginPath();
    ctx.arc(520, 172, 30, 0, Math.PI * 2);
    ctx.fill();
  }
  drawLantern(ctx, 520, 172, changed.has('treelamp') ? '#ffd166' : '#8a5a33');
  // Pond with lily pads.
  ctx.fillStyle = '#2a7f9e';
  ctx.beginPath();
  ctx.ellipse(300, 322, 150, 40, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.beginPath();
  ctx.ellipse(270, 312, 60, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2f7d32';
  const pads = [[220, 322], [268, 336], [322, 326], [352, 338]];
  const padCount = changed.has('lilies') ? 3 : 4;
  for (let i = 0; i < padCount; i += 1) {
    ctx.beginPath();
    ctx.arc(pads[i][0], pads[i][1], 13, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#ff8fa3';
  ctx.beginPath();
  ctx.arc(268, 332, 6, 0, Math.PI * 2);
  ctx.fill();
  // Path and bench.
  ctx.fillStyle = '#d8c49a';
  ctx.beginPath();
  ctx.ellipse(300, 262, 190, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  drawBench(ctx, 424, 282, !changed.has('pot'));
  // Flowers.
  const flowerColors = ['#ff5d73', '#ffd166', '#ff8fa3', '#c77dff'];
  for (let i = 0; i < 10; i += 1) {
    const fx = 30 + rng() * (w - 60);
    const fy = 258 + rng() * 22;
    if (fx > 150 && fx < 450 && fy > 250) continue;
    ctx.fillStyle = flowerColors[i % flowerColors.length];
    ctx.beginPath();
    ctx.arc(fx, fy, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  if (!changed.has('butterfly')) drawButterfly(ctx, 182, 252);
}

/* ------------------------------------------------------------------ */
/* Round 3 — Pantai Senja (sunset beach)                               */
/* ------------------------------------------------------------------ */

export const LEVEL_3_DIFFS = [
  { id: 'sunset', x: 300, y: 148, r: 34, label: 'Matahari terbenam' },
  { id: 'sail', x: 420, y: 168, r: 26, label: 'Warna layar perahu' },
  { id: 'umbrella', x: 480, y: 248, r: 30, label: 'Warna payung' },
  { id: 'crab', x: 150, y: 330, r: 20, label: 'Kepiting hilang' },
  { id: 'ball', x: 252, y: 318, r: 22, label: 'Bola pantai' },
  { id: 'coconuts', x: 82, y: 300, r: 20, label: 'Kelapa berkurang' },
  { id: 'starfish', x: 380, y: 334, r: 18, label: 'Bintang laut hilang' },
  { id: 'cloud', x: 140, y: 78, r: 26, label: 'Awan ekstra' },
];

function drawPalm(ctx, x, y, coconuts) {
  ctx.strokeStyle = '#6b4226';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(x, y + 90);
  ctx.quadraticCurveTo(x + 8, y + 30, x - 4, y);
  ctx.stroke();
  ctx.fillStyle = '#2f7d32';
  for (let i = 0; i < 5; i += 1) {
    const a = -Math.PI * 0.9 + (i / 4) * Math.PI * 0.8;
    ctx.beginPath();
    ctx.moveTo(x - 4, y);
    ctx.quadraticCurveTo(x - 4 + Math.cos(a) * 44, y + Math.sin(a) * 26 - 14, x - 4 + Math.cos(a) * 66, y + Math.sin(a) * 40 + 6);
    ctx.quadraticCurveTo(x - 4 + Math.cos(a) * 34, y + Math.sin(a) * 30 + 8, x - 4, y);
    ctx.fill();
  }
  ctx.fillStyle = '#6b4226';
  for (let i = 0; i < coconuts; i += 1) {
    ctx.beginPath();
    ctx.arc(x - 10 + i * 12, y + 6, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawUmbrella(ctx, x, y, colorA, colorB) {
  ctx.strokeStyle = '#8a5a33';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 78);
  ctx.stroke();
  for (let i = 0; i < 6; i += 1) {
    const a0 = Math.PI + (i / 6) * Math.PI;
    const a1 = Math.PI + ((i + 1) / 6) * Math.PI;
    ctx.fillStyle = i % 2 === 0 ? colorA : colorB;
    ctx.beginPath();
    ctx.moveTo(x, y - 78);
    ctx.arc(x, y - 78, 52, a0, a1);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(x, y - 78, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 34, 5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawBoat(ctx, x, y, sailColor) {
  ctx.fillStyle = '#6b4226';
  ctx.beginPath();
  ctx.moveTo(x - 34, y);
  ctx.lineTo(x + 34, y);
  ctx.lineTo(x + 24, y + 14);
  ctx.lineTo(x - 24, y + 14);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5a3820';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 44);
  ctx.stroke();
  ctx.fillStyle = sailColor;
  ctx.beginPath();
  ctx.moveTo(x, y - 44);
  ctx.lineTo(x + 28, y - 6);
  ctx.lineTo(x, y - 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = sailColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - 44);
  ctx.lineTo(x - 16, y - 8);
  ctx.lineTo(x, y - 8);
  ctx.closePath();
  ctx.stroke();
}

function drawCrab(ctx, x, y) {
  ctx.fillStyle = '#e63946';
  ctx.beginPath();
  ctx.ellipse(x, y, 14, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - 12, y - 8, 5, 0, Math.PI * 2);
  ctx.arc(x + 12, y - 8, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff7e6';
  ctx.beginPath();
  ctx.arc(x - 5, y - 4, 2.5, 0, Math.PI * 2);
  ctx.arc(x + 5, y - 4, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e63946';
  ctx.lineWidth = 2.5;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x + side * 12, y + 2 + i * 3);
      ctx.lineTo(x + side * 24, y + 6 + i * 4);
      ctx.stroke();
    }
  }
}

function drawBeachBall(ctx, x, y, swapped) {
  const colors = swapped ? ['#4fc3f7', '#ff5d73', '#ffd166'] : ['#ff5d73', '#ffd166', '#4fc3f7'];
  for (let i = 0; i < 3; i += 1) {
    const a0 = -Math.PI / 2 + (i / 3) * Math.PI * 2;
    const a1 = -Math.PI / 2 + ((i + 1) / 3) * Math.PI * 2;
    ctx.fillStyle = colors[i];
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, 18, a0, a1);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#fff7e6';
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.stroke();
}

function drawStarfish(ctx, x, y) {
  ctx.fillStyle = '#ff8c42';
  ctx.beginPath();
  for (let i = 0; i < 5; i += 1) {
    const a = -Math.PI / 2 + (i / 5) * Math.PI * 2;
    const aMid = a + Math.PI / 5;
    const px = x + Math.cos(a) * 14;
    const py = y + Math.sin(a) * 14;
    const mx = x + Math.cos(aMid) * 6;
    const my = y + Math.sin(aMid) * 6;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
    ctx.lineTo(mx, my);
  }
  ctx.closePath();
  ctx.fill();
}

export function drawLevel3(ctx, w, h, changed) {
  const rng = createRandom(37);
  sky(ctx, w, h, '#ff7e5f', '#feb47b');
  // Sun: full disc, or half-sunk into the sea.
  ctx.fillStyle = '#ffdf6b';
  ctx.beginPath();
  ctx.arc(300, 148, 34, 0, Math.PI * 2);
  ctx.fill();
  if (changed.has('sunset')) {
    ctx.fillStyle = '#f4845f';
    ctx.fillRect(260, 148, 80, 40);
    ctx.fillStyle = '#2a7f9e';
    ctx.fillRect(260, 178, 80, 10);
  }
  ctx.fillStyle = 'rgba(255, 223, 107, 0.35)';
  ctx.beginPath();
  ctx.arc(300, 148, 48, 0, Math.PI * 2);
  ctx.fill();
  // Clouds, one extra on the right panel.
  ctx.fillStyle = 'rgba(255, 247, 230, 0.9)';
  for (const [cx, cy, s] of [[90, 70, 0.9], [470, 56, 1], [380, 96, 0.7]]) {
    ctx.beginPath();
    ctx.arc(cx, cy, 16 * s, 0, Math.PI * 2);
    ctx.arc(cx + 16 * s, cy - 5 * s, 12 * s, 0, Math.PI * 2);
    ctx.arc(cx + 32 * s, cy, 14 * s, 0, Math.PI * 2);
    ctx.fill();
  }
  if (changed.has('cloud')) {
    ctx.beginPath();
    ctx.arc(140, 78, 15, 0, Math.PI * 2);
    ctx.arc(154, 73, 11, 0, Math.PI * 2);
    ctx.arc(168, 78, 13, 0, Math.PI * 2);
    ctx.fill();
  }
  // Sea.
  ctx.fillStyle = '#2a7f9e';
  ctx.fillRect(0, 188, w, 82);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  for (let i = 0; i < 5; i += 1) {
    ctx.fillRect(40 + rng() * (w - 120), 200 + rng() * 56, 46 + rng() * 40, 3);
  }
  drawBoat(ctx, 420, 168, changed.has('sail') ? '#e63946' : '#fff7e6');
  drawBoat(ctx, 120, 200, '#ffd166');
  // Sand.
  ctx.fillStyle = '#f2d492';
  ctx.fillRect(0, 270, w, h - 270);
  ctx.fillStyle = '#e8c87e';
  ctx.fillRect(0, 270, w, 6);
  drawPalm(ctx, 86, 210, changed.has('coconuts') ? 2 : 3);
  drawUmbrella(ctx, 480, 330, changed.has('umbrella') ? '#7b2fbe' : '#ff8c42', '#fff7e6');
  // Beach towel under the umbrella.
  ctx.fillStyle = '#4fc3f7';
  ctx.fillRect(440, 336, 84, 20);
  ctx.fillStyle = '#fff7e6';
  ctx.fillRect(440, 342, 84, 5);
  drawBeachBall(ctx, 252, 318, changed.has('ball'));
  if (!changed.has('crab')) drawCrab(ctx, 150, 330);
  if (!changed.has('starfish')) drawStarfish(ctx, 380, 334);
  // Shells.
  ctx.fillStyle = '#fff7e6';
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    ctx.arc(320 + rng() * 220, 292 + rng() * 60, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ------------------------------------------------------------------ */
/* The level table: name, draw function, differences, seed.            */
/* ------------------------------------------------------------------ */

export const LEVELS = [
  { name: 'Ronde 1 — Pasar Malam', draw: drawLevel1, diffs: LEVEL_1_DIFFS, seed: 11 },
  { name: 'Ronde 2 — Taman Lampion', draw: drawLevel2, diffs: LEVEL_2_DIFFS, seed: 23 },
  { name: 'Ronde 3 — Pantai Senja', draw: drawLevel3, diffs: LEVEL_3_DIFFS, seed: 37 },
];

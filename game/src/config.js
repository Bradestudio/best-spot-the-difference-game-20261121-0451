// Every tuning number, layout constant and colour in one place. The game renders on a fixed
// 1280x480 logical canvas (the screenshot size); the renderer scales it to the window, so no
// rule below depends on the screen size.

export const CANVAS = { width: 1280, height: 480 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Top HUD strip and the two picture panels below it. */
export const HUD = { height: 56 };
export const PANEL = { width: 608, height: 368, y: 64, gap: 16, margin: 24 };
export const PANEL_LEFT = { x: PANEL.margin, y: PANEL.y };
export const PANEL_RIGHT = { x: PANEL.margin + PANEL.width + PANEL.gap, y: PANEL.y };

/** Seconds on the clock per round, hints per round, and points. */
export const ROUND = {
  seconds: 150,
  hints: 3,
  findPoints: 100,
  wrongPenalty: 25,
  wrongTimePenalty: 3,
  hintCost: 25,
  timeBonusPerSecond: 5,
};

/** How many differences each round hides, and how many rounds the game has. */
export const DIFFS_PER_ROUND = 8;
export const ROUNDS = 3;

/** Marker ring radius (a found difference) and click tolerance around a difference. */
export const MARKER = { radius: 24, pulseSeconds: 0.7 };
export const CLICK_RADIUS = 26;

/** Hint pulse: how long the hint ring stays visible, in seconds. */
export const HINT_SECONDS = 3;

export const PALETTE = {
  backdrop: '#14101f',
  hud: '#1d1730',
  hudLine: '#3a2f5e',
  panelFrame: '#f4b942',
  panelFrameDark: '#8a6420',
  text: '#fff7e6',
  muted: '#b9a8d8',
  accent: '#ffb347',
  accent2: '#ff5d73',
  good: '#7ee081',
  bad: '#ff5d5d',
  timerLow: '#ff5d5d',
  button: '#ff8c42',
  buttonText: '#241505',
  overlay: 'rgba(12, 8, 24, 0.82)',
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'pasar-malam.best';
export const BEST_STARS_KEY = 'pasar-malam.best-stars';

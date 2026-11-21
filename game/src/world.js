// The game's rules and state, with no drawing and no browser in it: three rounds of eight
// differences, the clock, the score, hints, markers and stars. step() advances one fixed
// step and returns what happened as bit flags, so the caller can react (sound, announcements)
// without the world knowing about screens. Panels are pre-rendered offscreen canvases the
// renderer blits; the world only tracks which differences are found.

import { CLICK_RADIUS, DIFFS_PER_ROUND, HINT_SECONDS, MARKER, ROUNDS, ROUND } from './config.js';
import { LEVELS } from './scenes.js';

export const EVENT_FOUND = 1;
export const EVENT_WRONG = 2;
export const EVENT_ROUND_WIN = 4;
export const EVENT_TIME_UP = 8;
export const EVENT_HINT = 16;

export function createWorld() {
  const state = {
    round: 1,
    score: 0,
    totalScore: 0,
    timeLeft: ROUND.seconds,
    found: [],
    wrongClicks: 0,
    hintsLeft: ROUND.hints,
    hint: null,
    wrongFlash: null,
    foundPulse: null,
    roundStars: 0,
    totalStars: 0,
    roundsWon: 0,
    gameWon: false,
    gameOver: false,
    muted: false,
    elapsed: 0,
  };

  function level() {
    return LEVELS[state.round - 1];
  }

  function resetRound(round) {
    state.round = round;
    state.score = 0;
    state.timeLeft = ROUND.seconds;
    state.found = [];
    state.wrongClicks = 0;
    state.hintsLeft = ROUND.hints;
    state.hint = null;
    state.wrongFlash = null;
    state.foundPulse = null;
    state.roundStars = 0;
    state.gameOver = false;
  }

  function resetAll() {
    state.totalScore = 0;
    state.totalStars = 0;
    state.roundsWon = 0;
    state.gameWon = false;
    resetRound(1);
  }

  /** The differences of the current round, each with found state attached. */
  function diffs() {
    return level().diffs;
  }

  function remaining() {
    return DIFFS_PER_ROUND - state.found.length;
  }

  function starsForRound() {
    if (state.wrongClicks === 0 && state.timeLeft > 60) return 3;
    if (state.wrongClicks <= 2 && state.timeLeft > 25) return 2;
    return 1;
  }

  /** Click at panel coordinates (x, y on either panel, `panel` 0 left / 1 right). Returns EVENT_* flags. */
  function clickAt(x, y, panel) {
    if (state.gameOver || state.found.length >= DIFFS_PER_ROUND) return 0;
    for (const diff of diffs()) {
      if (state.found.includes(diff.id)) continue;
      const dx = x - diff.x;
      const dy = y - diff.y;
      if (dx * dx + dy * dy <= CLICK_RADIUS * CLICK_RADIUS) {
        state.found.push(diff.id);
        state.score += ROUND.findPoints;
        state.foundPulse = { x: diff.x, y: diff.y, t: MARKER.pulseSeconds };
        if (state.found.length >= DIFFS_PER_ROUND) {
          const bonus = Math.floor(state.timeLeft) * ROUND.timeBonusPerSecond;
          state.score += bonus;
          state.totalScore += state.score;
          state.roundStars = starsForRound();
          state.totalStars += state.roundStars;
          state.roundsWon += 1;
          if (state.round >= ROUNDS) state.gameWon = true;
          state.gameOver = true;
          return EVENT_FOUND | EVENT_ROUND_WIN;
        }
        return EVENT_FOUND;
      }
    }
    // A wrong click: lose points and time, and flash a red X where it landed.
    state.score = Math.max(0, state.score - ROUND.wrongPenalty);
    state.timeLeft = Math.max(0, state.timeLeft - ROUND.wrongTimePenalty);
    state.wrongClicks += 1;
    state.wrongFlash = { x, y, panel, t: 0.6 };
    return EVENT_WRONG;
  }

  /** Use a hint: briefly pulse the next unfound difference. Returns EVENT_HINT or 0. */
  function useHint() {
    if (state.gameOver || state.hintsLeft <= 0 || state.found.length >= DIFFS_PER_ROUND) return 0;
    const next = diffs().find((diff) => !state.found.includes(diff.id));
    if (!next) return 0;
    state.hintsLeft -= 1;
    state.score = Math.max(0, state.score - ROUND.hintCost);
    state.hint = { x: next.x, y: next.y, t: HINT_SECONDS };
    return EVENT_HINT;
  }

  /** One fixed step: the clock and the marker/hint animations. */
  function step(dt) {
    let events = 0;
    state.elapsed += dt;
    if (!state.gameOver) {
      state.timeLeft -= dt;
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        state.gameOver = true;
        state.totalScore += state.score;
        events |= EVENT_TIME_UP;
      }
    }
    if (state.hint !== null) {
      state.hint.t -= dt;
      if (state.hint.t <= 0) state.hint = null;
    }
    if (state.wrongFlash !== null) {
      state.wrongFlash.t -= dt;
      if (state.wrongFlash.t <= 0) state.wrongFlash = null;
    }
    if (state.foundPulse !== null) {
      state.foundPulse.t -= dt;
      if (state.foundPulse.t <= 0) state.foundPulse = null;
    }
    return events;
  }

  resetAll();
  return { state, level, diffs, remaining, resetRound, resetAll, clickAt, useHint, step };
}

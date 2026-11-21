// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s steps
// (several in a slow frame, none in a fast one), and the renderer paints what is there. The
// game moves between five screens: title, play, round win, game win and time up.
//
// ?shot=start|play|play2|end stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot. Keyboard: H hint, M mute, R restart,
// Esc back to the menu, Space/Enter to start or continue.
import { BEST_KEY, BEST_STARS_KEY, STEP } from './config.js';
import { createAudio } from './audio.js';
import { createWorld, EVENT_FOUND, EVENT_HINT, EVENT_ROUND_WIN, EVENT_TIME_UP, EVENT_WRONG } from './world.js';
import { ACTION_CONFIRM, ACTION_HINT, ACTION_MENU, ACTION_MUTE, ACTION_RESTART, createInput } from './input.js';
import { createRenderer, SCREEN_GAME_WIN, SCREEN_PLAY, SCREEN_ROUND_WIN, SCREEN_TIME_UP, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld();
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function readBestStars() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_STARS_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBestStars(value) {
  try {
    window.localStorage.setItem(BEST_STARS_KEY, String(value));
  } catch {
    // See saveBest.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let bestStars = readBestStars();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes and each find.
  function announce(message) {
    status.textContent = message;
  }

  function startRound(round) {
    world.resetRound(round);
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce(`Ronde ${round}. Temukan 8 perbedaan.`);
  }

  function startGame() {
    world.resetAll();
    audio.unlock();
    audio.playClick();
    startRound(1);
  }

  function finishRound() {
    if (world.state.gameWon) {
      screen = SCREEN_GAME_WIN;
      if (world.state.totalScore > best) {
        best = world.state.totalScore;
        saveBest(best);
      }
      if (world.state.totalStars > bestStars) {
        bestStars = world.state.totalStars;
        saveBestStars(bestStars);
      }
      audio.playWin();
      announce(`Kamu menang! Skor akhir ${world.state.totalScore}.`);
    } else {
      screen = SCREEN_ROUND_WIN;
      audio.playWin();
      announce(`Ronde ${world.state.round} selesai. Skor ${world.state.score}.`);
    }
  }

  function handleClick() {
    const click = input.takeClick();
    if (click === null) return;
    const hit = renderer.hit(click.x, click.y, screen);
    if (hit.type === 'start' || hit.type === 'again') {
      startGame();
      return;
    }
    if (hit.type === 'next') {
      audio.playClick();
      if (world.state.gameWon) finishRound();
      else startRound(world.state.round + 1);
      return;
    }
    if (hit.type === 'hint') {
      if (world.useHint() & EVENT_HINT) {
        audio.playHint();
        announce(`Petunjuk: satu perbedaan berkedip. Sisa ${world.state.hintsLeft}.`);
      }
      return;
    }
    if (hit.type === 'mute') {
      world.state.muted = audio.toggleMute();
      return;
    }
    if (hit.type === 'restart') {
      startRound(world.state.round);
      return;
    }
    if (hit.type === 'panel' && screen === SCREEN_PLAY) {
      audio.unlock();
      const events = world.clickAt(hit.x, hit.y, hit.panel);
      if (events & EVENT_FOUND) {
        audio.playCorrect();
        announce(`Ketemu! Tersisa ${world.remaining()} perbedaan.`);
      }
      if (events & EVENT_WRONG) {
        audio.playWrong();
        announce('Bukan itu. Kurang 3 detik.');
      }
      if (events & EVENT_ROUND_WIN) finishRound();
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) world.state.muted = audio.toggleMute();
    if (actions & ACTION_MENU) {
      if (screen !== SCREEN_TITLE) {
        screen = SCREEN_TITLE;
        announce('Menu utama.');
      }
      return;
    }
    if (actions & ACTION_RESTART) {
      if (screen === SCREEN_PLAY || screen === SCREEN_TIME_UP) startRound(world.state.round);
      else if (screen === SCREEN_ROUND_WIN || screen === SCREEN_GAME_WIN) startGame();
      return;
    }
    if (actions & ACTION_HINT && screen === SCREEN_PLAY) {
      if (world.useHint() & EVENT_HINT) {
        audio.playHint();
        announce(`Petunjuk: satu perbedaan berkedip. Sisa ${world.state.hintsLeft}.`);
      }
      return;
    }
    if (actions & ACTION_CONFIRM) {
      if (screen === SCREEN_TITLE || screen === SCREEN_TIME_UP) startGame();
      else if (screen === SCREEN_ROUND_WIN) {
        if (world.state.gameWon) finishRound();
        else startRound(world.state.round + 1);
      } else if (screen === SCREEN_GAME_WIN) startGame();
    }
  }

  function step() {
    if (screen !== SCREEN_PLAY) return;
    const events = world.step(STEP);
    if (events & EVENT_TIME_UP) {
      screen = SCREEN_TIME_UP;
      audio.playLose();
      announce(`Waktu habis. ${world.state.found.length} dari 8 perbedaan ditemukan.`);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    handleClick();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  // Leaving the tab pauses the clock rather than letting time run out unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      accumulator = 0;
    }
  });

  announce('Pasar Malam, cari perbedaannya. Tekan Spasi atau klik untuk mulai.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();

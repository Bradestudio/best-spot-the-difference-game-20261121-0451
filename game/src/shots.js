// The screenshot scenes behind ?shot=start|play|play2|end. Each one stages the real world
// directly — no autopilot, no simulation — so the frame is exactly what a short game looks
// like and the same seed always gives the same frame:
//   start — the title screen over round 1's panels.
//   play  — round 1 mid-game: 3 of 8 differences found, markers on both panels, "Tersisa: 5".
//   play2 — round 2 mid-game: 5 of 8 found, "Tersisa: 3", a hint ring pulsing.
//   end   — the game-won screen after all three rounds, with the final score and stars.
import { ROUND } from './config.js';
import { SCREEN_GAME_WIN, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const FOUND_PLAY = ['moon', 'cat', 'balloons'];
const FOUND_PLAY2 = ['sun', 'kite', 'lilies', 'birds', 'butterfly'];

export function stageShot(name, world) {
  const state = world.state;
  if (name === 'play') {
    world.resetAll();
    state.found = [...FOUND_PLAY];
    state.score = 300;
    state.timeLeft = 105;
    state.hintsLeft = 2;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'play2') {
    world.resetAll();
    world.resetRound(2);
    state.found = [...FOUND_PLAY2];
    state.score = 475;
    state.totalScore = 1120;
    state.timeLeft = 88;
    state.hintsLeft = 1;
    state.hint = { x: 520, y: 172, t: ROUND.hints };
    return { screen: SCREEN_PLAY, best: 1120 };
  }
  if (name === 'end') {
    world.resetAll();
    world.resetRound(3);
    state.found = ['sunset', 'sail', 'umbrella', 'crab', 'ball', 'coconuts', 'starfish', 'cloud'];
    state.score = 1640;
    state.totalScore = 4210;
    state.totalStars = 8;
    state.roundsWon = 3;
    state.gameWon = true;
    state.gameOver = true;
    return { screen: SCREEN_GAME_WIN, best: 4210 };
  }
  world.resetAll();
  return { screen: SCREEN_TITLE, best: 1240 };
}

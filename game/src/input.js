// Keyboard and pointer input. One-shot presses (start, hint, mute, restart, menu) are queued
// as bit flags and taken once by the loop, so a press between two frames is never lost and
// never counted twice. Pointer clicks carry their canvas coordinates.

export const ACTION_CONFIRM = 1;
export const ACTION_HINT = 2;
export const ACTION_MUTE = 4;
export const ACTION_RESTART = 8;
export const ACTION_MENU = 16;

const CONFIRM = new Set(['Space', 'Enter']);
const HINT = new Set(['KeyH']);
const MUTE = new Set(['KeyM']);
const RESTART = new Set(['KeyR']);
const MENU = new Set(['Escape']);

export function createInput(target) {
  let actions = 0;
  let click = null;

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (CONFIRM.has(event.code)) actions |= ACTION_CONFIRM;
    else if (HINT.has(event.code)) actions |= ACTION_HINT;
    else if (MUTE.has(event.code)) actions |= ACTION_MUTE;
    else if (RESTART.has(event.code)) actions |= ACTION_RESTART;
    else if (MENU.has(event.code)) actions |= ACTION_MENU;
    else return;
    event.preventDefault();
  });
  target.addEventListener('pointerdown', (event) => {
    const rect = target.getBoundingClientRect();
    click = {
      x: ((event.clientX - rect.left) / rect.width) * target.width,
      y: ((event.clientY - rect.top) / rect.height) * target.height,
    };
  });

  return {
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The last pointer click in canvas coordinates, or null. */
    takeClick() {
      const taken = click;
      click = null;
      return taken;
    },
  };
}

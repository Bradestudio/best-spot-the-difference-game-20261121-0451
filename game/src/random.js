// A tiny seeded RNG (mulberry32) so each round's scene is identical on both panels and the
// same seed always paints the same picture — screenshots included.

export function createRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [min, max] from a seeded RNG. */
export function randomInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

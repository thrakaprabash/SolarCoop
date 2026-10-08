export function seededRandom(seed = 42) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let n = Math.imul(seed ^ seed >>> 15, 1 | seed);
    n ^= n + Math.imul(n ^ n >>> 7, 61 | n);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}

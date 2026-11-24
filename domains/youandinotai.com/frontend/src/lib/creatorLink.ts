/**
 * Creator short link and QR code, shared by the /creators page.
 *
 * This is the same generator that public/affiliate-links.html ships and tests
 * (byte mode, error level L, QR versions 1 to 5, drawn with no outside
 * script). creatorLink.test.ts proves both give the same links and the same
 * QR modules, so the two can never drift apart without a failing test.
 */

export const CREATOR_LINK_BASE = 'https://youandinotai.com/c/';

/** Turn what the creator typed into a short name, or null if it cannot be one. */
export function toShortName(raw: string): string | null {
  const name = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return /^[a-z0-9-]{3,30}$/.test(name) ? name : null;
}

export function buildCreatorLink(raw: string): string | null {
  const name = toShortName(raw);
  return name ? CREATOR_LINK_BASE + name : null;
}

// ---- QR code (byte mode, error level L, versions 1 to 5) ----
const DATA_CW = [0, 19, 34, 55, 80, 108];
const ECC_CW = [0, 7, 10, 15, 20, 26];

function gfMul(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function rsRemainder(data: number[], degree: number): number[] {
  const gen: number[] = [];
  for (let i = 0; i < degree; i++) gen.push(0);
  gen[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      gen[j] = gfMul(gen[j], root);
      if (j + 1 < degree) gen[j] ^= gen[j + 1];
    }
    root = gfMul(root, 2);
  }
  const rem = gen.map(() => 0);
  data.forEach(b => {
    const f = b ^ (rem.shift() as number);
    rem.push(0);
    gen.forEach((g, k) => {
      rem[k] ^= gfMul(g, f);
    });
  });
  return rem;
}

export type Qr = { size: number; modules: boolean[][] };

export function makeQr(text: string): Qr | null {
  const bytes = Array.from(new TextEncoder().encode(text));
  let v = 1;
  while (v <= 5 && 12 + bytes.length * 8 > DATA_CW[v] * 8) v++;
  if (v > 5) return null;
  const bits: number[] = [];
  const put = (val: number, n: number) => {
    for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  };
  put(4, 4);
  put(bytes.length, 8);
  bytes.forEach(b => put(b, 8));
  const cap = DATA_CW[v] * 8;
  put(0, Math.min(4, cap - bits.length));
  while (bits.length % 8) bits.push(0);
  for (let pad = 0xec; bits.length < cap; pad ^= 0xec ^ 0x11) put(pad, 8);
  const cw: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    cw.push(b);
  }
  const all = cw.concat(rsRemainder(cw, ECC_CW[v]));

  const size = 17 + 4 * v;
  const mod: boolean[][] = [];
  const fn: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    mod.push(new Array<boolean>(size).fill(false));
    fn.push(new Array<boolean>(size).fill(false));
  }
  const setF = (x: number, y: number, dark: boolean) => {
    mod[y][x] = dark;
    fn[y][x] = true;
  };

  for (let i = 0; i < size; i++) {
    setF(6, i, i % 2 === 0);
    setF(i, 6, i % 2 === 0);
  }
  [
    [3, 3],
    [size - 4, 3],
    [3, size - 4],
  ].forEach(c => {
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = c[0] + dx;
        const yy = c[1] + dy;
        if (xx >= 0 && xx < size && yy >= 0 && yy < size)
          setF(xx, yy, d !== 2 && d !== 4);
      }
  });
  if (v >= 2) {
    const a = size - 7;
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++)
        setF(a + dx, a + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }
  const drawFormat = (mask: number) => {
    const data = (1 << 3) | mask; // level L = 01
    let rem = data;
    for (let k = 0; k < 10; k++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const f = ((data << 10) | rem) ^ 0x5412;
    const bit = (n: number) => ((f >>> n) & 1) !== 0;
    for (let k = 0; k <= 5; k++) setF(8, k, bit(k));
    setF(8, 7, bit(6));
    setF(8, 8, bit(7));
    setF(7, 8, bit(8));
    for (let k = 9; k < 15; k++) setF(14 - k, 8, bit(k));
    for (let k = 0; k < 8; k++) setF(size - 1 - k, 8, bit(k));
    for (let k = 8; k < 15; k++) setF(8, size - 15 + k, bit(k));
    setF(8, size - 8, true);
  };
  drawFormat(0);

  let idx = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const up = ((right + 1) & 2) === 0;
        const yy = up ? size - 1 - vert : vert;
        if (!fn[yy][x] && idx < all.length * 8) {
          mod[yy][x] = ((all[idx >>> 3] >>> (7 - (idx & 7))) & 1) !== 0;
          idx++;
        }
      }
    }
  }

  const MASKS: Array<(x: number, y: number) => boolean> = [
    (x, y) => (x + y) % 2 === 0,
    (_x, y) => y % 2 === 0,
    x => x % 3 === 0,
    (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ];
  const applyMask = (m: number) => {
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++)
        if (!fn[y][x] && MASKS[m](x, y)) mod[y][x] = !mod[y][x];
  };
  const penalty = () => {
    let p = 0;
    let dark = 0;
    for (let y = 0; y < size; y++) {
      for (let run = 1, x = 1; x <= size; x++) {
        if (x < size && mod[y][x] === mod[y][x - 1]) run++;
        else {
          if (run >= 5) p += run - 2;
          run = 1;
        }
      }
    }
    for (let x = 0; x < size; x++) {
      for (let run = 1, y = 1; y <= size; y++) {
        if (y < size && mod[y][x] === mod[y - 1][x]) run++;
        else {
          if (run >= 5) p += run - 2;
          run = 1;
        }
      }
    }
    for (let y = 0; y < size - 1; y++)
      for (let x = 0; x < size - 1; x++) {
        const k = mod[y][x];
        if (
          k === mod[y][x + 1] &&
          k === mod[y + 1][x] &&
          k === mod[y + 1][x + 1]
        )
          p += 3;
      }
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) if (mod[y][x]) dark++;
    p +=
      Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
    return p;
  };
  let best = 0;
  let bestP = Infinity;
  for (let m = 0; m < 8; m++) {
    applyMask(m);
    drawFormat(m);
    const score = penalty();
    if (score < bestP) {
      bestP = score;
      best = m;
    }
    applyMask(m);
  }
  applyMask(best);
  drawFormat(best);
  return { size, modules: mod };
}

/** Paint the QR for `text` onto `canvas`: black on white with a 4-module quiet zone. */
export function drawQr(canvas: HTMLCanvasElement, text: string): Qr | null {
  const qr = makeQr(text);
  const ctx = canvas.getContext && canvas.getContext('2d');
  if (!qr || !ctx) return qr;
  const quiet = 4;
  const total = qr.size + quiet * 2;
  const scale = Math.floor(canvas.width / total);
  const offset = Math.floor((canvas.width - scale * total) / 2) + quiet * scale;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';
  for (let y = 0; y < qr.size; y++)
    for (let x = 0; x < qr.size; x++)
      if (qr.modules[y][x])
        ctx.fillRect(offset + x * scale, offset + y * scale, scale, scale);
  return qr;
}

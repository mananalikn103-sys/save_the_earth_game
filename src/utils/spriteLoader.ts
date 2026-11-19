export const USER_EARTH_IMG = '/assets/aistudio/file_000000005a5c8211bd8cd048dd7d90f5_3497e3a5.png';
export const USER_BEE_IMG = '/assets/aistudio/file_00000000a3e48211898064e1f3fc5f7a_780fa2a9.png';
export const USER_BG_IMG = '/assets/aistudio/file_00000000b4948211bbcdb4c8f7047874_0cf4b6c6.png';

interface ProcessedSprite {
  canvas: HTMLCanvasElement;
  dataUrl: string;
}

const spriteCache = new Map<string, Promise<ProcessedSprite>>();

/**
 * Removes contiguous near-white background starting from image edges using BFS flood-fill,
 * preserving internal whites (gloves, sneakers, eye highlights).
 */
function stripOuterWhiteBackground(img: HTMLImageElement): ProcessedSprite {
  const maxDim = 320;
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const w = Math.max(1, Math.round((img.naturalWidth || 256) * scale));
  const h = Math.max(1, Math.round((img.naturalHeight || 256) * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { canvas, dataUrl: img.src };
  }

  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const isBgLike = (idx: number) => {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];
    if (a < 20) return true;
    return r >= 232 && g >= 232 && b >= 232;
  };

  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;

  const enqueue = (x: number, y: number) => {
    const pos = y * w + x;
    if (visited[pos]) return;
    if (!isBgLike(pos * 4)) return;
    visited[pos] = 1;
    queue[tail++] = pos;
  };

  // Seed flood-fill along all 4 image borders
  for (let x = 0; x < w; x++) {
    enqueue(x, 0);
    enqueue(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    enqueue(0, y);
    enqueue(w - 1, y);
  }

  while (head < tail) {
    const pos = queue[head++];
    const px = pos % w;
    const py = (pos - px) / w;

    data[pos * 4 + 3] = 0;

    if (px > 0) enqueue(px - 1, py);
    if (px < w - 1) enqueue(px + 1, py);
    if (py > 0) enqueue(px, py - 1);
    if (py < h - 1) enqueue(px, py + 1);
  }

  // Soft anti-alias pass on 1px border neighbors
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const pos = y * w + x;
      if (visited[pos]) continue;
      const idx = pos * 4;
      const lum = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      if (lum > 215) {
        const hasTransparentNeighbor =
          visited[pos - 1] || visited[pos + 1] || visited[pos - w] || visited[pos + w];
        if (hasTransparentNeighbor) {
          data[idx + 3] = Math.round(data[idx + 3] * 0.45);
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return {
    canvas,
    dataUrl: canvas.toDataURL('image/png'),
  };
}

export function loadTransparentSprite(src: string): Promise<ProcessedSprite> {
  const existing = spriteCache.get(src);
  if (existing) return existing;

  const promise = new Promise<ProcessedSprite>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        resolve(stripOuterWhiteBackground(img));
      } catch {
        const fallback = document.createElement('canvas');
        fallback.width = img.naturalWidth || 128;
        fallback.height = img.naturalHeight || 128;
        fallback.getContext('2d')?.drawImage(img, 0, 0);
        resolve({ canvas: fallback, dataUrl: src });
      }
    };
    img.onerror = () => {
      const fallback = document.createElement('canvas');
      fallback.width = 64;
      fallback.height = 64;
      resolve({ canvas: fallback, dataUrl: src });
    };
    img.src = src;
  });

  spriteCache.set(src, promise);
  return promise;
}

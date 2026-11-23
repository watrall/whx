/**
 * A perceptual "difference hash" of a JPEG: 64 bits that stay almost the same when a photo is
 * resized, recompressed or cropped a little, so two shots of one scene land close together.
 */
import jpeg from 'jpeg-js';

const COLS = 9;
const ROWS = 8;

/** Mean brightness of the part of the image under cell (x, y) of a COLS x ROWS grid. */
function cellBrightness({ width, height, data }, x, y) {
  const x0 = Math.floor((x * width) / COLS);
  const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * width) / COLS));
  const y0 = Math.floor((y * height) / ROWS);
  const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * height) / ROWS));
  let sum = 0;
  let count = 0;
  for (let row = y0; row < y1; row += 1) {
    for (let col = x0; col < x1; col += 1) {
      const at = (row * width + col) * 4;
      sum += 0.299 * data[at] + 0.587 * data[at + 1] + 0.114 * data[at + 2];
      count += 1;
    }
  }
  return sum / count;
}

/** The hash of a JPEG file's bytes, as 16 hex digits. */
export function dhash(buffer) {
  const image = jpeg.decode(buffer, { useTArray: true, maxResolutionInMP: 30 });
  let bits = 0n;
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS - 1; x += 1) {
      bits = (bits << 1n) | (cellBrightness(image, x, y) > cellBrightness(image, x + 1, y) ? 1n : 0n);
    }
  }
  return bits.toString(16).padStart(16, '0');
}

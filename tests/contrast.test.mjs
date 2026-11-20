import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Reads the OKLCH channel tokens straight from index.css so the test cannot
// drift from what ships.
const css = await readFile(new URL('../app/src/index.css', import.meta.url), 'utf8');

function token(name) {
  const match = css.match(new RegExp(`--${name}:\\s*([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+);`));
  assert.ok(match, `token --${name} not found in index.css`);
  return match.slice(1).map(Number);
}

function linearRgb([L, C, H]) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function luminance(color) {
  const [r, g, b] = linearRgb(color).map((v) => Math.min(1, Math.max(0, v)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const TYPES = ['cultural', 'natural', 'mixed'];

test('danger red works as an icon on paper and as a fill under paper text', () => {
  assert.ok(contrast(token('danger'), token('paper')) >= 4.5, 'danger on paper');
  assert.ok(contrast(token('paper'), token('danger')) >= 4.5, 'paper text on danger');
});

test('danger red differs from the Cultural terracotta in luminance', () => {
  assert.ok(contrast(token('danger'), token('type-cultural')) >= 1.25);
});

test('body and muted text meet WCAG AA on paper surfaces', () => {
  for (const surface of ['paper', 'paper-raised']) {
    assert.ok(contrast(token('ink'), token(surface)) >= 7, `ink on ${surface}`);
    assert.ok(contrast(token('ink-muted'), token(surface)) >= 4.5, `ink-muted on ${surface}`);
  }
});

for (const type of TYPES) {
  test(`${type}: solid works as text on paper and as a fill under paper text`, () => {
    const solid = token(`type-${type}`);
    assert.ok(contrast(solid, token('paper')) >= 4.5, 'solid on paper');
    assert.ok(contrast(token('paper'), solid) >= 4.5, 'paper text on solid');
  });

  test(`${type}: ink text is legible on its tint`, () => {
    assert.ok(contrast(token(`type-${type}-ink`), token(`type-${type}-tint`)) >= 4.5);
  });
}

test('type colours differ in luminance as well as hue', () => {
  const solids = TYPES.map((type) => token(`type-${type}`));
  for (let i = 0; i < solids.length; i += 1) {
    for (let j = i + 1; j < solids.length; j += 1) {
      assert.ok(
        contrast(solids[i], solids[j]) >= 1.15,
        `${TYPES[i]} and ${TYPES[j]} are too close in luminance`,
      );
    }
  }
});

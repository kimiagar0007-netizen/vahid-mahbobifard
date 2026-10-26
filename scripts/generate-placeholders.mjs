#!/usr/bin/env node
/**
 * Generates the illustrative placeholder images used by the site.
 *
 * These are abstract architectural scenes drawn in the brand palette — no stock
 * photos and no third-party artwork. They are marked as placeholders in the UI
 * («نمونه طراحی» / «تصویر نمایشی») and can be replaced from the admin panel with
 * real photographs at any time.
 *
 * Usage (from the repository root, inside a Node container):
 *   node scripts/generate-placeholders.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { categories, products, services, portfolio } from '../api/src/content/catalog.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(here, '..', 'web', 'public', 'images');

const GOLD = '#D4AF62';
const GOLD_LIGHT = '#F1D99A';
const BLACK = '#0B0B0D';
const BLACK_DEEP = '#121216';
const GRAY_DARK = '#25252A';

function makeRandom(seedText) {
  let seed = 0;
  for (const ch of seedText) seed = (seed * 31 + ch.charCodeAt(0)) % 4294967296;
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const stroke = (x1, y1, x2, y2, { color = GOLD, width = 2, opacity = 0.5 } = {}) =>
  `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="${width}" stroke-opacity="${opacity}" stroke-linecap="round"/>`;

const box = (x, y, w, h, { color = GOLD, width = 2, opacity = 0.5, fill = 'none', radius = 0 } = {}) =>
  `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${radius}" fill="${fill}" stroke="${color}" stroke-width="${width}" stroke-opacity="${opacity}"/>`;

const plate = (x, y, w, h, { color = GOLD, opacity = 0.16, radius = 6 } = {}) =>
  `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${radius}" fill="${color}" fill-opacity="${opacity}"/>`;

const circle = (cx, cy, r, { color = GOLD, width = 2, opacity = 0.6, fill = 'none' } = {}) =>
  `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" stroke="${color}" stroke-width="${width}" stroke-opacity="${opacity}"/>`;

const dot = (cx, cy, r, { color = GOLD_LIGHT, opacity = 0.7 } = {}) =>
  `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="${color}" fill-opacity="${opacity}"/>`;

/** Faint construction grid, drawn behind every scene. */
function grid(w, h, step = 48, opacity = 0.05) {
  const parts = [];
  for (let x = step; x < w; x += step) parts.push(stroke(x, 0, x, h, { color: '#FFFFFF', width: 1, opacity }));
  for (let y = step; y < h; y += step) parts.push(stroke(0, y, w, y, { color: '#FFFFFF', width: 1, opacity }));
  return parts.join('');
}

const SCENES = {
  ceiling_linear(w, h, rand) {
    const parts = [];
    const horizon = h * 0.42;
    parts.push(stroke(0, horizon, w, horizon, { width: 2, opacity: 0.35 }));
    for (let i = -6; i <= 6; i += 1) {
      parts.push(stroke(w / 2 + i * (w / 9), h, w / 2 + i * (w / 22), horizon, { width: 1.5, opacity: 0.22 }));
    }
    for (let i = 1; i <= 5; i += 1) {
      const y = horizon + Math.pow(i / 5, 1.7) * (h - horizon);
      parts.push(stroke(0, y, w, y, { width: 1.5, opacity: 0.18 }));
    }
    for (let i = 0; i < 3; i += 1) {
      const y = horizon + (i + 0.7) * ((h - horizon) / 3.4);
      const inset = 18 - i * 5;
      parts.push(plate(inset, y, w - inset * 2, 7, { color: GOLD_LIGHT, opacity: 0.5 - i * 0.11, radius: 4 }));
      parts.push(plate(inset, y - 7, w - inset * 2, 21, { color: GOLD, opacity: 0.12, radius: 10 }));
    }
    for (let i = 0; i < 4; i += 1) {
      const x = w * (0.16 + i * 0.22);
      parts.push(dot(x, horizon + (h - horizon) * 0.12, 3.4, { opacity: 0.8 }));
    }
    parts.push(box(w * 0.08, horizon + 6, w * 0.18, h * 0.22, { opacity: 0.25, radius: 6 }));
    return parts.join('');
  },

  ceiling_cove(w, h, rand) {
    const parts = [];
    const outer = { x: w * 0.12, y: h * 0.16, w: w * 0.76, h: h * 0.68 };
    parts.push(box(outer.x, outer.y, outer.w, outer.h, { opacity: 0.45, radius: 26, width: 2.4 }));
    parts.push(box(outer.x + 26, outer.y + 26, outer.w - 52, outer.h - 52, { opacity: 0.22, radius: 18 }));
    parts.push(plate(outer.x + 34, outer.y + 34, outer.w - 68, outer.h - 68, { color: GOLD_LIGHT, opacity: 0.07, radius: 14 }));
    for (let i = 0; i < 4; i += 1) {
      const offset = 40 + i * 9;
      parts.push(
        box(outer.x - offset, outer.y - offset, outer.w + offset * 2, outer.h + offset * 2, {
          opacity: 0.12 - i * 0.025,
          radius: 34,
          width: 1.6,
          color: GOLD_LIGHT,
        }),
      );
    }
    parts.push(plate(w * 0.06, h * 0.86, w * 0.88, 8, { color: GOLD, opacity: 0.3, radius: 4 }));
    return parts.join('');
  },

  drywall(w, h, rand) {
    const parts = [];
    const cols = 3;
    const rows = 2;
    const pad = w * 0.08;
    const cw = (w - pad * 2) / cols;
    const ch = (h - pad * 2) / rows;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const x = pad + c * cw + (r % 2 ? cw * 0.12 : 0);
        const y = pad + r * ch;
        parts.push(box(x, y, cw - 10, ch - 14, { opacity: 0.4, radius: 4 }));
        parts.push(plate(x + 6, y + 6, cw - 22, ch - 26, { color: '#FFFFFF', opacity: 0.03, radius: 3 }));
        for (let s = 0; s < 4; s += 1) {
          parts.push(dot(x + 14 + s * 14, y + ch - 26, 2.2, { opacity: 0.5 }));
        }
      }
    }
    parts.push(stroke(pad, h * 0.52, w - pad, h * 0.52, { color: GOLD_LIGHT, width: 2.4, opacity: 0.5 }));
    return parts.join('');
  },

  profile(w, h, rand) {
    const parts = [];
    for (let i = 0; i < 5; i += 1) {
      const y = h * 0.14 + i * (h * 0.15);
      const left = w * (0.1 + i * 0.02);
      const right = w * (0.9 - i * 0.02);
      parts.push(stroke(left, y, right, y, { width: 2.4, opacity: 0.45 }));
      parts.push(stroke(left, y + 18, right, y + 18, { width: 2.4, opacity: 0.3 }));
      parts.push(stroke(left, y, left, y + 18, { width: 2.4, opacity: 0.4 }));
      parts.push(stroke(right, y, right, y + 18, { width: 2.4, opacity: 0.4 }));
      parts.push(stroke(left + 8, y + 18, right - 8, y + 18, { color: GOLD_LIGHT, width: 1, opacity: 0.2 }));
    }
    parts.push(plate(0, h * 0.86, w, 6, { color: GOLD, opacity: 0.24, radius: 3 }));
    return parts.join('');
  },

  screw(w, h, rand) {
    const parts = [];
    for (let r = 0; r < 5; r += 1) {
      for (let c = 0; c < 8; c += 1) {
        const x = w * 0.1 + c * (w * 0.8 / 7) + (r % 2 ? 12 : 0);
        const y = h * 0.16 + r * (h * 0.16);
        parts.push(circle(x, y, 8 + (r % 3), { width: 1.8, opacity: 0.32 }));
        parts.push(dot(x, y, 2.4, { opacity: 0.6 }));
      }
    }
    parts.push(stroke(w * 0.1, h * 0.9, w * 0.9, h * 0.9, { color: GOLD_LIGHT, width: 2, opacity: 0.4 }));
    return parts.join('');
  },

  jointing(w, h, rand) {
    const parts = [];
    parts.push(stroke(w * 0.06, h * 0.76, w * 0.94, h * 0.24, { color: GOLD_LIGHT, width: 10, opacity: 0.18 }));
    parts.push(stroke(w * 0.06, h * 0.76, w * 0.94, h * 0.24, { width: 2, opacity: 0.5 }));
    for (let i = 0; i < 5; i += 1) {
      const y = h * (0.3 + i * 0.1);
      parts.push(stroke(w * 0.12, y, w * 0.88, y - h * 0.06, { width: 1.4, opacity: 0.16 }));
    }
    parts.push(box(w * 0.18, h * 0.12, w * 0.64, h * 0.26, { opacity: 0.3, radius: 18 }));
    parts.push(plate(w * 0.22, h * 0.16, w * 0.56, h * 0.18, { color: '#FFFFFF', opacity: 0.03, radius: 14 }));
    return parts.join('');
  },

  insulation(w, h, rand) {
    const parts = [];
    for (let band = 0; band < 4; band += 1) {
      const y0 = h * (0.14 + band * 0.2);
      let d = `M ${w * 0.08} ${y0}`;
      const steps = 12;
      for (let i = 1; i <= steps; i += 1) {
        const x = w * 0.08 + (i / steps) * w * 0.84;
        d += ` L ${x.toFixed(1)} ${(y0 + (i % 2 ? -14 : 14)).toFixed(1)}`;
      }
      parts.push(`<path d="${d}" fill="none" stroke="${GOLD}" stroke-width="2" stroke-opacity="0.35"/>`);
      parts.push(plate(w * 0.08, y0 + 24, w * 0.84, 26, { color: GOLD_LIGHT, opacity: 0.06, radius: 6 }));
    }
    parts.push(stroke(w * 0.08, h * 0.9, w * 0.92, h * 0.9, { width: 2, opacity: 0.4 }));
    return parts.join('');
  },

  tools(w, h, rand) {
    const parts = [];
    // trowel
    parts.push(`<path d="M ${w * 0.18} ${h * 0.66} L ${w * 0.46} ${h * 0.72} L ${w * 0.3} ${h * 0.9} Z" fill="none" stroke="${GOLD}" stroke-width="2.4" stroke-opacity="0.5"/>`);
    parts.push(stroke(w * 0.4, h * 0.7, w * 0.52, h * 0.58, { width: 3, opacity: 0.45 }));
    // level
    parts.push(box(w * 0.5, h * 0.26, w * 0.42, h * 0.12, { opacity: 0.45, radius: 8 }));
    parts.push(circle(w * 0.71, h * 0.32, 9, { color: GOLD_LIGHT, width: 2, opacity: 0.6 }));
    for (let i = 0; i < 3; i += 1) parts.push(dot(w * (0.58 + i * 0.06), h * 0.32, 2.6, { opacity: 0.5 }));
    // cutter blade
    parts.push(stroke(w * 0.14, h * 0.24, w * 0.42, h * 0.24, { width: 3, opacity: 0.4 }));
    parts.push(stroke(w * 0.14, h * 0.24, w * 0.14, h * 0.46, { width: 3, opacity: 0.4 }));
    parts.push(plate(w * 0.1, h * 0.94, w * 0.8, 5, { color: GOLD, opacity: 0.25, radius: 3 }));
    return parts.join('');
  },

  warehouse(w, h, rand) {
    const parts = [];
    const depth = w * 0.06;
    for (let i = 0; i < 3; i += 1) {
      const y = h * 0.2 + i * h * 0.24;
      for (let s = 0; s < 5; s += 1) {
        const x = w * 0.08 + s * (w * 0.17);
        parts.push(plate(x + i * depth, y - i * depth * 0.4, w * 0.14, h * 0.16, { color: GOLD, opacity: 0.1 + i * 0.04, radius: 3 }));
        parts.push(box(x + i * depth, y - i * depth * 0.4, w * 0.14, h * 0.16, { opacity: 0.22, radius: 3, width: 1.4 }));
      }
      parts.push(stroke(w * 0.05, y + h * 0.165, w * 0.95, y + h * 0.165, { width: 2, opacity: 0.3 }));
    }
    parts.push(plate(0, h * 0.93, w, 6, { color: GOLD_LIGHT, opacity: 0.18, radius: 3 }));
    return parts.join('');
  },

  office(w, h, rand) {
    const parts = [];
    const horizon = h * 0.55;
    parts.push(stroke(0, horizon, w, horizon, { width: 2, opacity: 0.3 }));
    for (let i = 1; i <= 4; i += 1) {
      const y = horizon - i * (h * 0.11);
      parts.push(stroke(w * 0.06, y, w * 0.94, y, { width: 1.5, opacity: 0.2 }));
    }
    parts.push(plate(w * 0.1, horizon - 16, w * 0.8, 8, { color: GOLD_LIGHT, opacity: 0.35, radius: 4 }));
    // desks
    parts.push(box(w * 0.14, horizon + h * 0.08, w * 0.26, h * 0.06, { opacity: 0.35, radius: 4 }));
    parts.push(box(w * 0.46, horizon + h * 0.14, w * 0.3, h * 0.06, { opacity: 0.35, radius: 4 }));
    parts.push(stroke(w * 0.16, horizon + h * 0.14, w * 0.16, horizon + h * 0.28, { width: 2, opacity: 0.3 }));
    parts.push(stroke(w * 0.62, horizon + h * 0.2, w * 0.62, horizon + h * 0.3, { width: 2, opacity: 0.3 }));
    return parts.join('');
  },

  commercial(w, h, rand) {
    const parts = [];
    for (let i = 0; i < 4; i += 1) {
      const x = w * (0.12 + i * 0.25);
      parts.push(box(x, h * 0.2, w * 0.045, h * 0.66, { opacity: 0.3, radius: 3 }));
      parts.push(circle(x + w * 0.022, h * 0.22, 4, { color: GOLD_LIGHT, opacity: 0.5, fill: GOLD_LIGHT }));
    }
    for (let i = 0; i < 3; i += 1) {
      const y = h * (0.3 + i * 0.14);
      parts.push(stroke(w * 0.05, y, w * 0.95, y, { width: 1.6, opacity: 0.22 }));
      parts.push(plate(w * 0.1, y - 5, w * 0.8, 5, { color: GOLD_LIGHT, opacity: 0.16, radius: 3 }));
    }
    parts.push(stroke(0, h * 0.86, w, h * 0.86, { width: 2, opacity: 0.35 }));
    parts.push(plate(0, h * 0.86, w, h * 0.14, { color: '#FFFFFF', opacity: 0.02 }));
    return parts.join('');
  },

  finishing(w, h, rand) {
    const parts = [];
    parts.push(plate(0, 0, w * 0.55, h, { color: '#FFFFFF', opacity: 0.025 }));
    parts.push(stroke(w * 0.55, 0, w * 0.55, h, { width: 2.6, opacity: 0.45 }));
    parts.push(stroke(w * 0.55, 0, w * 0.98, h * 0.16, { width: 2, opacity: 0.25 }));
    parts.push(stroke(w * 0.1, h * 0.2, w * 0.5, h * 0.28, { color: GOLD_LIGHT, width: 3, opacity: 0.4 }));
    parts.push(stroke(w * 0.12, h * 0.72, w * 0.52, h * 0.8, { width: 2, opacity: 0.3 }));
    for (let i = 0; i < 4; i += 1) {
      parts.push(dot(w * (0.2 + i * 0.08), h * (0.52 + i * 0.02), 2.4, { opacity: 0.45 }));
    }
    parts.push(box(w * 0.66, h * 0.5, w * 0.24, h * 0.3, { opacity: 0.28, radius: 8 }));
    return parts.join('');
  },

  consultation(w, h, rand) {
    const parts = [];
    parts.push(box(w * 0.12, h * 0.14, w * 0.5, h * 0.62, { opacity: 0.35, radius: 6 }));
    parts.push(stroke(w * 0.18, h * 0.3, w * 0.56, h * 0.3, { width: 1.6, opacity: 0.25 }));
    parts.push(stroke(w * 0.18, h * 0.44, w * 0.44, h * 0.44, { width: 1.6, opacity: 0.25 }));
    parts.push(stroke(w * 0.18, h * 0.58, w * 0.5, h * 0.58, { width: 1.6, opacity: 0.25 }));
    parts.push(stroke(w * 0.18, h * 0.22, w * 0.18, h * 0.68, { width: 1.6, opacity: 0.25 }));
    for (let i = 0; i < 3; i += 1) {
      parts.push(plate(w * (0.68 + (i % 2) * 0.14), h * (0.22 + Math.floor(i / 2) * 0.22), w * 0.12, h * 0.16, {
        color: i === 1 ? GOLD_LIGHT : GOLD,
        opacity: 0.24,
        radius: 4,
      }));
    }
    parts.push(circle(w * 0.78, h * 0.74, 26, { opacity: 0.3 }));
    parts.push(stroke(w * 0.78, h * 0.74, w * 0.86, h * 0.62, { width: 2, opacity: 0.4 }));
    return parts.join('');
  },
};

function wrap({ w, h, scene, seed }) {
  const rand = makeRandom(seed);
  const draw = SCENES[scene] ?? SCENES.ceiling_linear;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">
<defs>
  <radialGradient id="glow" cx="30%" cy="18%" r="78%">
    <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.20"/>
    <stop offset="55%" stop-color="${GOLD}" stop-opacity="0.04"/>
    <stop offset="100%" stop-color="${BLACK}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="vignette" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${BLACK_DEEP}" stop-opacity="0.25"/>
    <stop offset="100%" stop-color="${BLACK}" stop-opacity="0.9"/>
  </linearGradient>
</defs>
<rect width="${w}" height="${h}" fill="${BLACK_DEEP}"/>
<rect width="${w}" height="${h}" fill="url(#vignette)" opacity="0.7"/>
${grid(w, h, Math.round(Math.min(w, h) / 14), 0.045)}
${draw(w, h, rand)}
<rect width="${w}" height="${h}" fill="url(#glow)"/>
<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" fill="none" stroke="${GRAY_DARK}" stroke-width="1"/>
</svg>
`;
}

function brandMark(size, { withText = false } = {}) {
  const r = size * 0.16;
  const cx = size * 0.5;
  const cy = size * 0.5;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${withText ? size * 4 : size} ${size}" width="${withText ? size * 4 : size}" height="${size}" role="img">
<rect width="${withText ? size * 4 : size}" height="${size}" fill="${BLACK}" rx="${size * 0.12}"/>
<g fill="none" stroke="${GOLD}" stroke-width="${size * 0.055}" stroke-linecap="round">
  <path d="M ${size * 0.18} ${size * 0.68} L ${size * 0.5} ${size * 0.26} L ${size * 0.82} ${size * 0.68}"/>
  <path d="M ${size * 0.28} ${size * 0.68} L ${size * 0.5} ${size * 0.38} L ${size * 0.72} ${size * 0.68}"/>
  <path d="M ${size * 0.14} ${size * 0.8} L ${size * 0.86} ${size * 0.8}"/>
  <path d="M ${size * 0.34} ${size * 0.8} L ${size * 0.34} ${size * 0.68}"/>
  <path d="M ${size * 0.66} ${size * 0.8} L ${size * 0.66} ${size * 0.68}"/>
</g>
<circle cx="${cx}" cy="${cy - size * 0.02}" r="${r * 0.16}" fill="${GOLD_LIGHT}"/>
${
  withText
    ? `<text x="${size * 1.15}" y="${size * 0.46}" fill="#FFFFFF" font-family="sans-serif" font-size="${size * 0.3}" font-weight="700">KNAUF KARAJ</text>
<text x="${size * 1.15}" y="${size * 0.74}" fill="${GOLD}" font-family="sans-serif" font-size="${size * 0.17}" letter-spacing="3">CEILING &amp; DRYWALL</text>`
    : ''
}
</svg>
`;
}

function write(relative, content) {
  const full = path.join(OUT_DIR, relative);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  return full;
}

let count = 0;

write('placeholder.svg', wrap({ w: 1200, h: 900, scene: 'ceiling_linear', seed: 'placeholder' }));
count += 1;

write('brand/logo.svg', brandMark(160));
write('brand/logo-wide.svg', brandMark(120, { withText: true }));
write('brand/favicon.svg', brandMark(64));
count += 3;

for (const [name, scene, w, h] of [
  ['sections/hero-ceiling-linear.svg', 'ceiling_linear', 1600, 900],
  ['sections/about-ceiling-cove.svg', 'ceiling_cove', 1200, 900],
  ['sections/about-drywall-detail.svg', 'drywall', 900, 900],
  ['sections/cta-professional-installation.svg', 'finishing', 1600, 800],
]) {
  write(name, wrap({ w, h, scene, seed: name }));
  count += 1;
}

for (const category of categories) {
  write(`categories/${category.slug}.svg`, wrap({ w: 1200, h: 900, scene: category.scene, seed: category.slug }));
  count += 1;
}

for (const product of products) {
  write(`products/${product.slug}.svg`, wrap({ w: 1200, h: 900, scene: product.scene, seed: product.slug }));
  count += 1;
}

for (const service of services) {
  write(`services/${service.slug}.svg`, wrap({ w: 1200, h: 900, scene: service.scene, seed: service.slug }));
  count += 1;
}

for (const item of portfolio) {
  write(`portfolio/${item.slug}.svg`, wrap({ w: 1200, h: 800, scene: item.scene, seed: item.slug }));
  count += 1;
}

console.log(`[images] wrote ${count} placeholder images to ${path.relative(process.cwd(), OUT_DIR)}`);

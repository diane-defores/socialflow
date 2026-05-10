import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const outputs = [
  ["src/assets/logo.png", 800],
  ["src-tauri/icons/icon.png", 512],
  ["src-tauri/icons/128x128.png", 128],
  ["src-tauri/icons/128x128@2x.png", 256],
  ["src-tauri/icons/64x64.png", 64],
  ["src-tauri/icons/32x32.png", 32],
  ["src-tauri/icons/Square30x30Logo.png", 30],
  ["src-tauri/icons/Square44x44Logo.png", 44],
  ["src-tauri/icons/Square71x71Logo.png", 71],
  ["src-tauri/icons/Square89x89Logo.png", 89],
  ["src-tauri/icons/Square107x107Logo.png", 107],
  ["src-tauri/icons/Square142x142Logo.png", 142],
  ["src-tauri/icons/Square150x150Logo.png", 150],
  ["src-tauri/icons/Square284x284Logo.png", 284],
  ["src-tauri/icons/Square310x310Logo.png", 310],
  ["src-tauri/icons/StoreLogo.png", 50],
  ["src-tauri/icons/android/mipmap-mdpi/ic_launcher.png", 48],
  ["src-tauri/icons/android/mipmap-mdpi/ic_launcher_round.png", 48],
  ["src-tauri/icons/android/mipmap-mdpi/ic_launcher_foreground.png", 48],
  ["src-tauri/icons/android/mipmap-hdpi/ic_launcher.png", 72],
  ["src-tauri/icons/android/mipmap-hdpi/ic_launcher_round.png", 72],
  ["src-tauri/icons/android/mipmap-hdpi/ic_launcher_foreground.png", 72],
  ["src-tauri/icons/android/mipmap-xhdpi/ic_launcher.png", 96],
  ["src-tauri/icons/android/mipmap-xhdpi/ic_launcher_round.png", 96],
  ["src-tauri/icons/android/mipmap-xhdpi/ic_launcher_foreground.png", 96],
  ["src-tauri/icons/android/mipmap-xxhdpi/ic_launcher.png", 144],
  ["src-tauri/icons/android/mipmap-xxhdpi/ic_launcher_round.png", 144],
  ["src-tauri/icons/android/mipmap-xxhdpi/ic_launcher_foreground.png", 144],
  ["src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher.png", 192],
  ["src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher_round.png", 192],
  ["src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher_foreground.png", 192],
  ["src-tauri/icons/ios/AppIcon-20x20@1x.png", 20],
  ["src-tauri/icons/ios/AppIcon-20x20@2x.png", 40],
  ["src-tauri/icons/ios/AppIcon-20x20@2x-1.png", 40],
  ["src-tauri/icons/ios/AppIcon-20x20@3x.png", 60],
  ["src-tauri/icons/ios/AppIcon-29x29@1x.png", 29],
  ["src-tauri/icons/ios/AppIcon-29x29@2x.png", 58],
  ["src-tauri/icons/ios/AppIcon-29x29@2x-1.png", 58],
  ["src-tauri/icons/ios/AppIcon-29x29@3x.png", 87],
  ["src-tauri/icons/ios/AppIcon-40x40@1x.png", 40],
  ["src-tauri/icons/ios/AppIcon-40x40@2x.png", 80],
  ["src-tauri/icons/ios/AppIcon-40x40@2x-1.png", 80],
  ["src-tauri/icons/ios/AppIcon-40x40@3x.png", 120],
  ["src-tauri/icons/ios/AppIcon-60x60@2x.png", 120],
  ["src-tauri/icons/ios/AppIcon-60x60@3x.png", 180],
  ["src-tauri/icons/ios/AppIcon-76x76@1x.png", 76],
  ["src-tauri/icons/ios/AppIcon-76x76@2x.png", 152],
  ["src-tauri/icons/ios/AppIcon-83.5x83.5@2x.png", 167],
  ["src-tauri/icons/ios/AppIcon-512@2x.png", 1024],
];

const S = 4;

function rgba(hex, alpha = 255) {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
    alpha,
  ];
}

function mix(a, b, t) {
  return a.map((channel, index) => Math.round(channel + (b[index] - channel) * t));
}

function put(pixels, width, x, y, color) {
  if (x < 0 || y < 0 || x >= width || y >= width) return;
  const offset = (y * width + x) * 4;
  pixels[offset] = color[0];
  pixels[offset + 1] = color[1];
  pixels[offset + 2] = color[2];
  pixels[offset + 3] = color[3];
}

function roundedRect(pixels, width, x, y, w, h, r, color) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.ceil(x + w);
  const y1 = Math.ceil(y + h);
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const cx = Math.max(x + r, Math.min(px + 0.5, x + w - r));
      const cy = Math.max(y + r, Math.min(py + 0.5, y + h - r));
      if ((px + 0.5 - cx) ** 2 + (py + 0.5 - cy) ** 2 <= r ** 2) put(pixels, width, px, py, color);
    }
  }
}

function circle(pixels, width, cx, cy, r, color) {
  const x0 = Math.floor(cx - r);
  const y0 = Math.floor(cy - r);
  const x1 = Math.ceil(cx + r);
  const y1 = Math.ceil(cy + r);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r ** 2) put(pixels, width, x, y, color);
    }
  }
}

function line(pixels, width, ax, ay, bx, by, stroke, color) {
  const minX = Math.floor(Math.min(ax, bx) - stroke);
  const minY = Math.floor(Math.min(ay, by) - stroke);
  const maxX = Math.ceil(Math.max(ax, bx) + stroke);
  const maxY = Math.ceil(Math.max(ay, by) + stroke);
  const vx = bx - ax;
  const vy = by - ay;
  const len = vx * vx + vy * vy;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const t = Math.max(0, Math.min(1, ((x + 0.5 - ax) * vx + (y + 0.5 - ay) * vy) / len));
      const px = ax + vx * t;
      const py = ay + vy * t;
      if ((x + 0.5 - px) ** 2 + (y + 0.5 - py) ** 2 <= (stroke / 2) ** 2) put(pixels, width, x, y, color);
    }
  }
}

function makePng(size) {
  const width = size * S;
  const pixels = Buffer.alloc(width * width * 4);
  const bg1 = rgba("#13231f");
  const bg2 = rgba("#203a44");
  const teal = rgba("#36d6b5");
  const aqua = rgba("#78f0dd");
  const blue = rgba("#4e8cf8");
  const ink = rgba("#071513");
  const white = rgba("#f4fff9");

  for (let y = 0; y < width; y++) {
    for (let x = 0; x < width; x++) {
      const t = (x * 0.65 + y * 0.35) / (width - 1);
      put(pixels, width, x, y, mix(bg1, bg2, t));
    }
  }

  const unit = width / 1024;
  roundedRect(pixels, width, 82 * unit, 82 * unit, 860 * unit, 860 * unit, 220 * unit, rgba("#0b1715", 112));
  roundedRect(pixels, width, 112 * unit, 112 * unit, 800 * unit, 800 * unit, 196 * unit, rgba("#16332e"));

  line(pixels, width, 322 * unit, 316 * unit, 642 * unit, 316 * unit, 74 * unit, rgba("#1f4f54"));
  line(pixels, width, 642 * unit, 316 * unit, 752 * unit, 514 * unit, 74 * unit, rgba("#1f4f54"));
  line(pixels, width, 322 * unit, 708 * unit, 642 * unit, 708 * unit, 74 * unit, rgba("#1f4f54"));
  line(pixels, width, 642 * unit, 708 * unit, 752 * unit, 514 * unit, 74 * unit, rgba("#1f4f54"));

  line(pixels, width, 304 * unit, 308 * unit, 628 * unit, 308 * unit, 46 * unit, teal);
  line(pixels, width, 628 * unit, 308 * unit, 730 * unit, 512 * unit, 46 * unit, aqua);
  line(pixels, width, 304 * unit, 716 * unit, 628 * unit, 716 * unit, 46 * unit, blue);
  line(pixels, width, 628 * unit, 716 * unit, 730 * unit, 512 * unit, 46 * unit, aqua);

  circle(pixels, width, 296 * unit, 308 * unit, 98 * unit, ink);
  circle(pixels, width, 296 * unit, 308 * unit, 62 * unit, teal);
  circle(pixels, width, 296 * unit, 308 * unit, 25 * unit, white);

  circle(pixels, width, 296 * unit, 716 * unit, 98 * unit, ink);
  circle(pixels, width, 296 * unit, 716 * unit, 62 * unit, blue);
  circle(pixels, width, 296 * unit, 716 * unit, 25 * unit, white);

  circle(pixels, width, 744 * unit, 512 * unit, 130 * unit, ink);
  circle(pixels, width, 744 * unit, 512 * unit, 88 * unit, aqua);
  circle(pixels, width, 744 * unit, 512 * unit, 34 * unit, white);

  roundedRect(pixels, width, 404 * unit, 466 * unit, 246 * unit, 92 * unit, 46 * unit, rgba("#ecfff7"));
  roundedRect(pixels, width, 438 * unit, 491 * unit, 178 * unit, 42 * unit, 21 * unit, rgba("#16332e"));

  const downsampled = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const sum = [0, 0, 0, 0];
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const offset = ((y * S + sy) * width + (x * S + sx)) * 4;
          sum[0] += pixels[offset];
          sum[1] += pixels[offset + 1];
          sum[2] += pixels[offset + 2];
          sum[3] += pixels[offset + 3];
        }
      }
      const out = (y * size + x) * 4;
      downsampled[out] = Math.round(sum[0] / (S * S));
      downsampled[out + 1] = Math.round(sum[1] / (S * S));
      downsampled[out + 2] = Math.round(sum[2] / (S * S));
      downsampled[out + 3] = Math.round(sum[3] / (S * S));
    }
  }

  return encodePng(size, size, downsampled);
}

function crc32(buffer) {
  let crc = -1;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  const crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(width, height, rgbaData) {
  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const sourceOffset = y * width * 4;
    const targetOffset = y * (width * 4 + 1);
    scanlines[targetOffset] = 0;
    rgbaData.copy(scanlines, targetOffset + 1, sourceOffset, sourceOffset + width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(scanlines, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const [path, size] of outputs) {
  writeFileSync(path, makePng(size));
}

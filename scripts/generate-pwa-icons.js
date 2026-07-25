import { Jimp } from "jimp";
import path from "path";
import fs from "fs";

async function createIcon(size, filename) {
  // Create solid dark slate background #0f172a
  const image = new Jimp({ width: size, height: size, color: 0x0f172aff });

  // Draw an inner rounded container / accent #6366f1 (indigo-500)
  const margin = Math.floor(size * 0.15);
  const innerSize = size - margin * 2;

  for (let x = margin; x < size - margin; x++) {
    for (let y = margin; y < size - margin; y++) {
      // Simple inner card with subtle padding
      const dx = x - size / 2;
      const dy = y - size / 2;
      if (Math.hypot(dx, dy) < size * 0.38) {
        image.setPixelColor(0x4f46e5ff, x, y); // Indigo background circle
      }
      if (Math.hypot(dx, dy) < size * 0.26) {
        image.setPixelColor(0x818cf8ff, x, y); // Lighter accent
      }
      if (Math.hypot(dx, dy) < size * 0.14) {
        image.setPixelColor(0xffffffff, x, y); // Center white core
      }
    }
  }

  const outPath = path.join(process.cwd(), "public", filename);
  await image.write(outPath);
  console.log(`Generated ${filename} (${size}x${size})`);
}

async function main() {
  await createIcon(192, "icon-192.png");
  await createIcon(512, "icon-512.png");
  await createIcon(180, "apple-touch-icon.png");
}

main().catch(console.error);

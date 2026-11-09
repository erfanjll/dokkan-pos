import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// محاسبه CRC32 برای چانک‌های PNG
function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const body = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(body);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, body, crcBuf]);
}

function createPng(size, filename) {
  // پس‌زمینه رنگ #0f172a (15, 23, 42)
  // نماد: کادر گرد زمردی با نماد کیف پول / نمودار مالی در مرکز
  const width = size;
  const height = size;
  const rawScanlines = [];

  const center = size / 2;
  const radius = size * 0.44; // کادر بیرونی گرد
  const innerRadius = size * 0.38;

  for (let y = 0; y < height; y++) {
    rawScanlines.push(0); // Filter byte: 0 (None)
    for (let x = 0; x < width; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // پس‌زمینه کلی تیره: #0f172a
      let r = 15;
      let g = 23;
      let b = 42;
      let a = 255;

      // حلقه بیرونی درخشان زمردی
      if (dist <= radius && dist >= innerRadius) {
        // حاشیه گرد شیب ملایم
        r = 16;
        g = 185;
        b = 129; // emerald-500
      } else if (dist < innerRadius) {
        // داخل کادر: رنگ تیره #1e293b با گرادیانت ملایم
        r = 30;
        g = 41;
        b = 59;

        // طراحی نماد فروشگاه / کیف پول / اسکناس در مرکز
        const nx = (x - center) / innerRadius; // -1 to 1
        const ny = (y - center) / innerRadius; // -1 to 1

        // سقف فروشگاه (مثلث یا طاق)
        const inRoof = ny >= -0.65 && ny <= -0.2 && Math.abs(nx) <= (0.65 - (ny + 0.65) * 0.4);
        // ستون‌ها و بدنه
        const inStoreBody = ny >= -0.2 && ny <= 0.45 && Math.abs(nx) <= 0.52;
        // درب میانی یا کارت اعتباری
        const inDoor = ny >= 0.05 && ny <= 0.45 && Math.abs(nx) <= 0.2;
        // نماد سکه / چک در مرکز
        const distFromUpperCenter = Math.sqrt(nx * nx + (ny + 0.05) * (ny + 0.05));
        const inCenterCoin = distFromUpperCenter <= 0.16;

        if (inRoof) {
          r = 5;
          g = 150;
          b = 105; // emerald-600
        } else if (inDoor) {
          r = 16;
          g = 185;
          b = 129; // emerald-500
        } else if (inCenterCoin) {
          r = 52;
          g = 211;
          b = 153; // emerald-400
        } else if (inStoreBody) {
          // ستون‌ها
          if (Math.abs(nx) >= 0.12 && Math.abs(nx) <= 0.22) {
            r = 15;
            g = 23;
            b = 42;
          } else {
            r = 16;
            g = 185;
            b = 129;
          }
        }
      }

      rawScanlines.push(r, g, b, a);
    }
  }

  const scanlinesBuf = Buffer.from(rawScanlines);
  const compressed = zlib.deflateSync(scanlinesBuf, { level: 9 });

  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  const pngBuffer = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
  fs.writeFileSync(filename, pngBuffer);
  console.log(`[PNG Generated] ${filename} (${width}x${height}, ${pngBuffer.length} bytes)`);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

createPng(192, path.join(publicDir, 'icon-192.png'));
createPng(512, path.join(publicDir, 'icon-512.png'));


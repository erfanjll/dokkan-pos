import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

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

function createScreenshot(width, height, filename) {
  const rawScanlines = [];

  for (let y = 0; y < height; y++) {
    rawScanlines.push(0); // Filter byte: None
    const isTopHeader = y < Math.round(height * 0.12);
    const isNav = y >= Math.round(height * 0.12) && y < Math.round(height * 0.20);
    const isCard = y > Math.round(height * 0.25) && y < Math.round(height * 0.85);

    for (let x = 0; x < width; x++) {
      if (isTopHeader) {
        // Slate-900 with emerald accent (#0f172a)
        rawScanlines.push(15, 23, 42);
      } else if (isNav) {
        // Slate-800 (#1e293b)
        rawScanlines.push(30, 41, 59);
      } else if (isCard && x > Math.round(width * 0.08) && x < Math.round(width * 0.92)) {
        // Card content (#1e293b)
        rawScanlines.push(30, 41, 59);
      } else {
        // Dark background (#0f172a)
        rawScanlines.push(15, 23, 42);
      }
    }
  }

  const rawBuffer = Buffer.from(rawScanlines);
  const compressed = zlib.deflateSync(rawBuffer, { level: 9 });

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);   // bit depth
  ihdrData.writeUInt8(2, 9);   // color type: RGB (2)
  ihdrData.writeUInt8(0, 10);  // compression
  ihdrData.writeUInt8(0, 11);  // filter
  ihdrData.writeUInt8(0, 12);  // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  const pngBuffer = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
  const outPath = path.resolve('public', filename);
  fs.writeFileSync(outPath, pngBuffer);
  console.log(`Saved ${filename} (${width}x${height}): ${pngBuffer.length} bytes`);
}

createScreenshot(540, 960, 'screenshot-mobile.png');
createScreenshot(1280, 720, 'screenshot-desktop.png');

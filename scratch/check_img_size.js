const fs = require('fs');
const path = require('path');

const imgPath = 'C:/Users/ramya/.gemini/antigravity/brain/f204b27a-daa4-43da-a7cc-b5acbb9fe60c/.user_uploaded/media_1795025822966_34a9afbc.jpg';

// Simple JPEG dimension reader
function getJpegSize(filePath) {
  const buf = fs.readFileSync(filePath);
  let i = 0;
  if (buf[0] !== 0xFF || buf[1] !== 0xD8) return null;
  i += 2;
  while (i < buf.length) {
    if (buf[i] !== 0xFF) break;
    const marker = buf[i + 1];
    if (marker === 0xC0 || marker === 0xC2) {
      const h = buf.readUInt16BE(i + 5);
      const w = buf.readUInt16BE(i + 7);
      return { width: w, height: h };
    }
    const len = buf.readUInt16BE(i + 2);
    i += 2 + len;
  }
  return null;
}

console.log('Image dimensions:', getJpegSize(imgPath));

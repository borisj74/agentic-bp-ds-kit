/**
 * Just enough PNG to compare two screenshots, with no dependency.
 *
 * readPng(buffer)      — { width, height, pixels } as RGBA bytes
 * signature(png, grid) — the average colour of each cell of a grid over the image
 * compare(a, b)        — how far two signatures are apart: { cells, worst, average, same }
 *
 * The signature is what the visual snapshot test compares: a screenshot that drifts in a way a person
 * would see moves the average colour of a cell, while a one-pixel difference in a font hint does not.
 */
import { inflateSync } from "node:zlib";

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Read a PNG into straight RGBA bytes. Handles the 8-bit truecolour images a browser writes. */
export function readPng(buffer) {
  if (!buffer.subarray(0, 8).equals(SIGNATURE)) throw new Error("Not a PNG.");
  let offset = 8;
  let header = null;
  const data = [];
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const body = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      header = {
        width: body.readUInt32BE(0),
        height: body.readUInt32BE(4),
        depth: body[8],
        colorType: body[9],
        interlace: body[12],
      };
    } else if (type === "IDAT") data.push(body);
    else if (type === "IEND") break;
    offset += 12 + length;
  }
  if (!header) throw new Error("This PNG has no header.");
  if (header.depth !== 8 || header.interlace !== 0 || ![2, 6].includes(header.colorType))
    throw new Error(`Unsupported PNG: depth ${header.depth}, colour type ${header.colorType}.`);

  const channels = header.colorType === 6 ? 4 : 3;
  const stride = header.width * channels;
  const raw = inflateSync(Buffer.concat(data));
  const pixels = Buffer.alloc(header.width * header.height * 4);

  let previous = Buffer.alloc(stride);
  for (let y = 0; y < header.height; y += 1) {
    const start = y * (stride + 1);
    const filter = raw[start];
    const line = Buffer.from(raw.subarray(start + 1, start + 1 + stride));
    for (let i = 0; i < stride; i += 1) {
      const left = i >= channels ? line[i - channels] : 0;
      const up = previous[i];
      const upLeft = i >= channels ? previous[i - channels] : 0;
      if (filter === 1) line[i] = (line[i] + left) & 0xff;
      else if (filter === 2) line[i] = (line[i] + up) & 0xff;
      else if (filter === 3) line[i] = (line[i] + ((left + up) >> 1)) & 0xff;
      else if (filter === 4) line[i] = (line[i] + paeth(left, up, upLeft)) & 0xff;
    }
    for (let x = 0; x < header.width; x += 1) {
      const from = x * channels;
      const to = (y * header.width + x) * 4;
      pixels[to] = line[from];
      pixels[to + 1] = line[from + 1];
      pixels[to + 2] = line[from + 2];
      pixels[to + 3] = channels === 4 ? line[from + 3] : 255;
    }
    previous = line;
  }
  return { width: header.width, height: header.height, pixels };
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

/** Only the first bytes of a PNG, to read its size without decoding it. */
export function pngSize(buffer) {
  if (!buffer.subarray(0, 8).equals(SIGNATURE)) throw new Error("Not a PNG.");
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

/** The average colour of each cell of a grid over the image, row by row. */
export function signature(png, grid = 16) {
  const out = [];
  for (let gy = 0; gy < grid; gy += 1) {
    for (let gx = 0; gx < grid; gx += 1) {
      const x0 = Math.floor((gx * png.width) / grid);
      const x1 = Math.max(x0 + 1, Math.floor(((gx + 1) * png.width) / grid));
      const y0 = Math.floor((gy * png.height) / grid);
      const y1 = Math.max(y0 + 1, Math.floor(((gy + 1) * png.height) / grid));
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) {
          const at = (y * png.width + x) * 4;
          r += png.pixels[at];
          g += png.pixels[at + 1];
          b += png.pixels[at + 2];
          n += 1;
        }
      }
      out.push([Math.round(r / n), Math.round(g / n), Math.round(b / n)]);
    }
  }
  return out;
}

/** How far two signatures are apart, 0 to 255 per channel. */
export function compare(a, b, { tolerance = 12 } = {}) {
  if (a.length !== b.length) throw new Error("Two signatures of different sizes.");
  let worst = 0;
  let total = 0;
  let cells = 0;
  for (let i = 0; i < a.length; i += 1) {
    const distance = Math.max(Math.abs(a[i][0] - b[i][0]), Math.abs(a[i][1] - b[i][1]), Math.abs(a[i][2] - b[i][2]));
    total += distance;
    if (distance > worst) worst = distance;
    if (distance > tolerance) cells += 1;
  }
  return { cells, worst, average: Math.round((total / a.length) * 10) / 10, same: cells === 0 };
}

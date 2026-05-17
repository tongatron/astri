#!/usr/bin/env node
/**
 * Downloads the HYG Database (current release) and produces a compact JSON
 * catalog of stars with magnitude <= 6.0, the naked-eye visibility limit.
 *
 * Source: https://github.com/astronexus/HYG-Database (CC BY-SA 4.0).
 *
 * Output schema (public/stars-bright.json):
 *   [
 *     [raHours, decDeg, mag, colorIndex|null],
 *     ...
 *   ]
 *
 * Run from repo root: `node scripts/generate-stars.mjs`
 */
import { writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';

const SOURCE_URL =
  'https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v40.csv.gz';
const OUT_PATH = new URL('../public/stars-bright.json', import.meta.url);
const MAG_LIMIT = 6.0;

async function main() {
  console.log(`Fetching ${SOURCE_URL}…`);
  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }
  const gz = Buffer.from(await response.arrayBuffer());
  console.log(`Downloaded ${(gz.byteLength / 1024 / 1024).toFixed(1)} MB (gz), decompressing…`);
  const csv = gunzipSync(gz).toString('utf8');
  console.log(`Decompressed: ${(csv.length / 1024 / 1024).toFixed(1)} MB CSV`);

  const lines = csv.split('\n');
  const header = parseRow(lines.shift());
  const raIdx = header.indexOf('ra');
  const decIdx = header.indexOf('dec');
  const magIdx = header.indexOf('mag');
  const ciIdx = header.indexOf('ci');
  if (raIdx < 0 || decIdx < 0 || magIdx < 0) {
    throw new Error(`Unexpected CSV header: ${header.join(',')}`);
  }

  const out = [];
  for (const raw of lines) {
    if (!raw) continue;
    const cols = parseRow(raw);
    const ra = Number(cols[raIdx]);
    const dec = Number(cols[decIdx]);
    const mag = Number(cols[magIdx]);
    const ciStr = ciIdx >= 0 ? cols[ciIdx] : '';
    if (!Number.isFinite(ra) || !Number.isFinite(dec) || !Number.isFinite(mag)) continue;
    if (mag > MAG_LIMIT) continue;
    // Skip the Sun (id=0 entry in HYG).
    if (mag < -10) continue;
    const ci = ciStr === '' ? null : Number(ciStr);
    out.push([
      Number(ra.toFixed(5)),
      Number(dec.toFixed(4)),
      Number(mag.toFixed(2)),
      Number.isFinite(ci) ? Number(ci.toFixed(2)) : null,
    ]);
  }

  // Sort brightest first so the renderer can draw bright stars on top.
  out.sort((a, b) => a[2] - b[2]);

  const json = JSON.stringify(out);
  await writeFile(OUT_PATH, json);
  console.log(
    `Wrote ${out.length} stars (mag ≤ ${MAG_LIMIT}) to ${OUT_PATH.pathname} (${(json.length / 1024).toFixed(1)} KB)`,
  );
}

function parseRow(line) {
  // HYG CSV uses commas; only the "proper" name column may contain commas
  // but they are quoted. Implement a minimal CSV reader.
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

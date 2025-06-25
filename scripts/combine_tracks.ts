import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = 'data';
const OUT_DIR = 'data_processed';
const GPX_FILE = path.join(OUT_DIR, 'all_rides.gpx');
const KML_FILE = path.join(OUT_DIR, 'all_rides.kml');

function ensureDirSync(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getAllJsonFiles(dir: string): string[] {
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(dir, f));
}

function formatGermanDateTime(ms: string): string {
  const date = new Date(Number(ms));
  return date.toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Europe/Berlin',
  });
}

function extractTrackInfo(file: string): { coords: [number, number][], name: string } {
  const content = fs.readFileSync(file, 'utf-8');
  const json = JSON.parse(content);
  const coords: [number, number][][] = json.coordinates;
  if (!Array.isArray(coords)) return { coords: [], name: '' };
  const flatCoords = coords.flat().filter(
    (c): c is [number, number] => Array.isArray(c) && c.length === 2 && c[0] !== null && c[1] !== null
  );
  const title = json.title || path.basename(file);
  const start = json.start_time ? formatGermanDateTime(json.start_time) : '';
  const end = json.end_time ? formatGermanDateTime(json.end_time) : '';
  const name = `${title} (${start} - ${end})`;
  return { coords: flatCoords, name };
}

function toMultiTrackGPX(tracks: { coords: [number, number][], name: string }[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="ebike-connect-visualizer" xmlns="http://www.topografix.com/GPX/1/1">\n${tracks.map(track =>
    `  <trk>\n    <name>${track.name}</name>\n    <trkseg>\n${track.coords.map(([lat, lon]) => `      <trkpt lat=\"${lat}\" lon=\"${lon}\" />`).join('\n')}\n    </trkseg>\n  </trk>`
  ).join('\n')}\n</gpx>\n`;
}

function toKML(coords: [number, number][]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n  <Document>\n    <name>All Rides</name>\n    <Placemark>\n      <name>All Rides</name>\n      <LineString>\n        <coordinates>\n${coords.map(([lat, lon]) => `          ${lon},${lat},0`).join('\n')}\n        </coordinates>\n      </LineString>\n    </Placemark>\n  </Document>\n</kml>\n`;
}

function main() {
  ensureDirSync(OUT_DIR);
  const files = getAllJsonFiles(DATA_DIR);
  const tracks: { coords: [number, number][], name: string }[] = files.map(extractTrackInfo).filter(t => t.coords.length > 0);
  let allCoords: [number, number][] = [];
  for (const t of tracks) allCoords = allCoords.concat(t.coords);
  if (allCoords.length === 0) {
    console.error('No coordinates found.');
    process.exit(1);
  }
  fs.writeFileSync(GPX_FILE, toMultiTrackGPX(tracks));
  fs.writeFileSync(KML_FILE, toKML(allCoords));
  console.log(`Wrote ${allCoords.length} points to:\n  ${GPX_FILE}\n  ${KML_FILE}`);
}

main();
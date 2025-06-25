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

function extractCoordinates(file: string): [number, number][] {
  const content = fs.readFileSync(file, 'utf-8');
  const json = JSON.parse(content);
  const coords: [number, number][][] = json.coordinates;
  if (!Array.isArray(coords)) return [];
  // Flatten and filter nulls
  return coords.flat().filter(
    (c): c is [number, number] => Array.isArray(c) && c.length === 2 && c[0] !== null && c[1] !== null
  );
}

function toGPX(coords: [number, number][]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="ebike-connect-visualizer" xmlns="http://www.topografix.com/GPX/1/1">\n  <trk>\n    <name>All Rides</name>\n    <trkseg>\n${coords.map(([lat, lon]) => `      <trkpt lat=\"${lat}\" lon=\"${lon}\" />`).join('\n')}\n    </trkseg>\n  </trk>\n</gpx>\n`;
}

function toKML(coords: [number, number][]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n  <Document>\n    <name>All Rides</name>\n    <Placemark>\n      <name>All Rides</name>\n      <LineString>\n        <coordinates>\n${coords.map(([lat, lon]) => `          ${lon},${lat},0`).join('\n')}\n        </coordinates>\n      </LineString>\n    </Placemark>\n  </Document>\n</kml>\n`;
}

function main() {
  ensureDirSync(OUT_DIR);
  const files = getAllJsonFiles(DATA_DIR);
  let allCoords: [number, number][] = [];
  for (const file of files) {
    allCoords = allCoords.concat(extractCoordinates(file));
  }
  if (allCoords.length === 0) {
    console.error('No coordinates found.');
    process.exit(1);
  }
  fs.writeFileSync(GPX_FILE, toGPX(allCoords));
  fs.writeFileSync(KML_FILE, toKML(allCoords));
  console.log(`Wrote ${allCoords.length} points to:\n  ${GPX_FILE}\n  ${KML_FILE}`);
}

main();
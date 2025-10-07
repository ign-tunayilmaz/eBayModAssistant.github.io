const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function sanitizeFileName(name) {
  // Keep directories; remove query/hash parts and Windows-illegal chars
  const noQuery = name.split('?')[0].split('#')[0];
  return noQuery.replace(/[:*?"<>|]/g, '_');
}

function writeSourcesFromMap(mapPath, outRoot) {
  const mapRaw = fs.readFileSync(mapPath, 'utf8');
  let map;
  try {
    map = JSON.parse(mapRaw);
  } catch (e) {
    console.error(`Failed to parse JSON for ${mapPath}:`, e.message);
    process.exitCode = 1;
    return;
  }

  const sources = map.sources || [];
  const sourcesContent = map.sourcesContent || [];
  if (!sources.length || !sourcesContent.length) {
    console.error(`No embedded sources found in ${mapPath}.`);
    process.exitCode = 2;
    return;
  }

  sources.forEach((src, index) => {
    const content = sourcesContent[index];
    if (typeof content !== 'string') return;

    const sanitized = sanitizeFileName(src.startsWith('webpack:///') ? src.replace('webpack:///', '') : src);
    const outPath = path.join(outRoot, sanitized);
    ensureDir(path.dirname(outPath));
    fs.writeFileSync(outPath, content, 'utf8');
  });

  console.log(`Extracted ${sourcesContent.length} sources from ${path.basename(mapPath)} to ${outRoot}`);
}

function main() {
  const projectRoot = process.cwd();
  const outRoot = path.join(projectRoot, 'src-from-map');
  ensureDir(outRoot);

  const args = process.argv.slice(2);
  const maps = args.length ? args : [
    path.join(projectRoot, 'static', 'js', 'main.61519b61.js.map'),
    path.join(projectRoot, 'static', 'js', '453.f1b1a1d5.chunk.js.map'),
    path.join(projectRoot, 'build', 'static', 'js', 'main.61519b61.js.map'),
    path.join(projectRoot, 'build', 'static', 'js', '453.f1b1a1d5.chunk.js.map'),
  ];

  maps.forEach((mapPath) => {
    if (fs.existsSync(mapPath)) {
      writeSourcesFromMap(mapPath, outRoot);
    }
  });

  console.log('Done. Open the src-from-map folder for readable sources.');
}

main();



const esbuild = require('esbuild');
const path = require('path');

async function build() {
  await esbuild.build({
    entryPoints: [path.join(__dirname, 'src-from-map', 'index.js')],
    bundle: true,
    outfile: path.join(__dirname, 'app.js'),
    format: 'iife',
    platform: 'browser',
    define: { 'process.env.NODE_ENV': '"production"' },
    loader: { '.js': 'jsx', '.jsx': 'jsx' },
    jsx: 'automatic',
    sourcemap: false,
    minify: true,
  });
  console.log('Built app.js');
}

build().catch((e) => { console.error(e); process.exit(1); });



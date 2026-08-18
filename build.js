// ============================================================
// TruckPulse — Build Script
// Bundles all JS modules into standalone HTML files.
// Run: node build.js
// Output: dist/ folder with self-contained HTML files.
// ============================================================

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, 'dist');

// Clean dist
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
fs.mkdirSync(DIST, { recursive: true });

async function build() {
  console.log('🔨 Building TruckPulse...\n');

  // 1. Bundle the dashboard JS (main.js entry point)
  console.log('  📦 Bundling dashboard JS...');
  const dashboardResult = await esbuild.build({
    entryPoints: ['js/main.js'],
    bundle: true,
    format: 'iife',
    target: 'es2020',
    minify: false,
    sourcemap: false,
    write: false,
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  });
  const dashboardJS = dashboardResult.outputFiles[0].text;
  console.log(`     ✓ Dashboard JS: ${(dashboardJS.length / 1024).toFixed(1)}KB`);

  // 2. Bundle home page (already self-contained with inline styles/scripts)
  console.log('  📦 Building home page...');
  let homeHTML = fs.readFileSync('home.html', 'utf-8');
  fs.writeFileSync(path.join(DIST, 'home.html'), homeHTML);
  console.log('     ✓ home.html (self-contained)');

  // 3. Bundle login page (already self-contained)
  console.log('  📦 Building login page...');
  let loginHTML = fs.readFileSync('login.html', 'utf-8');
  fs.writeFileSync(path.join(DIST, 'login.html'), loginHTML);
  console.log('     ✓ login.html (self-contained)');

  // 4. Build dashboard HTML with bundled JS
  console.log('  📦 Building dashboard...');
  let dashHTML = fs.readFileSync('index.html', 'utf-8');

  // Replace the module script tag with the bundled inline script
  dashHTML = dashHTML.replace(
    /<script type="module" src="js\/main\.js"><\/script>/,
    `<script>\n${dashboardJS}\n</script>`
  );

  // Also inline the CSS to make it fully standalone
  const cssContent = fs.readFileSync('css/styles.css', 'utf-8');
  dashHTML = dashHTML.replace(
    '<link rel="stylesheet" href="css/styles.css" />',
    `<style>\n${cssContent}\n</style>`
  );

  fs.writeFileSync(path.join(DIST, 'index.html'), dashHTML);
  console.log(`     ✓ index.html (JS: ${(dashboardJS.length / 1024).toFixed(1)}KB)`);

  // 5. Summary
  const files = fs.readdirSync(DIST);
  const totalSize = files.reduce((acc, f) => acc + fs.statSync(path.join(DIST, f)).size, 0);

  console.log('\n' + '='.repeat(50));
  console.log('✅ Build complete!');
  console.log(`📁 Output: ${path.resolve(DIST)}`);
  console.log(`📄 Files: ${files.join(', ')}`);
  console.log(`📦 Total size: ${(totalSize / 1024).toFixed(1)}KB`);
  console.log('\n🚀 To run: just open dist/index.html in your browser!');
  console.log('   No server needed — everything is self-contained.\n');
}

build().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});

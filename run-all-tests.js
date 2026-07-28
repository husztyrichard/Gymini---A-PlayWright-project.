import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { cpSync, mkdirSync, existsSync, rmSync, readdirSync, statSync, copyFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function run(cmd, opts) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, opts.shell ? [] : [], {
      shell: true,
      cwd: opts.cwd || __dirname,
      stdio: 'inherit',
      env: { ...process.env, ...opts.env }
    });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with exit code ${code}: ${cmd}`));
    });
  });
}

console.log('\n=== Gymini: Running all tests ===\n');

let serverProc = null;

try {
  console.log('▶ Starting backend server...');
  serverProc = spawn('node', ['server.js'], {
    cwd: join(__dirname, 'backend'),
    stdio: 'ignore',
    detached: true
  });

  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log('▶ Running API tests (Newman)...\n');
  await run('npm test', { cwd: join(__dirname, 'backend') });

  console.log('\n▶ Running UI tests (Playwright)...\n');
  await run('npm test', { cwd: join(__dirname, 'frontend') });

} catch (err) {
  console.error('\n✗ Tests failed:', err.message);
} finally {
  if (serverProc) {
    serverProc.kill();
    console.log('\n▶ Backend server stopped.');
  }
}

await new Promise((resolve) => setTimeout(resolve, 2000));

const publicReports = join(__dirname, 'frontend', 'public', 'reports');
const srcReports = join(__dirname, 'reports');

function copyDirRecursive(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

console.log('\n▶ Copying reports to frontend/public/reports/...');
if (existsSync(publicReports)) rmSync(publicReports, { recursive: true });
mkdirSync(publicReports, { recursive: true });
copyDirRecursive(srcReports, publicReports);
console.log('  Reports copied.');

console.log('\n▶ Rebuilding frontend...');
execSync('npm run build', { cwd: join(__dirname, 'frontend'), stdio: 'inherit' });

console.log('\n✓ Done! Reports are in:');
console.log('  - frontend/public/reports/ (for local dev via Vite)');
console.log('  - frontend/dist/reports/ (deployed to Vercel)');
console.log('\n  Run "npm run dev" and open http://127.0.0.1:5173 to view reports.\n');

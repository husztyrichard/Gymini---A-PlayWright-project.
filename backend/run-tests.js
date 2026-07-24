import { execSync } from 'child_process';
import { setTimeout } from 'timers';

const PORT = 4000;
const BASE_URL = `http://localhost:${PORT}`;

console.log('Starting Gymini backend server...');

let serverProcess;
try {
  serverProcess = execSync(`node server.js`, {
    cwd: new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'),
    timeout: 3000,
    stdio: 'pipe'
  });
} catch (e) {
  // Server likely started in background, that's fine
}

// Wait for server to start
await new Promise(resolve => setTimeout(resolve, 2000));

console.log('\nRunning Newman tests...\n');

try {
  execSync(
    `npx newman run postman_collection.json --reporters cli`,
    {
      cwd: new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'),
      stdio: 'inherit'
    }
  );
  console.log('\n✅ All API tests passed!');
  process.exit(0);
} catch (e) {
  console.error('\n❌ Some API tests failed!');
  process.exit(1);
}

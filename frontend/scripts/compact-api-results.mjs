import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, '../..');
const srcJson = resolve(rootDir, 'reports/api-results.json');
const srcHtml = resolve(rootDir, 'reports/api-report.html');
const destJson = resolve(scriptDir, '../public/reports/api-results.json');
const destHtml = resolve(scriptDir, '../public/reports/api-report.html');

if (!existsSync(srcJson)) {
  console.error(`Source not found: ${srcJson}\nRun the API suite first:\n  cd backend && npm test`);
  process.exit(1);
}

const report = JSON.parse(readFileSync(srcJson, 'utf8'));
const run = report.run || {};

const stats = run.stats || {};
const assertions = stats.assertions || {};

const leanExecutions = (run.executions || []).map((ex) => ({
  id: ex.id ?? ex.cursor ?? undefined,
  assertions: (ex.assertions || []).map((a) => ({
    assertion: a.assertion,
    skipped: a.skipped || undefined,
    error: a.error ? { message: a.error.message, stack: a.error.stack, test: a.error.test, assertion: a.error.assertion } : undefined
  }))
}));

const lean = {
  run: {
    exec: run.exec?.count ?? run.executions?.length ?? undefined,
    stats: {
      assertions: {
        total: assertions.total ?? assertions.cursor ?? 0,
        pending: assertions.pending ?? 0,
        failed: assertions.failed ?? 0
      },
      requests: { total: run.stats?.requests?.total ?? 0, failed: run.stats?.requests?.failed ?? 0 },
      timings: run.timings ?? undefined
    },
    executions: leanExecutions,
    failures: run.failures ?? undefined
  }
};

mkdirSync(dirname(destJson), { recursive: true });
writeFileSync(destJson, JSON.stringify(lean, null, 2) + '\n');

if (existsSync(srcHtml)) {
  mkdirSync(dirname(destHtml), { recursive: true });
  copyFileSync(srcHtml, destHtml);
}

const total = lean.run.stats.assertions.total;
console.log(`Wrote ${destJson}`);
console.log(`  requests: ${lean.run.stats.requests.total}, assertions: ${total}, failed: ${lean.run.stats.assertions.failed}`);
console.log(existsSync(srcHtml) ? `Copied ${srcHtml} -> ${destHtml}` : `HTML report not found (skipped): ${srcHtml}`);
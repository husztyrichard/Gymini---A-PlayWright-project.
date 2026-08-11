import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, '../..');
const srcJson = resolve(rootDir, 'reports/ui-results.json');
const srcHtml = resolve(rootDir, 'reports/playwright-report/index.html');
const destJson = resolve(scriptDir, '../public/reports/ui-results.json');
const destHtml = resolve(scriptDir, '../public/reports/playwright-report/index.html');

function tidy(value) {
  if (Array.isArray(value)) {
    if (value.length === 0) return undefined;
    const cleaned = value.map(tidy).filter((v) => v !== undefined);
    return cleaned.length ? cleaned : undefined;
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value)) {
      const cleaned = tidy(value[key]);
      if (cleaned !== undefined) out[key] = cleaned;
    }
    return out;
  }
  return value;
}

function leanTest(test) {
  const lean = {
    projectName: test.projectName,
    expectedStatus: test.expectedStatus,
    status: test.status
  };
  if (Array.isArray(test.results)) {
    lean.results = test.results.map((r) => {
      const out = { status: r.status };
      if (typeof r.duration === 'number') out.duration = r.duration;
      if (typeof r.startTime === 'string') out.startTime = r.startTime;
      if (r.retry && r.retry > 0) out.retry = r.retry;
      if (Array.isArray(r.errors) && r.errors.length) out.errors = r.errors.map(tidy).filter((e) => e !== undefined);
      return out;
    });
  }
  return lean;
}

function groupSpecs(specs) {
  const groups = new Map();
  for (const spec of specs || []) {
    const key = `${spec.file || ''}::${spec.title || ''}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(spec);
  }
  return [...groups.values()].map((group) => {
    const first = group[0];
    const testKeys = new Set();
    const tests = [];
    for (const spec of group) {
      for (const test of spec.tests || []) {
        const testKey = (test.projectName || '') + '::' + ((test.results || []).map((r) => r.status).join(','));
        if (testKeys.has(testKey)) continue;
        testKeys.add(testKey);
        tests.push(leanTest(test));
      }
    }
    return {
      title: first.title,
      ok: group.every((spec) => spec.ok),
      tags: [...new Set(group.flatMap((spec) => spec.tags || []))],
      tests,
      id: first.id,
      file: first.file,
      line: first.line,
      column: first.column
    };
  });
}

function compactSuites(suites) {
  return (suites || []).map((suite) => {
    const next = {};
    for (const key of ['title', 'file', 'line', 'column']) {
      if (suite[key] !== undefined) next[key] = suite[key];
    }
    if (suite.specs && suite.specs.length) next.specs = groupSpecs(suite.specs);
    if (suite.suites && suite.suites.length) next.suites = compactSuites(suite.suites);
    return next;
  });
}

function summarize(suites) {
  const specs = [];
  function walk(list) {
    for (const suite of list || []) {
      for (const spec of suite.specs || []) specs.push(spec);
      walk(suite.suites);
    }
  }
  walk(suites);
  let testCount = 0;
  let unexpected = 0;
  const keys = new Set();
  const smoke = new Set();
  for (const spec of specs) {
    keys.add(`${spec.file || ''}::${spec.title || ''}`);
    if ((spec.tags || []).includes('smoke')) smoke.add(`${spec.file || ''}::${spec.title || ''}`);
    for (const test of spec.tests || []) {
      const passed = (test.results || []).some((r) => r.status === 'passed');
      const failed = (test.results || []).some((r) => ['failed', 'timedOut', 'interrupted'].includes(r.status));
      if (passed || failed) testCount++;
      if (!passed) unexpected++;
    }
  }
  return { specs: keys.size, smoke: smoke.size, testCount, unexpected };
}

if (!existsSync(srcJson)) {
  console.error(`Source not found: ${srcJson}\nRun the full UI suite first:\n  npm test\n(npx playwright test)`);
  process.exit(1);
}

const report = JSON.parse(readFileSync(srcJson, 'utf8'));
report.suites = compactSuites(report.suites);
report.config = tidy(report.config);
report.errors = tidy(report.errors || []);
report.stats = tidy(report.stats);

const summary = summarize(report.suites);
report.stats = {
  startTime: report.stats?.startTime || null,
  duration: report.stats?.duration || 0,
  expected: summary.testCount,
  skipped: 0,
  unexpected: summary.unexpected,
  flaky: 0
};
report.errors = report.errors || [];

mkdirSync(dirname(destJson), { recursive: true });
writeFileSync(destJson, JSON.stringify(report, null, 2) + '\n');

if (existsSync(srcHtml)) {
  mkdirSync(dirname(destHtml), { recursive: true });
  copyFileSync(srcHtml, destHtml);
}

console.log(`Wrote ${destJson}`);
console.log(`  grouped specs: ${summary.specs} (${summary.smoke} smoke)`);
console.log(`  test executions: ${summary.testCount}, unexpected: ${summary.unexpected}`);
console.log(existsSync(srcHtml)
  ? `Copied ${srcHtml} -> ${destHtml}`
  : `HTML report not found (skipped): ${srcHtml}`);
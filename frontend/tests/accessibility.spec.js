import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  {
    name: 'home',
    path: '/',
    ready: '.exerciseCard',
    knownRules: [
      {
        rule: 'select-name',
        reason: 'Exercise filter <select>s have no accessible label in the app. Tracked as accessibility debt - fixing requires an app change.'
      }
    ]
  },
  {
    name: 'about',
    path: '/about.html',
    ready: '.heroCopy',
    knownRules: []
  },
  {
    name: 'test-cases',
    path: '/test-cases.html',
    ready: '.tcTable',
    knownRules: [
      {
        rule: 'region',
        reason: 'Static test-case sections are not grouped inside labelled landmarks. Tracked as accessibility debt - fixing requires an app change.'
      }
    ]
  },
  {
    name: 'reports',
    path: '/reports.html',
    ready: '.heroCopy',
    knownRules: []
  }
];

for (const { name, path, ready, knownRules } of PAGES) {
  test(`has no unexpected accessibility violations - ${name}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForSelector(ready, { timeout: 15000 });

    const results = await new AxeBuilder({ page }).analyze();
    const knownIds = new Set(knownRules.map((k) => k.rule));
    const unexpected = results.violations.filter((v) => !knownIds.has(v.id));

    for (const v of results.violations) {
      const label = knownIds.has(v.id) ? 'KNOWN' : 'NEW';
      const nodes = v.nodes.map((n) => n.target.join(' ')).join(', ');
      console.log(`[${label}] ${v.id} (${v.impact}): ${v.help} @ ${nodes}`);
    }

    expect(
      unexpected,
      unexpected.length
        ? `Unexpected accessibility violations on ${name}: ${unexpected.map((v) => `${v.id} (${v.impact})`).join(', ')}`
        : 'no unexpected violations'
    ).toEqual([]);
  });
}

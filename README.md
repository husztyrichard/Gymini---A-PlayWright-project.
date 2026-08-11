# Gymini 💪

[![Playwright](https://img.shields.io/badge/tested%20with-Playwright-45ba4b?logo=playwright&logoColor=white)](https://playwright.dev)
[![CI - Gymini Tests](https://img.shields.io/github/actions/workflow/status/husztyrichard/Gymini---A-PlayWright-project./test.yml?label=CI&logo=github)](https://github.com/husztyrichard/Gymini---A-PlayWright-project./actions/workflows/test.yml)
[![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?logo=vercel&logoColor=white)](https://gymini-playwright.vercel.app/)

An AI-powered workout planner built with React and Node.js. Users enter their fitness profile, goals and available equipment, then receive a personalized weekly workout plan.

**This is a QA portfolio project** — the app exists to demonstrate end-to-end test automation across UI, API, accessibility and performance, wired into CI/CD with published reports.

## Live demo & reports

- 🚀 [Live demo](https://gymini-playwright.vercel.app/)
- 📋 [Test cases (what / why / how / expected)](https://gymini-playwright.vercel.app/test-cases.html)
- 📊 [UI test report (Playwright)](https://gymini-playwright.vercel.app/reports/playwright-report/index.html)
- 🔌 [API test report (Newman)](https://gymini-playwright.vercel.app/reports/api-report.html)

## Quality Assurance

Every test case on the [test cases page](https://gymini-playwright.vercel.app/test-cases.html) maps 1:1 to an automated test that actually runs. Coverage spans four layers:

| Layer | Tool | Coverage |
| --- | --- | --- |
| UI automation | Playwright | 36 test cases × Chromium, Firefox, Pixel 5 (mobile) = **108 executions, 0 failures** |
| API automation | Newman (Postman) | 8 requests / **32 assertions, 0 failures** |
| Accessibility | axe-core | Automated WCAG scans on all 4 pages |
| Performance & web quality | Lighthouse CI | Performance **100** · Accessibility **100** · Best practices **96** · SEO **100** |

### Highlights

- **Cross-browser + mobile**: every UI test runs headless on Chromium desktop, Firefox desktop, and a Pixel 5 mobile viewport.
- **Smoke vs regression**: tagged `@smoke` cases (9) run fast on every push to fail early; the full regression suite runs the complete set.
- **Negative testing**: API validation (missing fields, empty body) and UI interaction edge cases (modal close via X and backdrop click, removed-feature regression guard).
- **Accessibility debt tracking**: known, non-blocking WCAG findings are tracked explicitly in the a11y suite instead of ignored.
- **Enforced quality gates**: Lighthouse budgets are PR checks (performance ≥ 60, accessibility ≥ 90, best-practices ≥ 85, SEO ≥ 85).

### CI/CD

- **GitHub Actions** ([test.yml](.github/workflows/test.yml)) runs 4 jobs on every push/PR: API tests (Newman), smoke tests (Playwright), Lighthouse CI, and the full UI regression suite.
- **Jenkinsfile** included for Jenkins-based pipelines.

## Tech stack

| Area | Technology |
| --- | --- |
| Frontend | React + Vite, JavaScript |
| Backend | Node.js + Express |
| UI testing | Playwright |
| API testing | Newman (Postman collection) |
| Accessibility | @axe-core/playwright |
| Performance | Lighthouse CI |
| CI/CD | GitHub Actions, Jenkins |
| Hosting | Vercel |

## Running the tests locally

```bash
# Frontend UI suite (Playwright, all projects)
cd frontend && npm install && npx playwright install
npm test                    # full regression suite (108 executions)
npm run test:smoke          # smoke subset (9 cases)

# Lighthouse CI (builds the app first)
npm run lighthouse

# Regenerate committed UI report data
npm run reports:ui

# Backend API suite (Newman)
cd backend && npm install && npm start &
npm test
```

## Project structure

```
.
├── backend/          # Express API + Postman collection + Newman runner
├── frontend/
│   ├── src/          # React app
│   ├── tests/        # Playwright specs (landing, form, plan, exercises, a11y)
│   ├── public/       # Test cases / about / reports pages, report JSON
│   └── lighthouserc.cjs
├── reports/          # Generated report output (api + ui + lighthouse)
├── .github/workflows/test.yml
└── Jenkinsfile
```

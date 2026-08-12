# Gymini 💪

[![Playwright](https://img.shields.io/badge/tested%20with-Playwright-45ba4b?logo=playwright&logoColor=white)](https://playwright.dev)
[![CI - Gymini Tests](https://img.shields.io/github/actions/workflow/status/husztyrichard/Gymini---A-PlayWright-project./test.yml?label=CI&logo=github)](https://github.com/husztyrichard/Gymini---A-PlayWright-project./actions/workflows/test.yml)
[![Dependencies](https://img.shields.io/badge/dependencies-0%20vulnerabilities-brightgreen)](https://github.com/husztyrichard/Gymini---A-PlayWright-project./security)
[![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?logo=vercel&logoColor=white)](https://gymini-playwright.vercel.app/)

An AI-powered workout planner built with React and Node.js. Users enter their fitness profile, goals and available equipment, then receive a personalized weekly workout plan.

**This is a QA portfolio project** — the app exists to demonstrate end-to-end test automation across UI, API, accessibility, performance and dependency security, wired into CI/CD with published reports.

## Live demo & reports

- 🚀 [Live demo](https://gymini-playwright.vercel.app/)
- 📋 [Test cases (what / why / how / expected)](https://gymini-playwright.vercel.app/test-cases.html)
- 📊 [UI test report (Playwright)](https://gymini-playwright.vercel.app/reports/playwright-report/index.html)
- 🔌 [API test report (Newman)](https://gymini-playwright.vercel.app/reports/api-report.html)

## Quality Assurance

Every test case on the [test cases page](https://gymini-playwright.vercel.app/test-cases.html) maps 1:1 to an automated test that actually runs. Coverage spans five layers:

| Layer | Tool | Coverage |
| --- | --- | --- |
| UI automation | Playwright | 51 test cases × Chromium, Firefox, Pixel 5 (mobile) = **153 executions, 0 failures** |
| API automation | Newman (Postman) | 32 requests / **92 assertions, 0 failures** |
| Accessibility | axe-core | Automated WCAG scans on all 4 pages |
| Performance & web quality | Lighthouse CI | Performance **100** · Accessibility **100** · Best practices **96** · SEO **100** |
| Dependency security | npm audit | **0 vulnerabilities** in production deps (frontend + backend) |

### Highlights

- **Cross-browser + mobile**: every UI test runs headless on Chromium desktop, Firefox desktop, and a Pixel 5 mobile viewport.
- **Smoke vs regression**: tagged `@smoke` cases (12) run fast on every push to fail early; the full regression suite runs the complete set.
- **Negative testing & BVA**: API boundary-value analysis covers valid and invalid edges for age, height, weight, training days and enums, plus non-numeric input; UI tests cover native form validation (empty/out-of-range fields), no-results search states, and removed-feature regression guards.
- **Accessibility debt tracking**: known, non-blocking WCAG findings are tracked explicitly in the a11y suite instead of ignored.
- **Enforced quality gates**: Lighthouse budgets are PR checks (performance ≥ 60, accessibility ≥ 90, best-practices ≥ 85, SEO ≥ 85).
- **Dependency security**: `npm audit` runs in CI on every push/PR — production dependencies must stay at **0 known vulnerabilities** (frontend and backend). Remaining dev-time findings (Newman/Lighthouse tooling chains) are tracked and informational.

### CI/CD

- **GitHub Actions** ([test.yml](.github/workflows/test.yml)) runs 5 jobs on every push/PR: API tests (Newman), smoke tests (Playwright), Lighthouse CI, dependency security (npm audit), and the full UI regression suite.
- **Jenkins** pipeline is defined in Jenkinsfile and runs only the full Playwright UI regression suite on a Windows agent

## Tech stack

| Area | Technology |
| --- | --- |
| Frontend | React + Vite, JavaScript |
| Backend | Node.js + Express |
| UI testing | Playwright |
| API testing | Newman (Postman collection) |
| Accessibility | @axe-core/playwright |
| Performance | Lighthouse CI |
| Dependency security | npm audit (CI gate) |
| CI/CD | GitHub Actions, Jenkins |
| Hosting | Vercel |

## Running the tests locally

```bash
# Frontend UI suite (Playwright, all projects)
cd frontend && npm install && npx playwright install
npm test                    # full regression suite (153 executions)
npm run test:smoke          # smoke subset (12 cases)

# Lighthouse CI (builds the app first)
npm run lighthouse

# Regenerate committed UI report data
npm run reports:ui

# Dependency security audit
cd frontend && npm audit --omit=dev   # must report 0 vulnerabilities
cd backend && npm audit --omit=dev    # must report 0 vulnerabilities

# Backend API suite (Newman)
cd backend && npm install && npm start &
npm test
```

## Project structure

```
Gymini---A-PlayWright-project/
├── .github/
│   └── workflows/
│       └── test.yml
│
├── backend/
│   ├── package-lock.json
│   ├── package.json
│   ├── postman_collection.json
│   ├── run-tests.js
│   └── server.js
│
├── frontend/
│   ├── public/
│   │   ├── reports/
│   │   │   ├── playwright-report/
│   │   │   ├── api-report.html
│   │   │   ├── api-results.json
│   │   │   ├── lighthouse.json
│   │   │   └── ui-results.json
│   │   ├── resumes/
│   │   │   ├── Huszty_Richárdcv_hu.pdf
│   │   │   └── Richard_Husztycv_en.pdf
│   │   ├── about.html
│   │   ├── favicon.svg
│   │   ├── reports.html
│   │   ├── styles.css
│   │   └── test-cases.html
│   │
│   ├── scripts/
│   │   ├── compact-api-results.mjs
│   │   └── compact-ui-results.mjs
│   │
│   ├── src/
│   │   ├── App.jsx
│   │   └── styles.css
│   │
│   ├── tests/
│   │   ├── accessibility.spec.js
│   │   ├── dashboard.spec.js
│   │   ├── exercises.spec.js
│   │   ├── form.spec.js
│   │   ├── landing.spec.js
│   │   ├── negative.spec.js
│   │   └── plan.spec.js
│   │
│   ├── index.html
│   ├── lighthouserc.cjs
│   ├── package-lock.json
│   ├── package.json
│   ├── playwright.config.js
│   └── vite.config.js
│
├── resumes/
│   ├── Huszty_Richárdcv_hu.pdf
│   └── Richard_Husztycv_en.pdf
│
├── .gitignore
├── Jenkinsfile
├── README.md
├── package-lock.json
├── package.json
├── run-all-tests.js
├── validate.py
└── vercel.json
```



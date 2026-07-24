# Gymini

Gymini is an English AI workout planner MVP. Users enter body data, goals, experience and available equipment, then receive a structured weekly workout plan.

## Current version

This version uses **mock AI mode**. It does not require OpenAI or Gemini API keys yet. The backend returns realistic generated plan data from local JavaScript logic.

## Tech stack

- React + Vite frontend
- Node.js + Express backend
- JavaScript
- Dark gym / AI landing page design

## Run locally

Open a terminal in this folder:

```bash
npm run install:all
npm run dev
```

Then open:

```text
http://127.0.0.1:5173
```

Backend health check:

```text
http://localhost:4000/api/health
```

## MVP features

- English landing page
- Gymini branding
- Workout planner form
- Age, gender, height, weight, body fat, goal, experience, training days, session length, equipment and limitations
- Mock AI workout plan result
- Weekly split, exercises, sets/reps, rest, finisher, progression and safety notes

## Next steps

1. Add Playwright UI tests.
2. Add API tests for `/api/generate-plan`.
3. Add Gemini or OpenAI API integration behind the same endpoint.
4. Add PDF export or email capture for monetization.
5. Deploy frontend to Vercel and backend to Render.

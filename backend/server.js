import express from 'express';
import cors from 'cors';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPORTS_DIR = join(__dirname, '..', 'reports');
const RESULTS_FILE = join(REPORTS_DIR, 'last-results.json');

if (!existsSync(REPORTS_DIR)) mkdirSync(REPORTS_DIR, { recursive: true });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true }));
app.use(express.json());
app.use('/reports', express.static(REPORTS_DIR));
// Serve uploaded resumes from the repository `resumes/` folder
app.use('/resumes', express.static(join(__dirname, '..', 'resumes')));

const splitByDays = {
  2: ['Full Body Strength', 'Full Body Conditioning'],
  3: ['Upper Body', 'Lower Body', 'Full Body Conditioning'],
  4: ['Upper Strength', 'Lower Strength', 'Upper Hypertrophy', 'Lower Hypertrophy'],
  5: ['Push', 'Pull', 'Legs', 'Upper Accessories', 'Conditioning + Core'],
  6: ['Push', 'Pull', 'Legs', 'Push Volume', 'Pull Volume', 'Legs + Core']
};

function getExercises(equipment, goal) {
  const home = equipment === 'bodyweight' || equipment === 'dumbbells';
  if (home) {
    return ['Push-ups', 'Goblet squats', 'Dumbbell rows', 'Romanian deadlifts', 'Plank', 'Walking lunges'];
  }
  if (goal === 'strength') {
    return ['Barbell squat', 'Bench press', 'Deadlift', 'Overhead press', 'Pull-ups', 'Farmer carry'];
  }
  return ['Incline dumbbell press', 'Lat pulldown', 'Leg press', 'Romanian deadlift', 'Cable row', 'Hanging knee raise'];
}

function buildWorkoutPlan(profile) {
  const days = Math.min(Math.max(Number(profile.daysPerWeek) || 3, 2), 6);
  const split = splitByDays[days] || splitByDays[3];
  const exercises = getExercises(profile.equipment, profile.goal);
  const reps = profile.goal === 'strength' ? '4 sets x 4-6 reps' : profile.goal === 'fat-loss' ? '3 sets x 10-15 reps' : '3-4 sets x 8-12 reps';
  const rest = profile.goal === 'strength' ? '2-3 minutes' : '60-90 seconds';

  return {
    mode: 'mock-ai',
    headline: `${days}-day ${profile.goal?.replace('-', ' ') || 'fitness'} plan for ${profile.experience || 'beginner'} level`,
    summary: `Gymini created a practical weekly plan based on your goal, available equipment and training frequency. This is a mock AI response ready to be replaced with Gemini or OpenAI later.`,
    weeklyPlan: split.map((day, index) => ({
      day: `Day ${index + 1}`,
      focus: day,
      warmup: '5-8 minutes light cardio + dynamic mobility',
      exercises: exercises.slice(0, 5).map((name) => ({ name, prescription: reps, rest })),
      finisher: profile.goal === 'fat-loss' ? '10 minutes incline walk or bike intervals' : 'Optional 8 minutes core work'
    })),
    progression: 'If all sets feel controlled for two sessions, increase weight by 2.5-5% or add 1-2 reps per set.',
    safety: 'This is general fitness guidance, not medical advice. Stop if you feel pain and consult a professional for injuries.'
  };
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'Gymini API' });
});

app.post('/api/generate-plan', (req, res) => {
  const required = ['age', 'height', 'weight', 'goal', 'experience', 'daysPerWeek', 'equipment'];
  const missing = required.filter((field) => !req.body[field]);

  if (missing.length) {
    return res.status(400).json({ message: 'Missing required fields', missing });
  }

  res.json(buildWorkoutPlan(req.body));
});

app.post('/api/run-api-tests', (req, res) => {
  try {
    const output = execSync('npx newman run postman_collection.json --reporters cli,htmlextra,json --reporter-htmlextra-export ../reports/api-report.html --reporter-json-export ../reports/api-results.json', {
      cwd: join(__dirname),
      timeout: 30000,
      encoding: 'utf-8'
    });

    let results = { passed: 0, failed: 0, total: 0, assertions: [], runAt: new Date().toISOString() };
    const jsonPath = join(REPORTS_DIR, 'api-results.json');
    if (existsSync(jsonPath)) {
      const raw = JSON.parse(readFileSync(jsonPath, 'utf-8'));
      const run = raw.run || {};
      const stats = run.stats || {};
      results.passed = (stats.assertions?.cursor || 0) - (stats.assertions?.failed || 0);
      results.failed = stats.assertions?.failed || 0;
      results.total = stats.assertions?.cursor || 0;
      results.assertions = (run.executions || []).flatMap((ex) =>
        (ex.assertions || []).map((a) => ({
          name: a.assertion || '',
          passed: !a.error,
          error: a.error?.message || null
        }))
      );
    }

    writeFileSync(RESULTS_FILE, JSON.stringify({ api: results }, null, 2));
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/test-results', (req, res) => {
  if (existsSync(RESULTS_FILE)) {
    res.json(JSON.parse(readFileSync(RESULTS_FILE, 'utf-8')));
  } else {
    res.json({});
  }
});

app.listen(PORT, () => {
  console.log(`Gymini API running on http://localhost:${PORT}`);
});

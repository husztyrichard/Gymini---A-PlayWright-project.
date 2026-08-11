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

// Short, safe resume URLs (avoid special-character filenames in links)
app.get('/resumes/en', (req, res) => {
  const p = join(__dirname, '..', 'resumes', 'Richard_Husztycv_en.pdf');
  if (existsSync(p)) return res.sendFile(p);
  res.status(404).send('Resume not found');
});

app.get('/resumes/hu', (req, res) => {
  const p = join(__dirname, '..', 'resumes', 'Huszty_Richárdcv_hu.pdf');
  if (existsSync(p)) return res.sendFile(p);
  res.status(404).send('Resume not found');
});
const SPLIT_TEMPLATES = {
  2: ['Full Body', 'Full Body'],
  3: ['Upper Body', 'Lower Body', 'Full Body'],
  4: ['Chest & Triceps', 'Back & Biceps', 'Legs', 'Shoulders & Core'],
  5: ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms & Core'],
  6: ['Chest & Triceps', 'Back & Biceps', 'Legs', 'Chest & Shoulders', 'Back & Arms', 'Legs & Core']
};

const MUSCLE_SPLIT_MAP = {
  'Full Body': ['chest', 'back', 'quadriceps', 'hamstrings', 'shoulders'],
  'Upper Body': ['chest', 'shoulders', 'biceps', 'triceps', 'lats', 'middle back'],
  'Lower Body': ['quadriceps', 'hamstrings', 'glutes', 'calves'],
  'Chest & Triceps': ['chest', 'triceps'],
  'Back & Biceps': ['lats', 'middle back', 'biceps'],
  'Legs': ['quadriceps', 'hamstrings', 'glutes', 'calves'],
  'Shoulders & Core': ['shoulders', 'abdominals'],
  'Chest': ['chest', 'triceps'],
  'Back': ['lats', 'middle back', 'biceps'],
  'Shoulders': ['shoulders', 'traps'],
  'Arms & Core': ['biceps', 'triceps', 'abdominals'],
  'Chest & Shoulders': ['chest', 'shoulders'],
  'Back & Arms': ['lats', 'middle back', 'biceps', 'triceps'],
  'Legs & Core': ['quadriceps', 'hamstrings', 'glutes', 'abdominals']
};

const EXERCISE_POOL = {
  chest: ['Barbell Bench Press - Medium Grip', 'Incline Dumbbell Press', 'Cable Crossover', 'Machine Bench Press', 'Pushups', 'Dumbbell Bench Press'],
  shoulders: ['Barbell Shoulder Press', 'Seated Dumbbell Press', 'Side Lateral Raise', 'Face Pull', 'Arnold Dumbbell Press', 'Reverse Flyes'],
  triceps: ['Triceps Pushdown', 'Triceps Pushdown - Rope Attachment', 'Close-Grip Barbell Bench Press', 'Lying Dumbbell Tricep Extension', 'Cable Rope Overhead Triceps Extension', 'Dips - Triceps Version'],
  biceps: ['Barbell Curl', 'Dumbbell Bicep Curl', 'Hammer Curls', 'Preacher Curl', 'Concentration Curls', 'Incline Dumbbell Curl'],
  lats: ['Wide-Grip Lat Pulldown', 'Straight-Arm Pulldown', 'Pullups', 'Chin-Up', 'Close-Grip Front Lat Pulldown', 'Underhand Cable Pulldowns'],
  'middle back': ['Bent Over Barbell Row', 'Seated Cable Rows', 'One-Arm Dumbbell Row', 'T-Bar Row with Handle', 'Dumbbell Incline Row', 'Leverage High Row'],
  'lower back': ['Barbell Deadlift', 'Stiff-Legged Barbell Deadlift', 'Good Morning', 'Rack Pulls', 'Deficit Deadlift'],
  quadriceps: ['Barbell Squat', 'Leg Press', 'Front Squat (Clean Grip)', 'Leg Extensions', 'Dumbbell Lunges', 'Goblet Squat'],
  hamstrings: ['Romanian Deadlift', 'Lying Leg Curls', 'Seated Leg Curl', 'Stiff-Legged Dumbbell Deadlift', 'Standing Leg Curl'],
  glutes: ['Barbell Hip Thrust', 'Barbell Glute Bridge', 'Pull Through', 'Single Leg Glute Bridge', 'Glute Kickback'],
  calves: ['Standing Calf Raises', 'Seated Calf Raise', 'Calf Press On The Leg Press Machine', 'Standing Dumbbell Calf Raise'],
  abdominals: ['Plank', 'Cable Crunch', 'Hanging Leg Raise', 'Russian Twist', 'Side Bridge'],
  traps: ['Barbell Shrug', 'Dumbbell Shrug', 'Cable Shrugs', 'Upright Barbell Row', 'Standing Dumbbell Upright Row']
};

const BODYWEIGHT_EXERCISES = ['Push-ups', 'Goblet squats', 'Dumbbell rows', 'Romanian deadlifts', 'Plank', 'Walking lunges'];

function pickExercises(muscles, equipment, count) {
  if (equipment === 'bodyweight') return BODYWEIGHT_EXERCISES.slice(0, count);

  const picked = [];
  const used = new Set();
  let exhausted = false;
  while (picked.length < count && !exhausted) {
    exhausted = true;
    for (const muscle of muscles) {
      if (picked.length >= count) break;
      for (const name of EXERCISE_POOL[muscle] || []) {
        if (!used.has(name)) {
          picked.push(name);
          used.add(name);
          exhausted = false;
          break;
        }
      }
    }
  }
  return picked;
}

function buildWorkoutPlan(profile) {
  const days = Math.min(Math.max(Number(profile.daysPerWeek) || 3, 2), 6);
  const goal = profile.goal || 'build-muscle';
  const split = SPLIT_TEMPLATES[days] || SPLIT_TEMPLATES[3];
  const exercisesPerDay = goal === 'strength' ? 4 : 5;
  const reps = goal === 'strength' ? '4 sets x 4-6 reps' : goal === 'fat-loss' ? '3 sets x 10-15 reps' : '3-4 sets x 8-12 reps';
  const rest = goal === 'strength' ? '2-3 minutes' : goal === 'fat-loss' ? '45-60 seconds' : '60-90 seconds';

  return {
    mode: 'mock-ai',
    headline: `${days}-day ${goal.replace('-', ' ')} plan for ${profile.experience || 'beginner'} level`,
    summary: `Personalized weekly plan based on your goal, available equipment and training frequency.`,
    weeklyPlan: split.map((day, index) => {
      const muscles = MUSCLE_SPLIT_MAP[day] || MUSCLE_SPLIT_MAP['Full Body'];
      const exercises = pickExercises(muscles, profile.equipment, exercisesPerDay);
      return {
        day: `Day ${index + 1}`,
        focus: day,
        warmup: '5-8 minutes light cardio + dynamic mobility',
        exercises: exercises.map((name) => ({ name, prescription: reps, rest })),
        finisher: goal === 'fat-loss' ? '10 minutes incline walk or bike intervals' : 'Optional 8 minutes core work'
      };
    }),
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

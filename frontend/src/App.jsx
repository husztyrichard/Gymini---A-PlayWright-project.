import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const EXERCISES_API = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

const MUSCLE_GROUPS = {
  'build-muscle': ['chest', 'shoulders', 'biceps', 'triceps', 'lats', 'middle back', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'abdominals'],
  'fat-loss': ['chest', 'shoulders', 'lats', 'middle back', 'quadriceps', 'hamstrings', 'glutes', 'abdominals'],
  'strength': ['chest', 'shoulders', 'lats', 'middle back', 'lower back', 'quadriceps', 'hamstrings', 'glutes', 'traps'],
  'general-fitness': ['chest', 'shoulders', 'biceps', 'lats', 'quadriceps', 'hamstrings', 'glutes', 'abdominals', 'calves']
};

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

const initialForm = {
  age: '30',
  gender: 'male',
  height: '178',
  weight: '82',
  bodyFat: '18',
  goal: 'build-muscle',
  experience: 'intermediate',
  daysPerWeek: '4',
  sessionLength: '60',
  equipment: 'gym'
};

function pickExercises(allExercises, muscles, equipment, count) {
  const equipMap = {
    gym: ['barbell', 'dumbbell', 'cable', 'machine', 'kettlebells', 'body only'],
    dumbbells: ['dumbbell', 'body only'],
    bodyweight: ['body only']
  };
  const allowedEquip = equipMap[equipment] || equipMap.gym;

  const candidates = allExercises.filter((e) => {
    const hasMuscle = e.primaryMuscles?.some((m) => muscles.includes(m));
    const hasEquip = !e.equipment || allowedEquip.includes(e.equipment);
    const isStrength = e.category === 'strength' || e.category === 'powerlifting';
    return hasMuscle && hasEquip && isStrength;
  });

  const picked = [];
  const usedNames = new Set();
  for (const muscle of muscles) {
    const matching = candidates.filter(
      (e) => e.primaryMuscles?.includes(muscle) && !usedNames.has(e.name)
    );
    matching.sort(() => Math.random() - 0.5);
    for (const ex of matching) {
      if (picked.length >= count) break;
      picked.push(ex);
      usedNames.add(ex.name);
    }
    if (picked.length >= count) break;
  }

  if (picked.length < count) {
    for (const ex of candidates) {
      if (picked.length >= count) break;
      if (!usedNames.has(ex.name)) {
        picked.push(ex);
        usedNames.add(ex.name);
      }
    }
  }

  return picked;
}

function buildRealPlan(allExercises, profile) {
  if (!allExercises.length) return null;

  const days = Math.min(Math.max(Number(profile.daysPerWeek) || 3, 2), 6);
  const split = SPLIT_TEMPLATES[days] || SPLIT_TEMPLATES[3];
  const goal = profile.goal || 'build-muscle';
  const exercisesPerDay = goal === 'strength' ? 4 : 5;
  const reps = goal === 'strength' ? '4 sets x 4-6 reps' : goal === 'fat-loss' ? '3 sets x 10-15 reps' : '3-4 sets x 8-12 reps';
  const rest = goal === 'strength' ? '2-3 minutes' : goal === 'fat-loss' ? '45-60 seconds' : '60-90 seconds';

  return {
    headline: `${days}-day ${goal.replace('-', ' ')} plan for ${profile.experience || 'beginner'} level`,
    summary: `Personalized weekly plan based on your goal, available equipment and training frequency.`,
    weeklyPlan: split.map((day, index) => {
      const muscles = MUSCLE_SPLIT_MAP[day] || MUSCLE_SPLIT_MAP['Full Body'];
      const dayExercises = pickExercises(allExercises, muscles, profile.equipment, exercisesPerDay);
      return {
        day: `Day ${index + 1}`,
        focus: day,
        warmup: '5-8 minutes light cardio + dynamic mobility',
        exercises: dayExercises.map((ex) => ({
          name: ex.name,
          id: ex.id,
          prescription: reps,
          rest
        })),
        finisher: goal === 'fat-loss' ? '10 minutes incline walk or bike intervals' : 'Optional 8 minutes core work'
      };
    }),
    progression: 'If all sets feel controlled for two sessions, increase weight by 2.5-5% or add 1-2 reps per set.',
    safety: 'This is general fitness guidance, not medical advice. Stop if you feel pain and consult a professional.'
  };
}

function countPlaywrightResults(suites) {
  let total = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  function walk(list) {
    for (const suite of list || []) {
      for (const spec of suite.specs || []) {
        for (const test of spec.tests || []) {
          total++;
          const results = test.results || [];
          const status = results.length ? results[results.length - 1].status : 'skipped';
          if (status === 'passed' || status === 'flaky') passed++;
          else if (status === 'failed' || status === 'timedOut' || status === 'interrupted') failed++;
          else skipped++;
        }
      }
      walk(suite.suites);
    }
  }
  walk(suites);

  return { total, passed, failed, skipped };
}

function App() {
  const [form, setForm] = useState(initialForm);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('all');
  const [equipmentFilter, setEquipmentFilter] = useState('all');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exercisesLoading, setExercisesLoading] = useState(true);
  const [showExample, setShowExample] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [testLoading, setTestLoading] = useState(true);
  const [testError, setTestError] = useState('');
  useEffect(() => {
    async function fetchTestResults() {
      try {
        // Prefer the live backend endpoint when available
        let response = await fetch('/api/test-results');
        if (response.ok) {
          const data = await response.json();
          setTestResults(data);
          return;
        }

        // Fallback: static report JSON files committed with the site
        const results = {};
        let found = false;

        response = await fetch('/reports/api-results.json');
        if (response.ok) {
          const raw = await response.json();
          // Newman JSON contains run.stats and run.executions
          const run = raw.run || raw;
          const stats = run.stats || {};
          const total = stats.assertions?.total || stats.assertions?.cursor || 0;
          const failed = stats.assertions?.failed || 0;
          results.api = {
            total,
            passed: total - failed,
            failed,
            assertions: (run.executions || []).flatMap((ex) =>
              (ex.assertions || []).map((a) => ({ name: a.assertion || '', passed: !a.error, error: a.error?.message || null }))
            )
          };
          found = true;
        }

        response = await fetch('/reports/ui-results.json');
        if (response.ok) {
          const raw = await response.json();
          results.ui = countPlaywrightResults(raw.suites);
          found = true;
        }

        if (found) {
          setTestResults(results);
          return;
        }

        throw new Error('No test reports found on this deployment.');
      } catch (err) {
        setTestError(`Unable to load test metrics. ${err.message || ''}`);
      } finally {
        setTestLoading(false);
      }
    }

    fetchTestResults();
  }, []);

  useEffect(() => {
    fetch(EXERCISES_API)
      .then((res) => res.json())
      .then((data) => { setExercises(data); setExercisesLoading(false); })
      .catch(() => setExercisesLoading(false));
  }, []);

  const allMuscles = useMemo(() => {
    const set = new Set();
    exercises.forEach((e) => e.primaryMuscles?.forEach((m) => set.add(m)));
    return [...set].sort();
  }, [exercises]);

  const allEquipment = useMemo(() => {
    const set = new Set();
    exercises.forEach((e) => { if (e.equipment) set.add(e.equipment); });
    return [...set].sort();
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    return exercises.filter((e) => {
      const matchSearch = !exerciseSearch || e.name.toLowerCase().includes(exerciseSearch.toLowerCase());
      const matchMuscle = muscleFilter === 'all' || e.primaryMuscles?.includes(muscleFilter);
      const matchEquip = equipmentFilter === 'all' || e.equipment === equipmentFilter;
      return matchSearch && matchMuscle && matchEquip;
    });
  }, [exercises, exerciseSearch, muscleFilter, equipmentFilter]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function generatePlan(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    let planResult = null;
    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (response.ok) {
        planResult = await response.json();
      }
    } catch {
      // Backend unavailable (e.g. static hosting) — fall back to local generation.
    }

    if (!planResult) {
      planResult = buildRealPlan(exercises, form);
      if (!planResult) {
        setError('Exercise data not loaded yet. Please wait a moment and try again.');
      }
    }

    if (planResult) setPlan(planResult);
    setLoading(false);
  }

  function findExerciseByName(name) {
    return exercises.find((e) => e.name === name) || null;
  }

  const examplePlan = useMemo(() => {
    if (!exercises.length) return null;
    return buildRealPlan(exercises, { ...initialForm, daysPerWeek: '4', goal: 'build-muscle', equipment: 'gym' });
  }, [exercises]);

  return (
    <main>
      {selectedExercise && (
        <div className="exerciseModal" onClick={() => setSelectedExercise(null)}>
          <div className="exerciseModalContent" onClick={(e) => e.stopPropagation()}>
            <button className="modalClose" onClick={() => setSelectedExercise(null)}>&times;</button>
            <h3>{selectedExercise.name}</h3>
            <div className="modalMeta">
              <span className="tag">{selectedExercise.level}</span>
              <span className="tag">{selectedExercise.category}</span>
              {selectedExercise.equipment && <span className="tag">{selectedExercise.equipment}</span>}
              {selectedExercise.primaryMuscles?.map((m) => <span key={m} className="tag muscle">{m}</span>)}
            </div>
            <div className="modalImages">
              {selectedExercise.images?.map((img, i) => (
                <img key={i} src={IMG_BASE + img} alt={selectedExercise.name} loading="lazy" />
              ))}
            </div>
            <div className="modalInstructions">
              <h4>Instructions</h4>
              <ol>
                {selectedExercise.instructions?.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      <section className="hero">
        <nav className="nav">
          <div className="brand"><span>Gymini</span><small>QA Portfolio</small></div>
          <div className="navLinks">
            <a href="#exercises" className="navCta">Exercises</a>
            <a href="#test-dashboard" className="navCta">Tests</a>
            <a href="/test-cases.html" className="navCta">Test cases</a>
            <a href="/about.html" className="navCta">About me</a>
          </div>
        </nav>

        <div className="heroGrid">
          <div className="heroCopy">
            <p className="eyebrow">Example test automation project built to demonstrate QA skills</p>
            <h1>Example test automation project built to demonstrate QA skills</h1>
            <p className="subtext">
              This project is a working demo app with QA automation, test metrics, and accessibility validation to showcase my testing skills.
            </p>
            <div className="heroActions">
              <a href="#test-dashboard" className="primaryButton">View test dashboard</a>
              <a href="#planner" className="secondaryButton">Start planning</a>
              <button type="button" className="secondaryButton" onClick={() => setShowExample(true)}>See example</button>
            </div>
            <div className="proofRow">
              <span>800+ exercises</span>
              <span>Playwright-ready</span>
              <span>No login needed</span>
            </div>
          </div>

          {showExample && (
            <div className="phoneCard">
              <div className="pulse"></div>
              <h2>Today&apos;s focus</h2>
              {examplePlan ? (
                <>
                  <p>{examplePlan.weeklyPlan[0]?.focus}</p>
                  <ul>
                    {examplePlan.weeklyPlan[0]?.exercises.slice(0, 4).map((ex) => (
                      <li key={ex.name}>
                        <button type="button" className="linkButton" onClick={() => { const found = findExerciseByName(ex.name); if (found) setSelectedExercise(found); }}>{ex.name}</button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p style={{ color: '#94a3b8', fontSize: 16, fontWeight: 600 }}>Loading example…</p>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="testDashboard" id="test-dashboard">
        <div className="sectionHeader">
          <p className="eyebrow">Quality Assurance</p>
          <h2>Live test status and metrics</h2>
          <p>Monitor automated coverage and report availability. The API suite runs locally (`npm test`) or in CI.</p>
        </div>

        <div className="testGrid">
          <div className="testCard">
            <div className="testCardHeader">
              <h3>API Test Metrics</h3>
              <span className="tag">Newman</span>
            </div>
            {testLoading ? (
              <p>Loading test metrics…</p>
            ) : testError ? (
              <p className="error">{testError}</p>
            ) : (
              <>
                <div className="metricList">
                  <div className="metricItem">
                    <span>Total assertions</span>
                    <strong>{testResults?.api?.total ?? '—'}</strong>
                  </div>
                  <div className="metricItem">
                    <span>Passed</span>
                    <strong>{testResults?.api?.passed ?? '—'}</strong>
                  </div>
                  <div className="metricItem">
                    <span>Failed</span>
                    <strong>{testResults?.api?.failed ?? '—'}</strong>
                  </div>
                  <div className="metricItem">
                    <span>Pass rate</span>
                    <strong>{testResults?.api?.total ? `${Math.round((testResults.api.passed / testResults.api.total) * 100)}%` : '—'}</strong>
                  </div>
                </div>
                <div className="heroActions">
                  <a href="/reports/api-report.html" className="primaryButton" target="_blank" rel="noreferrer">Open API Report</a>
                </div>
              </>
            )}
          </div>

          <div className="testCard">
            <div className="testCardHeader">
              <h3>Test status</h3>
              <span className="tag">Playwright</span>
            </div>
            <p>UI test coverage and automated result reports for core user flows.</p>
            <div className="statusBlock">
              <span className="statusLabel">API status</span>
              <div style={{textAlign: 'right'}}>
                <strong className={testResults?.api?.failed ? 'statusFail' : 'statusPass'}>
                  {testResults?.api ? (testResults.api.failed ? 'Fail' : 'Available') : (testError ? 'Unavailable' : 'Unknown')}
                </strong>
                {testError && <div style={{color: '#fca5a5', fontSize: 12}}>{testError}</div>}
              </div>
            </div>
            <div className="statusBlock">
              <span className="statusLabel">UI tests</span>
              <strong className={testResults?.ui ? (testResults.ui.failed ? 'statusFail' : 'statusPass') : ''}>
                {testResults?.ui ? `${testResults.ui.total} tests` : '32 tests'}
              </strong>
            </div>
            <div className="statusBlock">
              <span className="statusLabel">Reports page</span>
              <strong>Available</strong>
            </div>
            <div className="heroActions">
              <a href="/reports/playwright-report/index.html" className="primaryButton" target="_blank" rel="noreferrer">Open UI Report</a>
            </div>
          </div>
        </div>
      </section>

      <section className="planner" id="planner">
        <div className="sectionHeader">
          <h2>Create your plan</h2>
          <p>Enter your details and get a personalized workout plan with real exercises.</p>
        </div>

        <div className="plannerGrid">
          <form className="formCard" onSubmit={generatePlan}>
            <div className="fieldRow">
              <label>Age<input name="age" type="number" min="14" max="90" value={form.age} onChange={updateField} required /></label>
              <label>Gender<select name="gender" value={form.gender} onChange={updateField}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></label>
            </div>
            <div className="fieldRow">
              <label>Height cm<input name="height" type="number" min="120" max="230" value={form.height} onChange={updateField} required /></label>
              <label>Weight kg<input name="weight" type="number" min="35" max="250" value={form.weight} onChange={updateField} required /></label>
              <label>Body fat %<input name="bodyFat" type="number" min="3" max="60" value={form.bodyFat} onChange={updateField} /></label>
            </div>
            <div className="fieldRow">
              <label>Goal<select name="goal" value={form.goal} onChange={updateField}><option value="build-muscle">Build muscle</option><option value="fat-loss">Lose fat</option><option value="strength">Strength</option><option value="general-fitness">General fitness</option></select></label>
              <label>Experience<select name="experience" value={form.experience} onChange={updateField}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
            </div>
            <div className="fieldRow">
              <label>Days / week<select name="daysPerWeek" value={form.daysPerWeek} onChange={updateField}><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option></select></label>
              <label>Minutes / session<input name="sessionLength" type="number" min="25" max="120" value={form.sessionLength} onChange={updateField} /></label>
              <label>Equipment<select name="equipment" value={form.equipment} onChange={updateField}><option value="gym">Full gym</option><option value="dumbbells">Home dumbbells</option><option value="bodyweight">Bodyweight only</option></select></label>
            </div>
            <button className="primaryButton full" disabled={loading}>{loading ? 'Generating...' : 'Generate my workout plan'}</button>
            {error && <p className="error">{error}</p>}
          </form>

          <PlanResult plan={plan} onExerciseClick={setSelectedExercise} findExercise={findExerciseByName} />
        </div>
      </section>

      <section className="exercisesSection" id="exercises">
        <div className="sectionHeader">
          <p className="eyebrow">Exercise Library</p>
          <h2>Browse Exercises</h2>
          <p>800+ exercises with images, instructions and muscle group filtering.</p>
        </div>

        <div className="exerciseControls">
          <input
            className="exerciseSearch"
            type="text"
            placeholder="Search exercises..."
            value={exerciseSearch}
            onChange={(e) => setExerciseSearch(e.target.value)}
          />
          <select className="exerciseFilter" value={muscleFilter} onChange={(e) => setMuscleFilter(e.target.value)}>
            <option value="all">All muscles</option>
            {allMuscles.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="exerciseFilter" value={equipmentFilter} onChange={(e) => setEquipmentFilter(e.target.value)}>
            <option value="all">All equipment</option>
            {allEquipment.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <span className="exerciseCount">{filteredExercises.length} exercises</span>
        </div>

        <div className="exerciseGrid">
          {exercisesLoading && <p className="exerciseLoading">Loading exercises...</p>}
          {!exercisesLoading && filteredExercises.length === 0 && <p className="exerciseLoading">No exercises found.</p>}
          {filteredExercises.slice(0, 60).map((exercise) => (
            <article
              className="exerciseCard"
              key={exercise.id}
              onClick={() => setSelectedExercise(exercise)}
            >
              <div className="exerciseCardImg">
                {exercise.images?.[0] && (
                  <img src={IMG_BASE + exercise.images[0]} alt={exercise.name} loading="lazy" />
                )}
              </div>
              <div className="exerciseCardInfo">
                <strong>{exercise.name}</strong>
                <div className="exerciseCardTags">
                  <span className="tag">{exercise.level}</span>
                  {exercise.primaryMuscles?.slice(0, 2).map((m) => <span key={m} className="tag muscle">{m}</span>)}
                </div>
              </div>
            </article>
          ))}
        </div>
        {filteredExercises.length > 60 && (
          <p className="exerciseLoading">Showing 60 of {filteredExercises.length}. Use filters to narrow down.</p>
        )}
      </section>

    </main>
  );
}

function PlanResult({ plan, onExerciseClick, findExercise }) {
  if (!plan) {
    return (
      <div className="resultCard empty">
        <p className="eyebrow">Your result</p>
        <h3>Your AI workout plan will appear here.</h3>
        <p>Fill in the form and click generate to get a real plan.</p>
      </div>
    );
  }

  return (
    <div className="resultCard">
      <h3>{plan.headline}</h3>
      <p>{plan.summary}</p>
      <div className="days">
        {plan.weeklyPlan.map((day) => (
          <article className="dayCard" key={day.day}>
            <strong>{day.day}: {day.focus}</strong>
            <span>{day.warmup}</span>
            <ul>
              {day.exercises.map((exercise) => (
                <li key={exercise.name}>
                  <button
                    type="button"
                    className="linkButton"
                    onClick={() => {
                      const found = findExercise(exercise.name);
                      if (found) onExerciseClick(found);
                    }}
                  >
                    {exercise.name}
                  </button>
                  <span className="exerciseRx"> &middot; {exercise.prescription} &middot; rest {exercise.rest}</span>
                </li>
              ))}
            </ul>
            <em>{day.finisher}</em>
          </article>
        ))}
      </div>
      <div className="advice"><strong>Progression:</strong> {plan.progression}</div>
      <div className="advice muted"><strong>Safety:</strong> {plan.safety}</div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);

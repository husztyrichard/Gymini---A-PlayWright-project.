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
  const reps = goal === 'strength' ? '4 sets x 4-6 reps' : goal === 'fat-loss' ? '3 sets x 12-15 reps' : '3-4 sets x 8-12 reps';
  const rest = goal === 'strength' ? '2-3 min' : goal === 'fat-loss' ? '45-60 sec' : '60-90 sec';

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
  const [runningTests, setRunningTests] = useState(false);

  useEffect(() => {
    async function fetchTestResults() {
      try {
        const response = await fetch('/api/test-results');
        if (!response.ok) throw new Error('Failed to load test status');
        const data = await response.json();
        setTestResults(data);
      } catch (err) {
        setTestError('Unable to load test metrics.');
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

  function generatePlan(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const result = buildRealPlan(exercises, form);
      if (!result) {
        setError('Exercise data not loaded yet. Please wait a moment and try again.');
      } else {
        setPlan(result);
      }
      setLoading(false);
    }, 300);
  }

  async function runApiTests() {
    setRunningTests(true);
    setTestError('');

    try {
      const response = await fetch('/api/run-api-tests', { method: 'POST' });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to run tests');
      }

      const data = await response.json();
      if (data.success && data.results) {
        setTestResults({ api: data.results });
      } else {
        setTestError(data.message || 'Test run completed with issues.');
      }
    } catch (err) {
      setTestError(err.message || 'Unable to run tests.');
    } finally {
      setRunningTests(false);
    }
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
            <a href="/reports.html" className="navCta">Reports</a>
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
            </div>
            <div className="proofRow">
              <span>800+ exercises</span>
              <span>Playwright-ready</span>
              <span>No login needed</span>
            </div>
          </div>

          {showExample && examplePlan && (
            <div className="phoneCard">
              <div className="pulse"></div>
              <h2>Today&apos;s focus</h2>
              <p>{examplePlan.weeklyPlan[0]?.focus}</p>
              <ul>
                {examplePlan.weeklyPlan[0]?.exercises.slice(0, 4).map((ex) => (
                  <li key={ex.name}>
                    <button type="button" className="linkButton" onClick={() => { const found = findExerciseByName(ex.name); if (found) setSelectedExercise(found); }}>{ex.name}</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="testDashboard" id="test-dashboard">
        <div className="sectionHeader">
          <p className="eyebrow">Quality Assurance</p>
          <h2>Live test status and metrics</h2>
          <p>Monitor automated coverage, report availability and run the API suite from the site.</p>
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
              <strong className={testResults?.api?.failed ? 'statusFail' : 'statusPass'}>
                {testResults?.api ? (testResults.api.failed ? 'Fail' : 'Pass') : 'Unknown'}
              </strong>
            </div>
            <div className="statusBlock">
              <span className="statusLabel">UI tests</span>
              <strong>32 tests</strong>
            </div>
            <div className="statusBlock">
              <span className="statusLabel">Reports page</span>
              <strong>Available</strong>
            </div>
            <div className="testActions">
              <button className="primaryButton" type="button" onClick={runApiTests} disabled={runningTests || testLoading}>
                {runningTests ? 'Running tests…' : 'Run tests'}
              </button>
              <a href="/reports.html" className="secondaryButton">View reports page</a>
            </div>
          </div>
        </div>
      </section>

      <section className="accessibilitySection" id="accessibility">
        <div className="sectionHeader">
          <p className="eyebrow">Accessibility</p>
          <h2>Built with inclusive QA in mind</h2>
          <p>Keyboard navigation, semantic markup, focus states and accessible content make this app easier to test and use.</p>
        </div>
        <div className="accessibilityGrid">
          <article className="accessibilityCard">
            <h3>Keyboard support</h3>
            <p>All interactive actions are designed to work with the keyboard and visible focus styles.</p>
          </article>
          <article className="accessibilityCard">
            <h3>Meaningful content</h3>
            <p>Clear labels, button text and headings support screen readers and usability testing.</p>
          </article>
          <article className="accessibilityCard">
            <h3>Testable feedback</h3>
            <p>Error messages, loading states and test reports are visible and easy to verify.</p>
          </article>
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

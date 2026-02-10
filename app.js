// ============================================
// Routine Configuration
// Edit this array to customize the exercise routine
// ============================================

const routine = [
  {
    name: "Wall Calf Stretch",
    type: "Stretch",
    mode: "timed",
    sets: 3,
    perSide: true,
    secondsPerSide: 30,
    purpose: "Loosen calves and ankles.",
    instructions: "Hands on wall, heels down.",
    image: "assets/ex_wall_calf_stretch.png"
  },
  {
    name: "Seated Towel Stretch",
    type: "Stretch",
    mode: "timed",
    sets: 3,
    perSide: true,
    secondsPerSide: 30,
    purpose: "Stretch the back of the leg.",
    instructions: "Sit tall, towel around foot.",
    image: "assets/ex_seated_towel_stretch.png"
  },
  {
    name: "Heel Walking (forwards & backwards)",
    type: "Strength",
    mode: "steps",
    sets: 4,
    perSide: false,
    steps: 10,
    purpose: "Build shin strength.",
    instructions: "Walk on heels forward then back.",
    image: "assets/ex_heel_walking.png"
  },
  {
    name: "Resistance Band Dorsiflexion",
    type: "Strength",
    mode: "reps",
    sets: 3,
    perSide: true,
    repsPerSide: 15,
    purpose: "Strengthen the front of the ankle.",
    instructions: "Sit down, use the band to pull toes up.",
    image: "assets/ex_band_dorsi_pull.png"
  },
  {
    name: "Mini Squats (heels flat)",
    type: "Strength",
    mode: "reps",
    sets: 3,
    perSide: false,
    reps: 10,
    purpose: "Strengthen legs with control.",
    instructions: "Slow squat, keep heels down.",
    image: "assets/ex_mini_squats.png"
  },
  {
    name: "Heel-Toe Walk on Tape Line",
    type: "Gait",
    mode: "steps",
    sets: 4,
    perSide: false,
    steps: 10,
    purpose: "Practice steady walking.",
    instructions: "Heel to toe along the line.",
    image: "assets/ex_heel_toe_walk.png"
  },
  {
    name: "One-Leg Stand (eyes open, heels down)",
    type: "Balance",
    mode: "timed",
    sets: 3,
    perSide: true,
    secondsPerSide: 30,
    purpose: "Improve balance.",
    instructions: "Stand tall, eyes forward.",
    image: "assets/ex_one_leg_stand.png"
  },
  {
    name: "Penguin Walk Game",
    type: "Fun",
    mode: "timed",
    sets: 1,
    perSide: false,
    seconds: 180,
    purpose: "Have fun while moving.",
    instructions: "Waddle like a penguin!",
    image: "assets/ex_penguin_walk.png"
  },
];

// ============================================
// Workout Length Configuration
// ============================================

// Short workout overrides (by exercise name)
const SHORT_WORKOUT_OVERRIDES = {
  "Wall Calf Stretch": { sets: 2 },
  "Seated Towel Stretch": { sets: 2 },
  "Heel Walking (forwards & backwards)": { sets: 2, steps: 5 },
  "Resistance Band Dorsiflexion": { sets: 2, repsPerSide: 8 },
  "Mini Squats (heels flat)": { sets: 2, reps: 5 },
  "Heel-Toe Walk on Tape Line": { sets: 2, steps: 5 },
  "One-Leg Stand (eyes open, heels down)": { sets: 2 },
  "Penguin Walk Game": { seconds: 90 },
};

// Current workout length ('long' or 'short')
let workoutLength = 'long';

// Generate active routine based on workout length
function getActiveRoutine() {
  if (workoutLength === 'long') {
    return routine;
  }

  // Apply short workout overrides
  return routine.map(exercise => {
    const overrides = SHORT_WORKOUT_OVERRIDES[exercise.name];
    if (overrides) {
      return { ...exercise, ...overrides };
    }
    return exercise;
  });
}

// Get the current active routine (cached for performance during a session)
let activeRoutine = null;

function initActiveRoutine() {
  activeRoutine = getActiveRoutine();
}

// ============================================
// Audio Configuration & Logic
// ============================================
const MUSIC_DEFAULT_ENABLED = false;
const MUSIC_VOLUME_NORMAL = 0.5;
const MUSIC_VOLUME_DUCKED = 0.1;
const DUCK_FADE_TIME = 500; // ms

// Available tracks in assets/music/
const MUSIC_PLAYLIST = [
  "assets/music/Run Like A Story.mp3",
  "assets/music/Running With Shadows.mp3",
  "assets/music/Running With The Pack.mp3",
  "assets/music/Running with the Wild Sky.mp3",
  "assets/music/Stronger Every Lap.mp3"
];

const CUES = {
  beep: "assets/cues/beep.wav",
};

class AudioManager {
  constructor() {
    this.musicEnabled = localStorage.getItem('wolfwalkers_music_enabled') === 'true';
    this.currentTrackIndex = -1;
    this.audioMusic = new Audio();
    this.audioMusic.loop = false;
    this.audioMusic.volume = MUSIC_VOLUME_NORMAL;

    // Shuffle playlist initially
    this.playlist = [...MUSIC_PLAYLIST].sort(() => Math.random() - 0.5);

    this.audioMusic.addEventListener('ended', () => this.nextTrack());

    this.cues = {};
    for (const [key, path] of Object.entries(CUES)) {
      this.cues[key] = new Audio(path);
    }
    this.activeCues = 0;
  }

  init() {
    // Call this on first user interaction to unlock AudioContext if needed
    // For simple Audio elements, mainly ensures we can play.
    if (this.musicEnabled && this.audioMusic.paused) {
      this.playMusic();
    }
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    localStorage.setItem('wolfwalkers_music_enabled', this.musicEnabled);

    if (this.musicEnabled) {
      this.playMusic();
    } else {
      this.audioMusic.pause();
    }
    this.updateUI();
  }

  playMusic() {
    if (!this.musicEnabled) return;

    if (!this.audioMusic.src || this.audioMusic.src === '') {
      this.nextTrack();
    } else {
      this.audioMusic.play().catch(e => console.log("Audio play failed (interaction needed?):", e));
    }
    // Show skip button when music is active
    if (elements.skipTrackBtn) elements.skipTrackBtn.classList.remove('hidden');
  }

  nextTrack() {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
    this.audioMusic.src = this.playlist[this.currentTrackIndex];
    if (this.musicEnabled) {
      this.audioMusic.play().catch(e => console.log("Next track play failed:", e));
    }
  }

  playCue(cueName) {
    const cue = this.cues[cueName];
    if (!cue) return;

    // Increment active cues
    this.activeCues++;

    // Duck if this is the first active cue
    if (this.activeCues === 1 && this.musicEnabled && !this.audioMusic.paused) {
      this.duckMusic(true);
    }

    // Handle completion
    const onEnded = () => {
      this.activeCues--;
      if (this.activeCues <= 0) {
        this.activeCues = 0;
        this.duckMusic(false);
      }
      cue.removeEventListener('ended', onEnded);
    };

    cue.addEventListener('ended', onEnded);

    cue.currentTime = 0;
    cue.play().catch(e => console.log("Cue play failed:", e));
  }

  duckMusic(duck) {
    if (!this.audioMusic) return;
    // Simple volume jump for now, can animate if needed
    this.audioMusic.volume = duck ? MUSIC_VOLUME_DUCKED : MUSIC_VOLUME_NORMAL;
  }

  updateUI() {
    const btn = document.getElementById('musicToggleBtn');
    const skipBtn = document.getElementById('skipTrackBtn');
    if (btn) {
      // Visual state could be opacity or icon change
      btn.style.opacity = this.musicEnabled ? "1.0" : "0.5";
      // Optional: Change text if we added a span
    }
    if (skipBtn) {
      if (this.musicEnabled) skipBtn.classList.remove('hidden');
      else skipBtn.classList.add('hidden');
    }
  }
}

const audioManager = new AudioManager();

// function playCelebrationSound() { ... } // Removed

// ============================================
// State Management
// ============================================

const state = {
  currentStepIndex: 0,
  currentSetIndex: 0,
  currentSide: null, // Set when workout length is chosen
  started: false,
  currentRep: 0, // For rep counting display
  // Timer state
  timerRunning: false,
  timerPaused: false,
  timerCountingDown: false,
  secondsRemaining: 0,
  timerIntervalId: null,
  // Routine timing
  routineStartTime: null,
  routineEndTime: null,
};

const completedSteps = new Set();

// ============================================
// Session Persistence (localStorage)
// ============================================

const STORAGE_NAMESPACE = 'wolfwalkers_';
const STORAGE_KEYS = {
  state: STORAGE_NAMESPACE + 'state',
  completedSteps: STORAGE_NAMESPACE + 'completedSteps',
  workoutLength: STORAGE_NAMESPACE + 'workoutLength',
};

// ============================================
// Daily Celebration Configuration
// ============================================

const CELEBRATION_CONFIG = {
  enabled: true,
  date: "2026-01-21", // Use YYYY-MM-DD (or MM-DD to repeat yearly).
  name: "Dalia",
  showOncePerDay: false,
  confettiCount: 18,
  balloonCount: 6,
  spiritCount: 3,
  durationMs: 4200,
};

const CELEBRATION_STORAGE_KEY = STORAGE_NAMESPACE + 'celebrationSeenDate';
const CELEBRATION_ASSETS = [
  "assets/stickers/sticker_leaf_gold.png",
  "assets/stickers/sticker_feather_blue.png",
  "assets/stickers/sticker_tree_pine.png",
  "assets/stickers/sticker_moon_crescent.png",
  "assets/stickers/sticker_acorn.png",
  "assets/stickers/sticker_butterfly.png",
  "assets/stickers/sticker_owl.png",
  "assets/stickers/sticker_wolf_paw.png",
  "assets/wolf_spirit_blue.png",
  "assets/stickers/sticker_bear_circle.png",
  "assets/stickers/sticker_deer_circle.png",
  "assets/stickers/sticker_rabbit_circle.png",
  "assets/stickers/sticker_sun_circle.png",
];

function saveSession() {
  try {
    // Save only the persistable parts of state (not timerIntervalId)
    const persistableState = {
      currentStepIndex: state.currentStepIndex,
      currentSetIndex: state.currentSetIndex,
      currentSide: state.currentSide,
      started: state.started,
      currentRep: state.currentRep,
      timerPaused: state.timerPaused || state.timerRunning, // Save as paused if was running
      secondsRemaining: state.secondsRemaining,
      routineStartTime: state.routineStartTime,
    };
    localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(persistableState));
    localStorage.setItem(STORAGE_KEYS.completedSteps, JSON.stringify([...completedSteps]));
    localStorage.setItem(STORAGE_KEYS.workoutLength, workoutLength);
  } catch (e) {
    console.warn('Failed to save session:', e);
  }
}

function loadSession() {
  try {
    const savedState = localStorage.getItem(STORAGE_KEYS.state);
    const savedSteps = localStorage.getItem(STORAGE_KEYS.completedSteps);
    const savedWorkoutLength = localStorage.getItem(STORAGE_KEYS.workoutLength);

    if (!savedState) return null;

    const parsed = JSON.parse(savedState);
    const steps = savedSteps ? JSON.parse(savedSteps) : [];

    return { state: parsed, completedSteps: steps, workoutLength: savedWorkoutLength || 'long' };
  } catch (e) {
    console.warn('Failed to load session:', e);
    return null;
  }
}

function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEYS.state);
    localStorage.removeItem(STORAGE_KEYS.completedSteps);
    localStorage.removeItem(STORAGE_KEYS.workoutLength);
  } catch (e) {
    console.warn('Failed to clear session:', e);
  }
}

function hasSavedSession() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.state);
    if (!saved) return false;
    const parsed = JSON.parse(saved);
    // Only prompt if actually started
    return parsed.started === true;
  } catch (e) {
    return false;
  }
}

function restoreSession(savedData) {
  if (!savedData) return;

  // Restore workout length and initialize active routine
  workoutLength = savedData.workoutLength || 'long';
  initActiveRoutine();

  // Restore state
  state.currentStepIndex = savedData.state.currentStepIndex;
  state.currentSetIndex = savedData.state.currentSetIndex;
  state.currentSide = savedData.state.currentSide;
  state.started = savedData.state.started;
  state.currentRep = savedData.state.currentRep;
  state.timerPaused = savedData.state.timerPaused;
  state.timerRunning = false; // Always start paused on resume
  state.secondsRemaining = savedData.state.secondsRemaining;
  state.routineStartTime = savedData.state.routineStartTime;

  // Restore completed steps
  completedSteps.clear();
  savedData.completedSteps.forEach(step => completedSteps.add(step));
}

// ============================================
// Motivation System Persistence
// ============================================

const MOTIVATION_KEY = 'wolfwalkers_motivation_v1';

// Badge Definitions
const BADGES = [
  { id: 'first_session', name: 'First Steps', description: 'Complete your first session', icon: 'assets/badges/badge_first_steps.svg' },
  { id: 'hat_trick', name: 'Hat Trick', description: 'Complete 3 sessions in a week', icon: 'assets/badges/badge_hat_trick.svg' },
  { id: 'ten_strong', name: 'Ten Strong', description: 'Complete 10 total sessions', icon: 'assets/badges/badge_ten_strong.svg' },
  { id: 'quarter_century', name: 'Quarter Century', description: 'Complete 25 total sessions', icon: 'assets/badges/badge_quarter_century.svg' },
  { id: 'fifty_fine', name: 'Fifty Fine', description: 'Complete 50 total sessions', icon: 'assets/badges/badge_fifty_fine.svg' },
  { id: 'century_wolf', name: 'Century Wolf', description: 'Complete 100 total sessions', icon: 'assets/badges/badge_century_wolf.svg' },
  { id: 'stretch_star', name: 'Stretch Star', description: 'Complete all stretches in a session', icon: 'assets/badges/badge_stretch_star.svg' },
  { id: 'strong_steps', name: 'Strong Steps', description: 'Complete all strength sets in a session', icon: 'assets/badges/badge_strong_steps.svg' },
  { id: 'explorer', name: 'Explorer', description: 'Complete a session while offline', icon: 'assets/badges/badge_explorer.svg' }
];

const defaultMotivationState = {
  totalSessionsCompleted: 0,
  sessionsByDate: {}, // "YYYY-MM-DD": true
  currentStreak: 0,
  lastSessionDate: null,
  graceDaysUsedThisMonth: 0,
  lastGraceMonth: null, // "YYYY-MM"
  badgesUnlocked: [], // { id, timestamp }
  xpTotal: 0,
  collectedStickers: [], // IDs
  lastStickerDate: null // "YYYY-MM-DD"
};

let motivationState = { ...defaultMotivationState };

function loadMotivationData() {
  try {
    const saved = localStorage.getItem(MOTIVATION_KEY);
    if (saved) {
      motivationState = { ...defaultMotivationState, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Failed to load motivation data', e);
  }
}

function saveMotivationData() {
  try {
    localStorage.setItem(MOTIVATION_KEY, JSON.stringify(motivationState));
  } catch (e) {
    console.warn('Failed to save motivation data', e);
  }
}

function resetMotivationData() {
  if (confirm("Are you sure you want to reset all progress, badges, and streaks? This cannot be undone.")) {
    motivationState = { ...defaultMotivationState };
    saveMotivationData();
    alert("Motivation data has been reset.");
    window.location.reload();
  }
}

// Helper: Get date strings
function getTodayString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function getMonthString() {
  const now = new Date();
  return now.toISOString().split('T')[0].substring(0, 7); // "YYYY-MM"
}

// Logic: Check and unlock badges
function checkBadges() {
  const newBadges = [];
  const state = motivationState;

  BADGES.forEach(badge => {
    // Skip if already unlocked
    if (state.badgesUnlocked.some(b => b.id === badge.id)) return;

    let unlocked = false;

    // Check conditions
    if (badge.id === 'first_session' && state.totalSessionsCompleted >= 1) unlocked = true;
    if (badge.id === 'ten_strong' && state.totalSessionsCompleted >= 10) unlocked = true;
    if (badge.id === 'quarter_century' && state.totalSessionsCompleted >= 25) unlocked = true;
    if (badge.id === 'fifty_fine' && state.totalSessionsCompleted >= 50) unlocked = true;
    if (badge.id === 'century_wolf' && state.totalSessionsCompleted >= 100) unlocked = true;

    // "Hat Trick": 3 sessions in a week (simple check: last 3 sessions within 7 days)
    if (badge.id === 'hat_trick' && state.totalSessionsCompleted >= 3) {
      // Logic depends on history sessionByDate keys... simplistic approach for now
      // or checking consecutive days. Let's rely on "sessionsByDate" if we populate it
    }

    // "Explorer": Offline mode
    if (badge.id === 'explorer' && !navigator.onLine) unlocked = true;

    // "Stretch Star" & "Strong Steps" are passed from workout logic, handled separately/manually 
    // or by checking flags if we track them. For now, we'll manually trigger them in `onSessionComplete` if eligible.

    if (unlocked) {
      const badgeEntry = { id: badge.id, timestamp: Date.now() };
      state.badgesUnlocked.push(badgeEntry);
      newBadges.push(badge);
    }
  });

  return newBadges;
}

// Logic: Update Streak
function updateStreak() {
  const today = getTodayString();
  const currentMonth = getMonthString();
  const state = motivationState;

  // Reset grace days if new month
  if (state.lastGraceMonth !== currentMonth) {
    state.graceDaysUsedThisMonth = 0;
    state.lastGraceMonth = currentMonth;
  }

  // If already done today, no streak change
  if (state.lastSessionDate === today) return;

  if (!state.lastSessionDate) {
    // First ever session
    state.currentStreak = 1;
  } else {
    const last = new Date(state.lastSessionDate);
    const now = new Date(today);
    const diffTime = Math.abs(now - last);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day
      state.currentStreak++;
    } else if (diffDays > 1) {
      // Missed days
      const daysMissed = diffDays - 1;

      // Check grace
      if (state.graceDaysUsedThisMonth + daysMissed <= 2) {
        // Grace saves the streak!
        state.graceDaysUsedThisMonth += daysMissed;
        state.currentStreak++; // Continue streak effectively
      } else {
        // Streak broken
        state.currentStreak = 1;
      }
    }
  }

  state.lastSessionDate = today;
  state.sessionsByDate[today] = true;
}

// Logic: Update XP and Chapter
function updateExperience(exercisesCount) {
  // +1 per exercise, +3 bonus for session
  const xpGained = exercisesCount + 3;
  motivationState.xpTotal += xpGained;

  // Simple chapter progression: 1 chapter per month approx, or based on session count
  // PRD says: "Progress within a month is based on sessions completed that month"
  // We'll increment chapter progress. 
  // Let's say 20 sessions to complete a chapter?
  const SESSIONS_PER_CHAPTER = 20;

  // Calculate chapter based on total sessions roughly, or explicit tracking
  // Let's track chapter progress 0-100%
  // We need to persist currentChapter and chapterProgress (sessions in this chapter)

  if (typeof motivationState.chapterProgress === 'undefined') motivationState.chapterProgress = 0;

  motivationState.chapterProgress++; // Increment sessions in this chapter

  if (motivationState.chapterProgress >= SESSIONS_PER_CHAPTER && motivationState.currentChapter < 6) {
    motivationState.currentChapter++;
    motivationState.chapterProgress = 0;
    // Celebration for new chapter?
  }
}

// Logic: Award Daily Sticker
function awardSticker() {
  const STICKERS = [
    'sticker_acorn', 'sticker_butterfly', 'sticker_feather_blue',
    'sticker_leaf_gold', 'sticker_moon_crescent', 'sticker_owl',
    'sticker_tree_pine', 'sticker_wolf_paw',
    'sticker_fox_circle', 'sticker_firefly_circle', 'sticker_rune_circle',
    'sticker_owl_circle', 'sticker_leaf_circle', 'sticker_moon_circle',
    'sticker_mushroom_circle', 'sticker_paw_circle',
    // New Forest Magic Stickers
    'sticker_bear_circle', 'sticker_deer_circle', 'sticker_rabbit_circle',
    'sticker_hedgehog', 'sticker_fern_leaf', 'sticker_crystal_blue',
    'sticker_sun_circle', 'sticker_star_gold', 'sticker_mushroom_red',
    'sticker_flower_purple'
  ];

  const today = getTodayString();

  // Check if already awarded today
  if (motivationState.lastStickerDate === today) {
    return null;
  }

  // Filter out collected stickers
  const collectedSet = new Set(motivationState.collectedStickers);
  const available = STICKERS.filter(s => !collectedSet.has(s));

  let stickerToAward;

  if (available.length > 0) {
    // Pick a new one
    stickerToAward = available[Math.floor(Math.random() * available.length)];
  } else {
    // All collected! Pick random
    stickerToAward = STICKERS[Math.floor(Math.random() * STICKERS.length)];
  }

  motivationState.collectedStickers.push(stickerToAward);
  motivationState.lastStickerDate = today;

  return stickerToAward;
}

// Master Function: Complete Session
function completeSessionMotivation(exercisesCount) {
  const state = motivationState;

  state.totalSessionsCompleted++;
  updateStreak();
  updateExperience(exercisesCount);

  const newSticker = awardSticker();
  const newBadges = checkBadges(); // Returns array of badge objects

  saveMotivationData();

  return {
    newSticker,
    newBadges,
    totalSessions: state.totalSessionsCompleted,
    streak: state.currentStreak,
    xpTotal: state.xpTotal
  };
}

// ============================================
// DOM Elements
// ============================================

const elements = {
  progressLabel: document.getElementById("progressLabel"),
  progressFill: document.getElementById("progressFill"),
  checkpointRow: document.getElementById("checkpointRow"),
  typeBadge: document.getElementById("typeBadge"),
  exerciseName: document.getElementById("exerciseName"),
  exercisePurpose: document.getElementById("exercisePurpose"),
  exerciseInstructions: document.getElementById("exerciseInstructions"),
  exerciseImage: document.getElementById("exerciseImage"),
  sideVisuals: document.getElementById("sideVisuals"),
  runeLeft: document.getElementById("runeLeft"),
  runeRight: document.getElementById("runeRight"),
  setStatus: document.getElementById("setStatus"),
  setBadge: document.getElementById("setBadge"),
  sideIndicator: document.getElementById("sideIndicator"),
  timerValue: document.getElementById("timerValue"),
  timerLabel: document.getElementById("timerLabel"),
  checkpointPath: document.getElementById("checkpointPath"),
  primaryAction: document.getElementById("primaryAction"),
  pauseButton: document.getElementById("pauseButton"),
  resumeButton: document.getElementById("resumeButton"),
  backButton: document.getElementById("backButton"),
  skipButton: document.getElementById("skipButton"),
  backButtonNav: document.getElementById("backButtonNav"),
  skipButtonNav: document.getElementById("skipButtonNav"),
  restartButton: document.getElementById("restartButton"),
  restOverlay: document.getElementById("restOverlay"),
  restNext: document.getElementById("restNext"),
  readyButton: document.getElementById("readyButton"),
  // Daily celebration overlay
  dailyAnimationOverlay: document.getElementById("dailyAnimationOverlay"),
  dailyMessage: document.getElementById("dailyMessage"),
  dailyStream: document.getElementById("dailyStream"),
  // End screen elements
  endOverlay: document.getElementById("endOverlay"),
  totalTimeValue: document.getElementById("totalTimeValue"),
  exercisesCompleted: document.getElementById("exercisesCompleted"),
  restartFromEnd: document.getElementById("restartFromEnd"),
  closeEndScreen: document.getElementById("closeEndScreen"),
  rewardContainer: document.getElementById("rewardContainer"),
  // Resume session elements
  resumeOverlay: document.getElementById("resumeOverlay"),
  resumeSessionBtn: document.getElementById("resumeSessionBtn"),
  startFreshBtn: document.getElementById("startFreshBtn"),
  // Workout length selection elements
  workoutLengthOverlay: document.getElementById("workoutLengthOverlay"),
  shortWorkoutBtn: document.getElementById("shortWorkoutBtn"),
  longWorkoutBtn: document.getElementById("longWorkoutBtn"),
  // Audio
  musicToggleBtn: document.getElementById("musicToggleBtn"),
  skipTrackBtn: document.getElementById("skipTrackBtn"),
};

const typeClassMap = {
  Stretch: "type-stretch",
  Strength: "type-strength",
  Gait: "type-gait",
  Balance: "type-balance",
  Fun: "type-fun",
};

// ============================================
// Utility Functions
// ============================================

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLocalDayName(date) {
  return new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(date);
}

function matchesCelebrationDate(dateKey) {
  const target = (CELEBRATION_CONFIG.date || "").trim();
  if (!target) return false;
  if (/^\d{2}-\d{2}$/.test(target)) {
    return dateKey.slice(5) === target;
  }
  return dateKey === target;
}

function getMetricForStep(step) {
  if (step.mode === "timed") {
    const seconds = step.perSide ? step.secondsPerSide : step.seconds;
    return { value: formatTime(seconds), label: "timer", type: "timer" };
  }

  if (step.mode === "reps") {
    const reps = step.perSide ? step.repsPerSide : step.reps;
    return { value: reps, label: "reps", type: "reps" };
  }

  if (step.mode === "steps") {
    return { value: step.steps, label: "steps", type: "steps" };
  }

  return { value: "--", label: "", type: "unknown" };
}

// ============================================
// Audio System (Replaced by AudioManager)
// ============================================

// ============================================
// Timer System
// ============================================

function startCountdown(onComplete) {
  let count = 3;
  const timerValue = elements.timerValue;

  state.timerCountingDown = true;
  state.timerRunning = false; // Not running the exercise timer yet
  render(); // Update UI to "Starting..." or similar

  // Optional: Update UI to show countdown overlay or just use timer text
  timerValue.textContent = count;
  audioManager.playCue('beep');

  // Add class for count style
  timerValue.classList.add('timer-running');

  let countdownInterval = setInterval(() => {
    count--;
    if (count > 0) {
      timerValue.textContent = count;
      audioManager.playCue('beep');
    } else {
      clearInterval(countdownInterval);
      if (timerValue) timerValue.textContent = "Go!";
      setTimeout(() => {
        state.timerCountingDown = false;
        onComplete();
      }, 500);
    }
  }, 1000);
}

function initializeTimer() {
  const step = getCurrentStep();
  if (step.mode !== "timed") return;

  const seconds = step.perSide ? step.secondsPerSide : step.seconds;
  state.secondsRemaining = seconds;
  state.timerRunning = false;
  state.timerPaused = false;
  updateTimerDisplay();
}

function startTimer() {
  const step = getCurrentStep();
  if (step.mode !== "timed") return;

  // Clear any existing interval
  if (state.timerIntervalId) {
    clearInterval(state.timerIntervalId);
  }

  state.timerRunning = true;
  state.timerPaused = false;
  render(); // Update UI to show Pause button

  let lastTickTime = Date.now();
  let fractionalSeconds = 0;

  state.timerIntervalId = setInterval(() => {
    const now = Date.now();
    const elapsed = (now - lastTickTime) / 1000;
    lastTickTime = now;

    fractionalSeconds += elapsed;

    if (fractionalSeconds >= 1) {
      state.secondsRemaining -= Math.floor(fractionalSeconds);
      fractionalSeconds = fractionalSeconds % 1;

      // Play beep in last 3 seconds
      if (state.secondsRemaining <= 3 && state.secondsRemaining > 0) {
        audioManager.playCue('beep');
      }

      updateTimerDisplay();

      if (state.secondsRemaining <= 0) {
        onTimerComplete();
      }
    }
  }, 250);

  updatePauseButtonState();
}

function pauseTimer() {
  if (!state.timerRunning || state.timerPaused) return;

  if (state.timerIntervalId) {
    clearInterval(state.timerIntervalId);
    state.timerIntervalId = null;
  }

  state.timerPaused = true;
  state.timerRunning = false;
  updatePauseButtonState();
  render();
}

function resumeTimer() {
  if (!state.timerPaused) return;

  state.timerPaused = false;
  startTimer();
  render();
}

function stopTimer() {
  if (state.timerIntervalId) {
    clearInterval(state.timerIntervalId);
    state.timerIntervalId = null;
  }
  state.timerRunning = false;
  state.timerPaused = false;
}

function onTimerComplete() {
  stopTimer();

  const step = getCurrentStep();

  // Per-leg: auto-transition Right -> Left
  if (step.perSide && state.currentSide === "Right") {
    state.currentSide = "Left";
    initializeTimer();
    render();

    // Auto-start after brief visual pause
    setTimeout(() => {
      startTimer();
    }, 500);
    return;
  }

  // Left completed or non-per-side: advance to next set/step
  advanceUnit();
}

function updateTimerDisplay() {
  elements.timerValue.textContent = formatTime(state.secondsRemaining);

  // Visual warning state for last 3 seconds
  if (state.secondsRemaining <= 3 && state.secondsRemaining > 0) {
    elements.timerValue.classList.add("timer-warning");
    elements.timerValue.classList.remove("timer-running");
  } else if (state.timerRunning) {
    elements.timerValue.classList.add("timer-running");
    elements.timerValue.classList.remove("timer-warning");
  } else {
    elements.timerValue.classList.remove("timer-running", "timer-warning");
  }
}

// ============================================
// Pause/Resume UI
// ============================================

function togglePause() {
  const step = getCurrentStep();
  if (step.mode !== "timed" || !state.started) return;

  if (state.timerRunning) {
    pauseTimer();
  } else if (state.timerPaused) {
    resumeTimer();
  }
}

function updatePauseButtonState() {
  const step = getCurrentStep();
  const pauseSymbol = elements.pauseButton.querySelector(".rune-symbol");
  const pauseLabel = elements.pauseButton.parentElement.querySelector(".rune-label");

  if (state.timerPaused) {
    pauseSymbol.textContent = "▶";
    pauseLabel.textContent = "Resume";
    elements.pauseButton.classList.remove("rune-red");
    elements.pauseButton.classList.add("rune-green");
  } else {
    pauseSymbol.textContent = "⏸";
    pauseLabel.textContent = "Pause";
    elements.pauseButton.classList.remove("rune-green");
    elements.pauseButton.classList.add("rune-red");
  }

  // Disable pause button when timer not applicable
  elements.pauseButton.disabled = step.mode !== "timed" || !state.started || (!state.timerRunning && !state.timerPaused);
}

// ============================================
// Rendering
// ============================================

function renderCheckpointRow() {
  elements.checkpointRow.innerHTML = "";

  activeRoutine.forEach((_, index) => {
    // Add connector before each checkpoint (except first)
    if (index > 0) {
      const connector = document.createElement("div");
      connector.className = "checkpoint-connector";
      if (completedSteps.has(index - 1)) {
        connector.classList.add("is-done");
      }
      elements.checkpointRow.appendChild(connector);
    }

    const circle = document.createElement("div");
    circle.className = "checkpoint-circle";

    if (completedSteps.has(index)) {
      circle.classList.add("is-done");
    }

    if (index === state.currentStepIndex) {
      circle.classList.add("is-current");
    }

    const span = document.createElement("span");
    span.textContent = String(index + 1);
    circle.appendChild(span);

    elements.checkpointRow.appendChild(circle);
  });
}

function renderPath() {
  elements.checkpointPath.innerHTML = "";

  activeRoutine.forEach((_, index) => {
    const checkpoint = document.createElement("li");
    checkpoint.className = "checkpoint";
    checkpoint.textContent = String(index + 1);

    if (completedSteps.has(index)) {
      checkpoint.classList.add("is-done");
    }

    if (index === state.currentStepIndex) {
      checkpoint.classList.add("is-current");
    }

    elements.checkpointPath.appendChild(checkpoint);
  });
}

function render() {
  const step = activeRoutine[state.currentStepIndex];

  // Update progress label
  elements.progressLabel.textContent = `Checkpoint ${state.currentStepIndex + 1} of ${activeRoutine.length}`;
  const percent = Math.round((completedSteps.size / activeRoutine.length) * 100);
  elements.progressLabel.textContent += ` (${percent}%)`;
  elements.progressFill.style.width = `${percent}%`;

  // Update exercise info
  elements.typeBadge.textContent = step.type;
  elements.typeBadge.className = `badge ${typeClassMap[step.type] || ""}`.trim();
  elements.exerciseName.textContent = step.name;
  elements.exercisePurpose.textContent = step.purpose || "";
  elements.exerciseInstructions.textContent = step.instructions || "";
  if (step.image) {
    elements.exerciseImage.src = step.image;
    elements.exerciseImage.alt = step.name;
  }

  // Update set status (hidden but kept for compatibility)
  elements.setStatus.textContent = `Set ${state.currentSetIndex + 1} of ${step.sets}`;

  // Update set badge (side info shown via L/R runes)
  let setBadgeText = `Set ${state.currentSetIndex + 1} of ${step.sets}`;
  elements.setBadge.textContent = setBadgeText;

  // Update side indicator - toggle show-sides class for L/R runes visibility
  if (step.perSide) {
    elements.sideVisuals.classList.add("show-sides");
    elements.sideIndicator.hidden = false;
    elements.sideIndicator.textContent = state.currentSide || "Right";

    // Update visual runes
    if (state.currentSide === "Right") {
      elements.runeRight.classList.add("active-side");
      elements.runeLeft.classList.remove("active-side");
    } else {
      elements.runeLeft.classList.add("active-side");
      elements.runeRight.classList.remove("active-side");
    }
  } else {
    elements.sideVisuals.classList.remove("show-sides");
    elements.sideIndicator.hidden = true;
    elements.runeLeft.classList.remove("active-side");
    elements.runeRight.classList.remove("active-side");
  }

  // Update timer/reps display
  const metric = getMetricForStep(step);

  if (metric.type === "reps" || metric.type === "steps") {
    // Show rep/step counter format: "15" (just the total)
    elements.timerValue.textContent = metric.value;
    elements.timerLabel.textContent = metric.label;
  } else if (step.mode === "timed" && state.started && state.secondsRemaining > 0) {
    // Show live countdown for timed exercises
    elements.timerValue.textContent = formatTime(state.secondsRemaining);
    elements.timerLabel.textContent = metric.label;
  } else {
    elements.timerValue.textContent = metric.value;
    elements.timerLabel.textContent = metric.label;
  }

  // Update primary action button text based on mode and state
  if (!state.started) {
    elements.primaryAction.textContent = "Start";
    elements.primaryAction.disabled = false;
  } else if (step.mode === "timed") {
    if (state.timerRunning) {
      elements.primaryAction.textContent = "Pause Timer";
      elements.primaryAction.disabled = false;
    } else if (state.timerPaused) {
      elements.primaryAction.textContent = "Resume Timer";
      elements.primaryAction.disabled = false;
    } else if (state.timerCountingDown) {
      elements.primaryAction.textContent = "Starting...";
      elements.primaryAction.disabled = true;
    } else {
      elements.primaryAction.textContent = "Start Timer";
      elements.primaryAction.disabled = false;
    }
  } else if (step.perSide) {
    elements.primaryAction.textContent = `Done: ${state.currentSide}`;
    elements.primaryAction.disabled = false;
  } else {
    elements.primaryAction.textContent = "Complete Set";
    elements.primaryAction.disabled = false;
  }

  // Update navigation button states
  const atBeginning = isAtBeginning();
  const atEnd = state.currentStepIndex === activeRoutine.length - 1;

  elements.backButton.disabled = atBeginning;
  elements.skipButton.disabled = atEnd;
  elements.backButtonNav.disabled = atBeginning;
  elements.skipButtonNav.disabled = atEnd;

  // Update pause button state
  updatePauseButtonState();

  // Render checkpoint visualizations
  renderCheckpointRow();
  renderPath();

  // Auto-save session after each render
  saveSession();
}

// ============================================
// Navigation Logic
// ============================================

function isAtBeginning() {
  return (
    state.currentStepIndex === 0 &&
    state.currentSetIndex === 0 &&
    (!activeRoutine[0].perSide || state.currentSide === "Right")
  );
}

function isAtEnd() {
  const lastStep = activeRoutine[activeRoutine.length - 1];
  return (
    state.currentStepIndex === activeRoutine.length - 1 &&
    state.currentSetIndex === lastStep.sets - 1 &&
    (!lastStep.perSide || state.currentSide === "Left")
  );
}

function getCurrentStep() {
  return activeRoutine[state.currentStepIndex];
}

// Check if rest overlay should show (Strength exercises only)
function shouldShowRestOverlay(step, isEndOfSet, isEndOfExercise) {
  if (step.type !== "Strength") {
    return false;
  }
  return isEndOfSet || isEndOfExercise;
}

// Show rest overlay with appropriate message
function showRestOverlay(nextMessage) {
  elements.restNext.textContent = nextMessage;
  elements.restOverlay.classList.remove("hidden");
  elements.restOverlay.setAttribute("aria-hidden", "false");
}

// Hide rest overlay
function hideRestOverlay() {
  elements.restOverlay.classList.add("hidden");
  elements.restOverlay.setAttribute("aria-hidden", "true");
}

// ============================================
// Daily Celebration Overlay
// ============================================

let celebrationVisible = false;
let celebrationOnClose = null;
let celebrationTimeoutId = null;

function shouldShowDayCelebration() {
  if (!CELEBRATION_CONFIG.enabled) return false;
  const todayKey = getLocalDateKey(new Date());
  if (!matchesCelebrationDate(todayKey)) return false;
  if (!CELEBRATION_CONFIG.showOncePerDay) return true;

  const lastSeen = localStorage.getItem(CELEBRATION_STORAGE_KEY);
  return lastSeen !== todayKey;
}

function markCelebrationSeen(dateKey) {
  if (!CELEBRATION_CONFIG.showOncePerDay) return;
  try {
    localStorage.setItem(CELEBRATION_STORAGE_KEY, dateKey);
  } catch (e) {
    console.warn('Failed to persist celebration state:', e);
  }
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function addCelebrationItem(target, className, options = {}) {
  const item = document.createElement("span");
  item.className = `celebration-item ${className}`.trim();

  const size = options.size || randomBetween(24, 52);
  const drift = options.drift ?? randomBetween(-70, 70);
  const driftEnd = options.driftEnd ?? -drift;
  const spin = options.spin ?? randomBetween(180, 720);
  const opacity = options.opacity ?? randomBetween(0.55, 0.9);
  const duration = options.duration || randomBetween(6.5, 11);
  const delay = options.delay || randomBetween(0, 1.6);
  const yPos = options.yPos || `${randomBetween(8, 85)}%`;

  item.style.setProperty("--size", `${size}px`);
  item.style.setProperty("--y", yPos);
  item.style.setProperty("--delay", `${delay}s`);
  item.style.setProperty("--duration", `${duration}s`);
  item.style.setProperty("--drift", `${drift}px`);
  item.style.setProperty("--drift-end", `${driftEnd}px`);
  item.style.setProperty("--spin", `${spin}deg`);
  item.style.setProperty("--opacity", opacity.toFixed(2));

  if (options.backgroundImage) {
    item.style.backgroundImage = `url('${options.backgroundImage}')`;
  }

  if (options.balloonColor) {
    item.style.setProperty("--balloon-color", options.balloonColor);
  }

  target.appendChild(item);
}

function buildCelebrationStream() {
  if (!elements.dailyStream) return;
  elements.dailyStream.textContent = "";

  const confettiCount = Math.max(0, CELEBRATION_CONFIG.confettiCount || 0);
  const balloonCount = Math.max(0, CELEBRATION_CONFIG.balloonCount || 0);
  const spiritCount = Math.max(0, CELEBRATION_CONFIG.spiritCount || 0);

  for (let i = 0; i < confettiCount; i++) {
    const asset = CELEBRATION_ASSETS[Math.floor(Math.random() * CELEBRATION_ASSETS.length)];
    addCelebrationItem(elements.dailyStream, "celebration-confetti", {
      backgroundImage: asset,
      size: randomBetween(22, 40),
      yPos: `${randomBetween(5, 92)}%`,
      duration: randomBetween(6, 10),
      drift: randomBetween(-90, 90),
      spin: randomBetween(180, 820),
      opacity: randomBetween(0.55, 0.95),
    });
  }

  const balloonColors = ["#ffd089", "#cba135", "#7db8d6", "#a2d3b0", "#c78b62"];
  for (let i = 0; i < balloonCount; i++) {
    addCelebrationItem(elements.dailyStream, "celebration-balloon", {
      size: randomBetween(44, 72),
      yPos: `${randomBetween(18, 78)}%`,
      duration: randomBetween(8, 12.5),
      drift: randomBetween(-40, 40),
      driftEnd: randomBetween(-40, 40),
      spin: randomBetween(-15, 15),
      balloonColor: balloonColors[i % balloonColors.length],
      opacity: randomBetween(0.7, 1),
    });
  }

  for (let i = 0; i < spiritCount; i++) {
    addCelebrationItem(elements.dailyStream, "celebration-spirit", {
      size: randomBetween(160, 240),
      yPos: `${randomBetween(8, 60)}%`,
      duration: randomBetween(10, 14),
      drift: randomBetween(-30, 30),
      driftEnd: randomBetween(-30, 30),
      spin: randomBetween(-5, 5),
      opacity: randomBetween(0.4, 0.7),
    });
  }
}

function showDayCelebration(onClose) {
  if (!elements.dailyAnimationOverlay || celebrationVisible) return false;

  const today = new Date();
  const dayName = getLocalDayName(today);
  const displayName = CELEBRATION_CONFIG.name || "Friend";

  if (elements.dailyMessage) {
    elements.dailyMessage.textContent = `Happy ${dayName} ${displayName}!`;
  }

  buildCelebrationStream();
  markCelebrationSeen(getLocalDateKey(today));

  celebrationVisible = true;
  celebrationOnClose = onClose || null;

  elements.dailyAnimationOverlay.classList.remove("hidden");
  elements.dailyAnimationOverlay.setAttribute("aria-hidden", "false");

  if (celebrationTimeoutId) {
    clearTimeout(celebrationTimeoutId);
  }
  const durationMs = Math.max(1200, CELEBRATION_CONFIG.durationMs || 4000);
  celebrationTimeoutId = setTimeout(hideDayCelebration, durationMs);
  return true;
}

function hideDayCelebration() {
  if (!elements.dailyAnimationOverlay || !celebrationVisible) return;

  if (celebrationTimeoutId) {
    clearTimeout(celebrationTimeoutId);
    celebrationTimeoutId = null;
  }
  elements.dailyAnimationOverlay.classList.add("hidden");
  elements.dailyAnimationOverlay.setAttribute("aria-hidden", "true");

  celebrationVisible = false;

  if (celebrationOnClose) {
    const onClose = celebrationOnClose;
    celebrationOnClose = null;
    onClose();
  }
}

// ============================================
// End Screen
// ============================================

function playCelebrationSound() {
  if (!audioContext) return;

  // Play a rising arpeggio for celebration
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = freq;
    oscillator.type = "sine";

    const startTime = audioContext.currentTime + (i * 0.15);
    gainNode.gain.setValueAtTime(0.3, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.3);
  });
}

function showEndScreen() {
  state.routineEndTime = Date.now();

  // Calculate total time
  const totalSeconds = Math.floor((state.routineEndTime - state.routineStartTime) / 1000);
  elements.totalTimeValue.textContent = formatTime(totalSeconds);
  elements.exercisesCompleted.textContent = activeRoutine.length;

  // Motivation Update
  const result = completeSessionMotivation(activeRoutine.length);

  // Render Rewards
  elements.rewardContainer.innerHTML = '';

  // 1. Sticker
  if (result.newSticker) {
    const stickerDiv = document.createElement('div');
    stickerDiv.className = 'reward-sticker';
    stickerDiv.innerHTML = `<img src="assets/stickers/${result.newSticker}.png" alt="New Sticker" onerror="this.style.display='none'">`;
    elements.rewardContainer.appendChild(stickerDiv);
  }

  // 2. Badges
  if (result.newBadges.length > 0) {
    const badgeMsg = document.createElement('div');
    badgeMsg.className = 'new-badges-msg';
    badgeMsg.textContent = 'New Badges Unlocked!';
    elements.rewardContainer.appendChild(badgeMsg);

    const badgesRow = document.createElement('div');
    badgesRow.className = 'new-badges-row';
    result.newBadges.forEach(badge => {
      const b = document.createElement('div');
      b.className = 'new-badge';
      b.innerHTML = `<img src="${badge.icon}" alt="${badge.name}" onerror="this.src='assets/rune_stone.png'"><p>${badge.name}</p>`;
      badgesRow.appendChild(b);
    });
    elements.rewardContainer.appendChild(badgesRow);
  }

  // 3. Stats update line
  const statsLine = document.createElement('p');
  statsLine.className = 'stats-summary';
  statsLine.innerHTML = `Total Sessions: <strong>${result.totalSessions}</strong> • Streak: <strong>${result.streak} 🔥</strong>`;
  elements.rewardContainer.appendChild(statsLine);

  // Show the overlay
  elements.endOverlay.classList.remove("hidden");
  elements.endOverlay.setAttribute("aria-hidden", "false");
}

function hideEndScreen() {
  elements.endOverlay.classList.add("hidden");
  elements.endOverlay.setAttribute("aria-hidden", "true");
}

// Advance to the next unit (side, set, or step)
function advanceUnit() {
  const step = getCurrentStep();

  // Per-leg: advance from Right to Left
  if (step.perSide && state.currentSide === "Right") {
    state.currentSide = "Left";
    state.currentRep = 0;
    render();
    return;
  }

  // Determine if this is end of set or end of exercise
  const isEndOfSet = state.currentSetIndex < step.sets - 1;
  const isEndOfExercise = state.currentSetIndex === step.sets - 1;

  // End of set: advance to next set or next step
  if (isEndOfSet) {
    // Check for rest overlay (Strength only)
    if (shouldShowRestOverlay(step, true, false)) {
      showRestOverlay(`Up next: Set ${state.currentSetIndex + 2}`);
      return;
    }

    state.currentSetIndex++;
    state.currentSide = step.perSide ? "Right" : null;
    state.currentRep = 0;
    render();

    // Start timer for next set (non-Strength timed exercises)
    if (step.mode === "timed") {
      initializeTimer();
      startTimer();
    }
    return;
  }

  // Completed all sets for this step
  completedSteps.add(state.currentStepIndex);

  // Move to next step if available
  if (state.currentStepIndex < activeRoutine.length - 1) {
    // Check for rest overlay before moving to next exercise (Strength only)
    if (shouldShowRestOverlay(step, false, true)) {
      const nextStep = activeRoutine[state.currentStepIndex + 1];
      showRestOverlay(`Up next: ${nextStep.name}`);
      return;
    }

    state.currentStepIndex++;
    state.currentSetIndex = 0;
    const nextStep = getCurrentStep();
    state.currentSide = nextStep.perSide ? "Right" : null;
    state.currentRep = 0;
    render();

    // Start timer for next exercise if timed
    if (nextStep.mode === "timed") {
      initializeTimer();
      startTimer();
    }
    return;
  }

  // All done - routine complete
  showEndScreen();
}

// Continue after rest overlay
function continueAfterRest() {
  hideRestOverlay();

  const step = getCurrentStep();

  // If we haven't completed all sets, go to next set
  if (state.currentSetIndex < step.sets - 1) {
    state.currentSetIndex++;
    state.currentSide = step.perSide ? "Right" : null;
    state.currentRep = 0;
    render();

    // Start timer if timed exercise
    if (step.mode === "timed") {
      initializeTimer();
      startTimer();
    }
    return;
  }

  // Otherwise, move to next step
  if (state.currentStepIndex < activeRoutine.length - 1) {
    state.currentStepIndex++;
    state.currentSetIndex = 0;
    const nextStep = getCurrentStep();
    state.currentSide = nextStep.perSide ? "Right" : null;
    state.currentRep = 0;
    render();

    // Start timer if next exercise is timed
    if (nextStep.mode === "timed") {
      initializeTimer();
      startTimer();
    }
  }
}

// Go back to the previous unit (side, set, or step)
function goBack() {
  if (isAtBeginning()) {
    return;
  }

  stopTimer();
  const step = getCurrentStep();

  // Per-leg: go from Left back to Right
  if (step.perSide && state.currentSide === "Left") {
    state.currentSide = "Right";
    state.currentRep = 0;
    render();
    return;
  }

  // Beginning of step: go to previous step's last set/side
  if (state.currentSetIndex === 0) {
    // Remove current step from completed if we're going back
    completedSteps.delete(state.currentStepIndex);

    state.currentStepIndex--;
    const prevStep = getCurrentStep();
    state.currentSetIndex = prevStep.sets - 1;
    state.currentSide = prevStep.perSide ? "Left" : null;
    state.currentRep = 0;

    // Also remove previous step from completed since we're re-entering it
    completedSteps.delete(state.currentStepIndex);

    render();
    return;
  }

  // Go to previous set
  state.currentSetIndex--;
  state.currentSide = step.perSide ? "Left" : null;
  state.currentRep = 0;
  render();
}

// Skip to next step (marks current step complete)
function skip() {
  stopTimer();
  const step = getCurrentStep();

  // Mark current step as complete
  completedSteps.add(state.currentStepIndex);

  // Check for rest overlay (Strength exercises only)
  if (step.type === "Strength" && state.currentStepIndex < activeRoutine.length - 1) {
    const nextStep = activeRoutine[state.currentStepIndex + 1];
    showRestOverlay(`Up next: ${nextStep.name}`);
    // State will be updated when ready button is clicked
    state.currentSetIndex = step.sets - 1; // Mark as if at end of exercise
    return;
  }

  // Move to next step if available
  if (state.currentStepIndex < activeRoutine.length - 1) {
    state.currentStepIndex++;
    state.currentSetIndex = 0;
    const nextStep = getCurrentStep();
    state.currentSide = nextStep.perSide ? "Right" : null;
    state.currentRep = 0;

    // Initialize timer for next exercise if timed (but don't start it)
    if (nextStep.mode === "timed") {
      initializeTimer();
    }
  }

  render();
}

// Restart the entire routine
function restart() {
  stopTimer();
  hideEndScreen();

  if (!confirm("Restart the entire routine? All progress will be lost.")) {
    return;
  }

  resetRoutine();
}

// Reset routine state (shared by restart and restartFromEndScreen)
function resetRoutine() {
  state.currentStepIndex = 0;
  state.currentSetIndex = 0;
  state.currentSide = activeRoutine[0].perSide ? "Right" : null;
  state.started = false;
  state.currentRep = 0;
  state.routineStartTime = null;
  state.routineEndTime = null;
  completedSteps.clear();
  clearSession(); // Clear saved session data
  hideRestOverlay();
  render();
}

// Restart from end screen (no confirmation needed)
function restartFromEndScreen() {
  stopTimer();
  hideEndScreen();
  resetRoutine();
}

function beginWorkout() {
  if (state.started) return;

  const step = getCurrentStep();
  state.started = true;
  state.routineStartTime = Date.now(); // Track when routine started
  audioManager.init(); // Initialize audio on first user interaction

  if (step.mode === "timed") {
    initializeTimer();
    startCountdown(() => {
      startTimer();
    });
  } else {
    audioManager.playCue('beep');
  }
  render();
}

function tryStartWorkout() {
  if (shouldShowDayCelebration()) {
    const shown = showDayCelebration(beginWorkout);
    if (shown) return;
  }
  beginWorkout();
}

// Handle primary action button click
function handlePrimaryAction() {
  const step = getCurrentStep();

  if (!state.started) {
    tryStartWorkout();
    return;
  }

  // For timed exercises
  if (step.mode === "timed") {
    // Timer is running or paused - skip to completion
    // Timer is running or paused - toggle pause
    if (state.timerRunning || state.timerPaused) {
      togglePause();
      return;
    }
    // Timer not started (e.g., after going back) - start it
    initializeTimer();
    startCountdown(() => {
      startTimer();
    });
    render();
    return;
  }

  // For reps/steps, this completes the current side or set
  advanceUnit();
}

// ============================================
// Event Listeners
// ============================================

elements.primaryAction.addEventListener("click", handlePrimaryAction);
elements.pauseButton.addEventListener("click", togglePause);
elements.backButton.addEventListener("click", goBack);
elements.skipButton.addEventListener("click", skip);
elements.backButtonNav.addEventListener("click", goBack);
elements.skipButtonNav.addEventListener("click", skip);
elements.restartButton.addEventListener("click", restart);
elements.restartFromEnd.addEventListener("click", restart);
elements.closeEndScreen.addEventListener("click", hideEndScreen);
elements.readyButton.addEventListener("click", continueAfterRest);
if (elements.dailyAnimationOverlay) {
  elements.dailyAnimationOverlay.addEventListener("click", () => {
    hideDayCelebration();
  });
}

// Resume session overlay handlers
function showResumeOverlay() {
  elements.resumeOverlay.classList.remove("hidden");
  elements.resumeOverlay.setAttribute("aria-hidden", "false");
}

function hideResumeOverlay() {
  elements.resumeOverlay.classList.add("hidden");
  elements.resumeOverlay.setAttribute("aria-hidden", "true");
}

elements.resumeSessionBtn.addEventListener("click", () => {
  const savedData = loadSession();
  if (savedData) {
    restoreSession(savedData);
    audioManager.init(); // Initialize audio context
  }
  hideResumeOverlay();
  render();
});

elements.startFreshBtn.addEventListener("click", () => {
  clearSession();
  hideResumeOverlay();
  showWorkoutLengthOverlay();
});

// ============================================
// Workout Length Selection
// ============================================

function showWorkoutLengthOverlay() {
  elements.workoutLengthOverlay.classList.remove("hidden");
  elements.workoutLengthOverlay.setAttribute("aria-hidden", "false");
}

function hideWorkoutLengthOverlay() {
  elements.workoutLengthOverlay.classList.add("hidden");
  elements.workoutLengthOverlay.setAttribute("aria-hidden", "true");
}

function selectWorkoutLength(length) {
  workoutLength = length;
  initActiveRoutine();

  // Reset state for new workout
  state.currentStepIndex = 0;
  state.currentSetIndex = 0;
  state.currentSide = activeRoutine[0].perSide ? "Right" : null;

  hideWorkoutLengthOverlay();
  render();
}

elements.shortWorkoutBtn.addEventListener("click", () => {
  selectWorkoutLength('short');
});

elements.longWorkoutBtn.addEventListener("click", () => {
  selectWorkoutLength('long');
});

// ============================================
// Initialization
// ============================================

// Check for saved session on load
if (hasSavedSession()) {
  showResumeOverlay();
} else {
  // Show workout length selection for fresh start
  showWorkoutLengthOverlay();
}

// ============================================
// Service Worker & PWA Support
// ============================================

let swRegistration = null;
let waitingServiceWorker = null;

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      swRegistration = await navigator.serviceWorker.register('./sw.js');
      console.log('[PWA] Service worker registered:', swRegistration.scope);

      // Check for updates on page load
      swRegistration.addEventListener('updatefound', () => {
        const newWorker = swRegistration.installing;
        console.log('[PWA] New service worker installing');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            waitingServiceWorker = newWorker;
            showUpdateBanner();
            console.log('[PWA] Update available');
          }
        });
      });

      // Handle controller change (when skipWaiting is called)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Controller changed, reloading...');
        window.location.reload();
      });

    } catch (error) {
      console.error('[PWA] Service worker registration failed:', error);
    }
  });
}

// Listen for messages from service worker
navigator.serviceWorker?.addEventListener('message', (event) => {
  if (event.data?.type === 'UPDATE_AVAILABLE') {
    showUpdateBanner();
  }
});

// Audio Listeners
if (elements.musicToggleBtn) {
  elements.musicToggleBtn.addEventListener('click', () => audioManager.toggleMusic());
}
if (elements.skipTrackBtn) {
  elements.skipTrackBtn.addEventListener('click', () => audioManager.nextTrack());
}

// Initial UI Audio State
audioManager.updateUI();

// ============================================
// Online/Offline Indicator
// ============================================

const connectionIndicator = document.getElementById('connectionIndicator');
const indicatorDot = connectionIndicator?.querySelector('.indicator-dot');
const indicatorText = connectionIndicator?.querySelector('.indicator-text');

function updateConnectionStatus() {
  const isOnline = navigator.onLine;

  if (connectionIndicator) {
    connectionIndicator.classList.toggle('offline', !isOnline);
    indicatorText.textContent = isOnline ? 'Online' : 'Offline';
  }
}

// Initial status
updateConnectionStatus();

// Listen for online/offline events
window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);

// ============================================
// Update Banner
// ============================================

const updateBanner = document.getElementById('updateBanner');
const updateBtn = document.getElementById('updateBtn');
const dismissUpdate = document.getElementById('dismissUpdate');

function showUpdateBanner() {
  if (updateBanner) {
    updateBanner.classList.remove('hidden');
  }
}

function hideUpdateBanner() {
  if (updateBanner) {
    updateBanner.classList.add('hidden');
  }
}

// Apply update and reload
updateBtn?.addEventListener('click', () => {
  if (waitingServiceWorker) {
    waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
  }
  hideUpdateBanner();
});

// Dismiss banner (update will apply on next session)
dismissUpdate?.addEventListener('click', () => {
  hideUpdateBanner();
});

// ============================================
// Daily Animation Logic
// ============================================

const SPECIAL_ANIMATION_DATE = "2026-01-22"; // YYYY-MM-DD

function checkAndShowDailyAnimation() {
  const overlay = document.getElementById('dailyAnimationOverlay');
  if (!overlay) return;

  const today = getTodayString();

  // 1. Check Date
  if (today !== SPECIAL_ANIMATION_DATE) {
    return;
  }

  // 2. Check if already seen today
  const seenKey = 'wolfwalkers_anim_seen_' + today;
  if (localStorage.getItem(seenKey) === 'true') {
    return;
  }

  // 3. Prepare Message
  const dateObj = new Date();
  const options = { weekday: 'long' };
  const dayName = new Intl.DateTimeFormat('en-US', options).format(dateObj);

  const msgElement = document.getElementById('dailyMessage');
  if (msgElement) {
    msgElement.innerHTML = `Happy ${dayName} <br> Dalia!`;
  }

  // 4. Show Overlay
  overlay.classList.remove('hidden');

  // 5. Play Audio (Reuse celebration or Cue)
  // setTimeout(() => audioManager.playCue('beep'), 500); // Optional

  // 6. Start Particle Animation
  startConfettiAnimation();

  // 7. Auto-Dismiss and Save
  const DISMISS_TIME = 6000; // 6 seconds

  // Allow click to dismiss early
  overlay.addEventListener('click', () => {
    dismissDailyAnimation(overlay, seenKey);
  }, { once: true });

  setTimeout(() => {
    if (!overlay.classList.contains('hidden')) {
      dismissDailyAnimation(overlay, seenKey);
    }
  }, DISMISS_TIME);
}

function dismissDailyAnimation(overlay, key) {
  overlay.style.opacity = '0';
  setTimeout(() => {
    overlay.classList.add('hidden');
    overlay.style.opacity = ''; // Reset for next time (though next time is next year probably)
    stopConfettiAnimation();
  }, 1000);
  localStorage.setItem(key, 'true');
}

// Confetti System
let confettiInterval;
const CONFETTI_COLORS = ['#ffd700', '#00e5ff', '#ff1744', '#ffffff', '#76ff03'];

function startConfettiAnimation() {
  const overlay = document.getElementById('dailyAnimationOverlay');
  if (!overlay) return;

  // Burst initially
  for (let i = 0; i < 30; i++) spawnConfetti(overlay);

  // Continuous rain
  confettiInterval = setInterval(() => {
    spawnConfetti(overlay);
  }, 100);
}

function stopConfettiAnimation() {
  if (confettiInterval) clearInterval(confettiInterval);
  // Cleanup DOM particles
  const overlay = document.getElementById('dailyAnimationOverlay');
  if (overlay) {
    const particles = overlay.querySelectorAll('.confetti');
    particles.forEach(p => p.remove());
  }
}

function spawnConfetti(container) {
  const el = document.createElement('div');
  el.classList.add('confetti');

  // Random Properties
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const left = Math.random() * 100; // %
  const duration = 3 + Math.random() * 4; // 3-7s
  const size = 10 + Math.random() * 15; // 10-25px

  // Random Shape
  const type = Math.random();

  el.style.left = left + '%';
  el.style.width = size + 'px';
  el.style.height = size + 'px';
  el.style.backgroundColor = color;
  el.style.animationDuration = duration + 's';

  if (type < 0.33) {
    // Circle (Spirit)
    el.style.borderRadius = '50%';
    el.style.boxShadow = `0 0 10px ${color}`;
  } else if (type < 0.66) {
    // Leaf shape
    el.style.borderRadius = '0px 50% 0px 50%';
    el.style.transform = `rotate(${Math.random() * 360}deg)`;
  } else {
    // Square/Diamond (Rune fragment)
    el.style.transform = `rotate(${45 + Math.random() * 90}deg)`;
  }

  container.appendChild(el);

  // Remove after animation
  setTimeout(() => {
    el.remove();
  }, duration * 1000);
}

// Initialize
// Call checkAndShowDailyAnimation at end of init if possible, or just call it here as it runs on load
checkAndShowDailyAnimation();

// ============================================================
// WORD LISTS (array storage system)
// ============================================================
// Arrays grouped by difficulty tiers (levels).
// Each index corresponds to a level, enabling scalable progression.
const words1 = [
"cat","dog","sun","hat","run","cup","sky","hop","mud","ant",
"fly","bat","log","den","web","oak","dew","fog","bud","bee",
"fox","owl","pig","hen"
];

const words2 = [
"jump","frog","leaf","rain","wind","tree","bark","moss","vine","pond",
"swim","glow","buzz","hive","claw","nest","fern","dusk","mist","dawn",
"root","seed","bloom","petal","grove"
];

const words3 = [
"forest","breeze","thunder","rabbit","stream","glimmer","canopy","meadow",
"lantern","hollow","sparrow","flutter","rustle","branch","willow",
"feather","whistle","drizzle","clearing","woodland"
];

const words4 = [
"moonlight","firefly","whisper","blossom","wanderer","twilight","cascade",
"glisten","murmur","thicket","phantom","solitude","crescent","nightfall",
"starlight","midnight","shimmer","luminous","silhouette","nocturne"
];

const words5 = [
"avalanche","crystalline","frostbitten","snowbound","permafrost","glacial",
"blizzard","snowdrift","treacherous","expedition","forsaken","whiteout",
"iceberg","frostbite","snowstorm","icicle","windchill","icefield","snowpack","glaciate"
];

const words6 = [
"desolation","mirage","scorching","parched","relentless","evaporate",
"withering","blistering","suffocating","unforgiving","heatwave","dryland",
"sandstorm","drought","overheat","scalding","sunburn","wasteland","barren"
];

const words7 = [
"interstellar","gravitational","extravagance","juxtaposition",
"incomprehensible","transcendental","kaleidoscope","disenfranchised",
"extraordinary","cosmological","astronomical","dimensional","hyperspace",
"singularity","relativistic","superposition","multiverse","constellation",
"equilibrium","paradoxical"
];

const words8 = [
"antidisestablishmentarianism","pneumonoultramicroscopicsilicovolcanoconiosis",
"hippopotomonstrosesquippedaliophobia","supercalifragilisticexpialidocious",
"electroencephalography","deinstitutionalization",
"pseudopseudohypoparathyroidism","incomprehensibilities",
"floccinaucinihilipilification","electrocardiographically",
"immunohistochemistry","neuropharmacological",
"pathophysiological","counterrevolutionary"
];

// Master list allows dynamic access by level index.
const ALL_WORDS   = [words1, words2, words3, words4, words5, words6, words7, words8];

// Display names for levels (UI only, not logic-related).
const LEVEL_NAMES = [
  "Sunrise Forest","Green Canopy","Amber Dusk","Starlit Hollow",
  "Frozen Peaks","Scorched Wastes","The Void","Oblivion"
];

// XP system constants controlling progression curve.
const XP_PER_LEVEL = 200;
const MAX_LEVEL    = 8;

// ============================================================
// DOM REFERENCES
// ============================================================
// Cache DOM elements once to avoid repeated queries (performance optimization).
// Acts as the interface layer between game logic and UI.

const elMenu        = document.getElementById('menu');//el = element 
const elGame        = document.getElementById('game');
const elLvDisplay   = document.getElementById('lv-display');
const elLvDown      = document.getElementById('lv-down');
const elLvUp        = document.getElementById('lv-up');
const elArena       = document.getElementById('arena');
const elInput       = document.getElementById('word-input');
const elHudLives    = document.getElementById('hud-lives');//hud = heads up display
const elHudLevel    = document.getElementById('hud-level');
const elHudXP       = document.getElementById('hud-xp');
const elGameover    = document.getElementById('gameover');
const elBanner      = document.getElementById('levelup-banner');
const elFinalScore  = document.getElementById('final-score');
const elModalHow    = document.getElementById('modal-how');
const elModalScores = document.getElementById('modal-scores');
const elPauseScreen = document.getElementById('pause-screen');
const elPlayerName  = document.getElementById('player-name');

// ============================================================
// GAME STATE
// ============================================================
// Centralized mutable state controlling the game lifecycle.
let selectedLevel = 1;
let currentLevel, lives, totalXP, xpThisLevel;

// Timing + control flags
let spawnTimer, rafId, gameRunning, isPaused;

// Parallel arrays representing active words (lightweight ECS-style system)
// Each index corresponds to one word entity.
let wordTexts  = [];
let wordEls    = [];
let wordYs     = [];
let wordSpeeds = [];

// Prevents recent duplicates for better UX randomness
let recentWords = [];

// ============================================================
// WORD SELECTION
// ============================================================
//our for and if loop! 
// Avoids repetition using:
// 1. recentWords (short-term memory)
// 2. current active words (no duplicates on screen)
function pickWord(wordList) {
  let candidate;
  // Attempt multiple times to find a non-repeating word
  for (let attempts = 0; attempts < 10; attempts++) {
    candidate = wordList[Math.floor(Math.random() * wordList.length)];
    // Ensure uniqueness across recent + active words
    if (recentWords.indexOf(candidate) === -1 && wordTexts.indexOf(candidate) === -1) {
      recentWords.push(candidate);
      // Maintain rolling memory of last 3 words
      if (recentWords.length > 3) {
        recentWords.shift(); //FirstInFirstOut removal: removes first element if array length > 3
      }
      return candidate;
    }
  }
  // Fallback if no unique word found
  return candidate;
}

// Selects word list based on current level
function getNextWord() {
  return pickWord(ALL_WORDS[currentLevel - 1]);
}

// ============================================================
// BEST SCORES (localStorage)
// localStorage is a browser built-in that stores text strings
// permanently on the user's device — data survives page refreshes
// and browser restarts. It only stores strings, so arrays must be
// converted to/from JSON strings to be saved and read back.
// Three parallel arrays are used instead of an array of objects —
// one array per field, all kept the same length and in the same order.
// ============================================================
var scoreNames = []; // holds the player name for each score entry
var scoreXPs   = []; // holds the xp value for each score entry
var scoreDates = []; // holds the date string for each score entry

function loadScores() {
  // localStorage.getItem returns the raw stored string, or null if nothing saved yet
  var rawNames = localStorage.getItem('ddtw_names');
  var rawXPs   = localStorage.getItem('ddtw_xps');
  var rawDates = localStorage.getItem('ddtw_dates');
  // JSON.parse converts the stored string back into a JavaScript array
  // The ternary (condition ? valueIfTrue : valueIfFalse) returns an empty
  // array as a fallback if nothing has been saved yet (rawNames is null)
  scoreNames = rawNames ? JSON.parse(rawNames) : [];
  scoreXPs   = rawXPs   ? JSON.parse(rawXPs)   : [];
  scoreDates = rawDates ? JSON.parse(rawDates)  : [];
}

function saveScores() {
  // JSON.stringify converts each JavaScript array back into a string
  // so it can be stored in localStorage, which only accepts strings
  localStorage.setItem('ddtw_names', JSON.stringify(scoreNames));
  localStorage.setItem('ddtw_xps',   JSON.stringify(scoreXPs));
  localStorage.setItem('ddtw_dates', JSON.stringify(scoreDates));
}

function sortScoresByXP() {
  // Bubble sort — repeatedly steps through the arrays comparing
  // neighbouring XP values, swapping them if they are in the wrong order.
  // Descending order means higher XP values bubble to the front.
  // The outer loop tracks how many passes are needed (n-1 for n items).
  // The inner loop shrinks each pass since the last i items are already sorted.
  for (var i = 0; i < scoreXPs.length - 1; i++) {
    for (var j = 0; j < scoreXPs.length - 1 - i; j++) {
      if (scoreXPs[j] < scoreXPs[j + 1]) {
        // Swap XP — a temp variable is needed to avoid overwriting a value
        // before it has been moved. All three arrays are swapped in sync
        // at the same index to keep names, xps and dates aligned.
        var tmpXP   = scoreXPs[j];   scoreXPs[j]   = scoreXPs[j+1];   scoreXPs[j+1]   = tmpXP;
        var tmpName = scoreNames[j]; scoreNames[j] = scoreNames[j+1]; scoreNames[j+1] = tmpName;
        var tmpDate = scoreDates[j]; scoreDates[j] = scoreDates[j+1]; scoreDates[j+1] = tmpDate;
      }
    }
  }
}

function saveScore(xp) {
  loadScores(); // always read latest data from localStorage before modifying
  // push adds one new entry to the end of each parallel array in sync
  scoreNames.push(elPlayerName.value.trim() || 'Anonymous');
  scoreXPs.push(xp);
  scoreDates.push(new Date().toLocaleDateString()); // toLocaleDateString formats the date for the user's region
  sortScoresByXP(); // re-sort so highest score is always at index 0
  // Trim to top 5 — pop removes the last element from all three arrays
  // in sync until only 5 entries remain. Because the arrays are sorted
  // descending, the lowest scores are always at the end.
  while (scoreXPs.length > 5) {
    scoreNames.pop();
    scoreXPs.pop();
    scoreDates.pop();
  }
  saveScores(); // write the updated arrays back to localStorage
}

function renderScores() {
  loadScores(); // always read latest data before rendering
  var list   = document.getElementById('scores-list');
  var medals = ['🥇','🥈','🥉','4️⃣','5️⃣']; // one medal per rank position
  // Early return — if no scores exist, show a placeholder message and stop
  if (scoreXPs.length === 0) {
    list.innerHTML = '<div class="score-empty">No scores yet — play your first game!</div>';
    return;
  }
  // Build the full HTML string in one pass, then assign it once at the end.
  // Assigning innerHTML once is faster than appending elements one by one
  // because the browser only has to re-render the list a single time.
  var html = '';
  for (var i = 0; i < scoreXPs.length; i++) {
    html += '<div class="score-row">' +
      '<span class="score-rank">' + medals[i]      + '</span>' +
      '<span class="score-name">' + scoreNames[i]  + '</span>' +
      '<span class="score-xp">'   + scoreXPs[i]    + ' xp</span>' +
      '<span class="score-date">' + scoreDates[i]  + '</span>' +
    '</div>';
  }
  list.innerHTML = html; // single DOM update for the whole list
}

// Modal control (open/close behavior abstraction)
function onBtnScores() {
  renderScores();
  elModalScores.classList.add('open');
}
function onCloseScores() {
  elModalScores.classList.remove('open');
}
function onModalScoresClick(e) {
  if (e.target === elModalScores) elModalScores.classList.remove('open');
}

document.getElementById('btn-scores').addEventListener('click', onBtnScores);
document.getElementById('close-scores').addEventListener('click', onCloseScores);
elModalScores.addEventListener('click', onModalScoresClick);
document.getElementById('btn-clear-scores').addEventListener('click', onBtnClearScores);

// Clears persistent data
function onBtnClearScores() {
  // Remove all three keys from localStorage individually
  localStorage.removeItem('ddtw_names');
  localStorage.removeItem('ddtw_xps');
  localStorage.removeItem('ddtw_dates');
  // Also reset the in-memory arrays so the page reflects the cleared state
  // without needing a reload
  scoreNames = [];
  scoreXPs   = [];
  scoreDates = [];
  renderScores(); // re-render immediately to show the empty state
}

document.getElementById('btn-scores').addEventListener('click', onBtnScores);
document.getElementById('close-scores').addEventListener('click', onCloseScores);
elModalScores.addEventListener('click', onModalScoresClick);
document.getElementById('btn-clear-scores').addEventListener('click', onBtnClearScores);

// ============================================================
// BACKGROUND IMAGE
// ============================================================
// Dynamically changes theme based on level (visual progression feedback)
function setBackgroundImage(level) {
  elArena.style.backgroundImage = 'url("images/level' + level + '.jpeg")';
}

// ============================================================
// MENU — LEVEL SELECTOR
// ============================================================
// Keeps UI and constraints (min/max level) in sync
function updateLvDisplay() {
  elLvDisplay.textContent = "Level " + selectedLevel + " — " + LEVEL_NAMES[selectedLevel - 1];
  // Disable buttons at bounds
  elLvDown.disabled = (selectedLevel <= 1);//user cannot level down below level 1
  elLvUp.disabled   = (selectedLevel >= MAX_LEVEL);//user cannot level up above max level 
}

//level the player down
function onLvDown() {
  if (selectedLevel > 1) { selectedLevel--; updateLvDisplay(); }
}
//level the player up
function onLvUp() {
  if (selectedLevel < MAX_LEVEL) { selectedLevel++; updateLvDisplay(); }
}

//add event listener to both
elLvDown.addEventListener('click', onLvDown);
elLvUp.addEventListener('click', onLvUp);
updateLvDisplay();

// ============================================================
// MENU — HOW TO PLAY MODAL
// ============================================================
//add open class to modal element 
function onBtnHow() {
  elModalHow.classList.add('open');
}
//remove open class to modal element 
function onCloseHow() {
  elModalHow.classList.remove('open');
}
//on click, if the user clicks the modal element directly 
//(not the text inside), close the modal element
function onModalHowClick(e) {
  if (e.target === elModalHow) elModalHow.classList.remove('open');
}

document.getElementById('btn-how').addEventListener('click', onBtnHow);
document.getElementById('close-how').addEventListener('click', onCloseHow);
elModalHow.addEventListener('click', onModalHowClick);

// ============================================================
// START / RETRY / QUIT
// ============================================================
//adds event listeners 
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-retry').addEventListener('click', startGame);
document.getElementById('btn-menu').addEventListener('click', goMenu);
document.getElementById('btn-quit').addEventListener('click', goMenu);

//parameter for forEach methods 
function removeEl(el) {
  el.remove();
}

// Fully resets the game state (hard reset of all systems)
function startGame() {
  // UI transitions
  elMenu.style.display    = 'none';
  elGame.style.display    = 'flex';
  // Reset overlays
  elGameover.classList.remove('show');
  elBanner.classList.remove('show');
  elPauseScreen.classList.remove('show');
  // Clear all dynamic elements (words + effects)
  elArena.querySelectorAll('.word').forEach(removeEl);
  elArena.querySelectorAll('.xp-pop').forEach(removeEl);
  // Reset core state
  currentLevel  = selectedLevel;
  lives         = 3;
  totalXP       = 0;
  xpThisLevel   = 0;
  gameRunning   = true;
  isPaused      = false;
  // Reset entity arrays
  wordTexts     = [];
  wordEls       = [];
  wordYs        = [];
  wordSpeeds    = [];
  recentWords   = [];
  // Initialize systems
  setBackgroundImage(currentLevel);
  updateHUD();//HUD = heads up display; the bar at the top
  // Prepare input
  elInput.disabled = false;
  elInput.value = '';
  elInput.focus();
  // Start loops
  scheduleSpawn();
  rafId = requestAnimationFrame(gameLoop);
}

//when the user goes to the menu, pause the game 
function goMenu() {
  gameRunning = false;
  isPaused    = false;
  cancelAnimationFrame(rafId);
  clearTimeout(spawnTimer);
  elArena.querySelectorAll('.word').forEach(removeEl);
  elPauseScreen.classList.remove('show');
  elGame.style.display = 'none';
  elMenu.style.display = 'flex';
}

//if game arena is clicked and game isn't paused, make the text box editable
function onArenaClick() {
  if (!isPaused) elInput.focus();
}
elArena.addEventListener('click', onArenaClick);

// ============================================================
// PAUSE / RESUME
// ============================================================
// Stops both loops (render + spawning) --> true pause
function pauseGame() {
  if (!gameRunning || isPaused) return;
  isPaused = true;
  cancelAnimationFrame(rafId);// stop game loop
  clearTimeout(spawnTimer);// stop spawning
  elPauseScreen.classList.add('show');
}

// Restarts loops seamlessly
function resumeGame() {
  if (!isPaused) return;
  isPaused = false;
  elPauseScreen.classList.remove('show');
  scheduleSpawn();
  rafId = requestAnimationFrame(gameLoop);
  elInput.focus();
}

//pauses or unpauses game depending on if game already paused
function onBtnPause() {
  if (isPaused) { resumeGame(); } else { pauseGame(); }
}

document.getElementById('btn-pause').addEventListener('click', onBtnPause);
document.getElementById('btn-resume').addEventListener('click', resumeGame);

//if page is not visible to user and game is running and game isn't paused, pause game
function onVisibilityChange() {
  if (document.hidden && gameRunning && !isPaused) pauseGame();
}
document.addEventListener('visibilitychange', onVisibilityChange);

// ============================================================
// HUD (Heads Up Display)
// ============================================================
// Renders all player-facing stats (lives, level, XP)
function updateHUD() {
  // Visual life system (hearts)
  let hearts = '';
  for (let i = 0; i < lives; i++)  hearts += '❤️';
  for (let i = lives; i < 3; i++) hearts += '🖤';
  elHudLives.textContent = hearts;
  // Level progress scaling increases per level
  elHudLevel.textContent = 'Level ' + currentLevel + ' (' 
	+ xpThisLevel + '/' + XP_PER_LEVEL * currentLevel + ' xp)';
  elHudXP.textContent    = 'Total: ' + totalXP + ' xp';
}

// ============================================================
// SPAWNING (word spawn speed and fall speed)
// ============================================================
// Difficulty scaling through:
// 1. spawn interval (frequency)
// 2. fall speed (reaction time)
function getSpawnInterval() {
  // Faster spawns as level increases
  if (currentLevel == MAX_LEVEL) return 2800;
  return 2800 - (currentLevel - 1) * 280;
}
function getFallSpeed() {
  // Faster falling words = harder gameplay
  if (currentLevel == MAX_LEVEL) return 0.3;
  return 0.6 + (currentLevel - 1) * 0.1;
}

//called when spawninterval timer is done
function onSpawnTimer() {
  spawnWord();
  scheduleSpawn();
}

// Recurring timed spawning loop
function scheduleSpawn() {
  if (!gameRunning || isPaused) return;//crucial break to avoid infinite 
  spawnTimer = setTimeout(onSpawnTimer, getSpawnInterval());
}

// Creates a new word entity
function spawnWord() {
  if (!gameRunning || isPaused) return;
  let text = getNextWord();
  
  // Create DOM node (entity representation)
  let div  = document.createElement('div');
  div.className   = 'word';
  div.textContent = text;
  div.style.visibility = 'hidden';
  div.style.left = '0px';
  div.style.top  = '0px';
  elArena.appendChild(div);
  
  let wordWidth = div.offsetWidth;
  // Random horizontal placement within bounds
  let maxX = elArena.clientWidth - wordWidth;
  let x    = Math.random() * Math.max(0, maxX);
  div.style.left = x + 'px';
  div.style.top  = '0px';
  div.style.visibility = 'visible';
  // Register entity into parallel arrays
  wordTexts.push(text);
  wordEls.push(div);
  wordYs.push(0);
  wordSpeeds.push(getFallSpeed());
}

//value of user's window height
function getGroundY() {
  return elArena.clientHeight - 54;
}

//rebuilds arrays without the value of an index. 
//called to remove a word from the arrays
function rebuildArraysSkipping(skipIndex) {
  //initialize new arrays 
  let newTexts  = [];
  let newEls    = [];
  let newYs     = [];
  let newSpeeds = [];
  for (let i = 0; i < wordEls.length; i++) {
	//skip index would skip over this 
    if (i !== skipIndex) {
      newTexts.push(wordTexts[i]);
      newEls.push(wordEls[i]);
      newYs.push(wordYs[i]);
      newSpeeds.push(wordSpeeds[i]);
    }
  }
  //replace old arrays with new ones 
  wordTexts  = newTexts;
  wordEls    = newEls;
  wordYs     = newYs;
  wordSpeeds = newSpeeds;
}
// Runs every frame using requestAnimationFrame
function gameLoop() {
  if (!gameRunning || isPaused) return;
  let ground     = getGroundY();
  let dangerZone = ground * 0.75;
  for (let i = wordEls.length - 1; i >= 0; i--) {
    wordYs[i] += wordSpeeds[i];
    wordEls[i].style.top = wordYs[i] + 'px';//actually descending the element 
    if (wordYs[i] > dangerZone) {
      wordEls[i].classList.add('danger');
    } else {
      wordEls[i].classList.remove('danger');
    }
    if (wordYs[i] + wordEls[i].offsetHeight >= ground) {//if words hit the ground
      wordEls[i].remove();
      rebuildArraysSkipping(i);
      loseLife();
    }
  }
  rafId = requestAnimationFrame(gameLoop);
}

// ============================================================
// INPUT — Enter OR Space submits
// ============================================================
function onKeydown(e) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  let typed = elInput.value.trim().toLowerCase();
  elInput.value = '';
  if (!typed || isPaused) return;
  let found = -1;
  for (let i = 0; i < wordTexts.length; i++) {
    if (wordTexts[i].toLowerCase() === typed) { found = i; break; }
  }
  if (found !== -1) {
    let xp = calcXP(wordTexts[found]);
    totalXP     += xp;
    xpThisLevel += xp;
    showXPPop(wordEls[found], xp);
    wordEls[found].remove();
    rebuildArraysSkipping(found);
    updateHUD();
    checkLevelUp();
  }
}
elInput.addEventListener('keydown', onKeydown);

// ============================================================
// SCORING
// ============================================================
function calcXP(text) {
  return text.length * 10;
}

function removePopEl(pop) {
  pop.remove();
}

function showXPPop(el, xp) {
  let pop = document.createElement('div');
  pop.className   = 'xp-pop';
  pop.textContent = '+' + xp + ' xp';
  let r  = el.getBoundingClientRect();
  let ar = elArena.getBoundingClientRect();
  pop.style.left = (r.left - ar.left) + 'px';
  pop.style.top  = (r.top  - ar.top)  + 'px';
  elArena.appendChild(pop);
  setTimeout(removePopEl, 900, pop);
}

// ============================================================
// LIVES
// ============================================================
function loseLife() {
  lives--;
  updateHUD();
  if (lives <= 0) endGame();
}

// ============================================================
// LEVEL UP
// ============================================================
function hideBanner() {
  elBanner.classList.remove('show');
}

function checkLevelUp() {
  if (currentLevel < MAX_LEVEL && xpThisLevel >= XP_PER_LEVEL * currentLevel) {
    currentLevel++;
    xpThisLevel = 0;
    recentWords = [];
    for (let i = 0; i < wordEls.length; i++) {
      wordEls[i].remove();
    }
    wordTexts  = [];
    wordEls    = [];
    wordYs     = [];
    wordSpeeds = [];
    setBackgroundImage(currentLevel);
    updateHUD();
    elBanner.classList.add('show');
    setTimeout(hideBanner, 1400);
  }
}

// ============================================================
// GAME OVER
// ============================================================
function endGame() {
  gameRunning = false;
  cancelAnimationFrame(rafId);
  clearTimeout(spawnTimer);
  saveScore(totalXP);
  elFinalScore.textContent = 'You scored ' + totalXP + ' xp!';
  elGameover.classList.add('show');
  elInput.disabled = true;
}
// ============================================================
// WORD LISTS
// ============================================================
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
"sandstorm","arid","drought","overheat","scalding","sunburn","wasteland","barren"
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

const ALL_WORDS = [words1, words2, words3, words4, words5, words6, words7, words8];

const LEVEL_NAMES = [
"Sunrise Forest",
"Green Canopy",
"Amber Dusk",
"Starlit Hollow",
"Frozen Peaks",
"Scorched Wastes",
"The Void",
"Oblivion"
];
const XP_PER_LEVEL = 200; // XP needed to advance from one level to the next, times current level
const MAX_LEVEL    = 8;

// ============================================================
// DOM REFERENCES
// ============================================================
const elMenu        = document.getElementById('menu');
const elGame        = document.getElementById('game');
const elLvDisplay   = document.getElementById('lv-display');
const elLvDown      = document.getElementById('lv-down');
const elLvUp        = document.getElementById('lv-up');
const elArena       = document.getElementById('arena');
const elInput       = document.getElementById('word-input');
const elHudLives    = document.getElementById('hud-lives');
const elHudLevel    = document.getElementById('hud-level');
const elHudXP       = document.getElementById('hud-xp');
const elGameover    = document.getElementById('gameover');
const elFlash       = document.getElementById('flash');
const elBanner      = document.getElementById('levelup-banner');
const elFinalScore  = document.getElementById('final-score');
const elModalHow    = document.getElementById('modal-how');
const elModalScores = document.getElementById('modal-scores');
const elPauseScreen = document.getElementById('pause-screen');
const elPlayerName  = document.getElementById('player-name');

// ============================================================
// GAME STATE
// ============================================================
let selectedLevel = 1;
let currentLevel, lives, totalXP, xpThisLevel;
let spawnTimer, rafId, gameRunning, isPaused;

var wordTexts  = [];
var wordEls    = [];
var wordYs     = [];
var wordSpeeds = [];

// Per-level word queue (ensures all words used before repeating)
let wordQueue = [];

// ============================================================
// WORD QUEUE FUNCTION
// Uses an array parameter, a for loop, and an if/else statement.
// Shuffles the word list so at least 3 different words are shown before any repeats.
// ============================================================
var recentWords = [];

function pickWord(wordList) {
  var candidate;
  for (var attempts = 0; attempts < 10; attempts++) {
    candidate = wordList[Math.floor(Math.random() * wordList.length)];
    if (recentWords.indexOf(candidate) === -1 && wordTexts.indexOf(candidate) === -1) {
      recentWords.push(candidate);
      if (recentWords.length > 3) {
        recentWords.shift();//if greater than 3 elements, removes first element
      }
      return candidate;
    }
  }
  return candidate; // fallback after 10 tries
}

function getNextWord() {
  return pickWord(ALL_WORDS[currentLevel - 1]);
}

// ============================================================
// BEST SCORES (localStorage)
// ============================================================
function getScores() {
  try { return JSON.parse(localStorage.getItem('ddtw_scores')) || []; }
  catch(e) { return []; }
}

function saveScore(xp) {
  var name   = elPlayerName.value.trim() || 'Anonymous';
  var scores = getScores();
  scores.push({ name: name, xp: xp, date: new Date().toLocaleDateString() });
  scores.sort(function(a, b) { return b.xp - a.xp; });
  scores = scores.slice(0, 5);
  localStorage.setItem('ddtw_scores', JSON.stringify(scores));
}

function renderScores() {
  var list   = document.getElementById('scores-list');
  var scores = getScores();
  var medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];
  if (scores.length === 0) {
    list.innerHTML = '<div class="score-empty">No scores yet — play your first game!</div>';
    return;
  }
  list.innerHTML = scores.map(function(s, i) {
    return '<div class="score-row">' +
      '<span class="score-rank">' + medals[i] + '</span>' +
      '<span class="score-name">' + s.name + '</span>' +
      '<span class="score-xp">' + s.xp + ' xp</span>' +
      '<span class="score-date">' + s.date + '</span>' +
    '</div>';
  }).join('');
}

document.getElementById('btn-scores').addEventListener('click', function() {
  renderScores();
  elModalScores.classList.add('open');
});
document.getElementById('close-scores').addEventListener('click', function() {
  elModalScores.classList.remove('open');
});
elModalScores.addEventListener('click', function(e) {
  if (e.target === elModalScores) elModalScores.classList.remove('open');
});
document.getElementById('btn-clear-scores').addEventListener('click', function() {
  localStorage.removeItem('ddtw_scores');
  renderScores();
});

// ============================================================
// BACKGROUND IMAGE — sets per level
// Dynamically loads and sets the background image for each level.
// Images must be named level1.jpeg through level8.jpeg in images/ folder.
// Called at game start and on level up to update the background.
// ============================================================
function setBackgroundImage(level) {
  var imagePath = 'images/level' + level + '.jpeg';
  elArena.style.backgroundImage = 'url("' + imagePath + '")';
}

// ============================================================
// MENU — LEVEL SELECTOR
// ============================================================
function updateLvDisplay() {
  elLvDisplay.textContent = "Level " + selectedLevel + " — " + LEVEL_NAMES[selectedLevel - 1];
  elLvDown.disabled = (selectedLevel <= 1);
  elLvUp.disabled   = (selectedLevel >= MAX_LEVEL);
}

elLvDown.addEventListener('click', function() {
  if (selectedLevel > 1) { selectedLevel--; updateLvDisplay(); }
});
elLvUp.addEventListener('click', function() {
  if (selectedLevel < MAX_LEVEL) { selectedLevel++; updateLvDisplay(); }
});
updateLvDisplay();

// ============================================================
// MENU — HOW TO PLAY MODAL
// ============================================================
document.getElementById('btn-how').addEventListener('click', function() {
  elModalHow.classList.add('open');
});
document.getElementById('close-how').addEventListener('click', function() {
  elModalHow.classList.remove('open');
});
elModalHow.addEventListener('click', function(e) {
  if (e.target === elModalHow) elModalHow.classList.remove('open');
});

// ============================================================
// START / RETRY / QUIT
// ============================================================
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-retry').addEventListener('click', startGame);
document.getElementById('btn-menu').addEventListener('click', goMenu);
document.getElementById('btn-quit').addEventListener('click', goMenu);

function startGame() {
  elMenu.style.display    = 'none';
  elGame.style.display    = 'flex';
  elGameover.classList.remove('show');
  elBanner.classList.remove('show');
  elPauseScreen.classList.remove('show');
  // Clear leftover word elements
  elArena.querySelectorAll('.word').forEach(function(w) { w.remove(); });
  elArena.querySelectorAll('.xp-pop').forEach(function(p) { p.remove(); });
  currentLevel  = selectedLevel;
  lives         = 3;
  totalXP       = 0;
  xpThisLevel   = 0;
  wordTexts     = [];
  wordEls       = [];
  wordYs        = [];
  wordSpeeds    = [];
  recentWords   = [];
  gameRunning   = true;
  isPaused      = false;
  // Set background image for the selected level
  setBackgroundImage(currentLevel);
  updateHUD();
  elInput.value = '';
  elInput.focus();
  scheduleSpawn();
  rafId = requestAnimationFrame(gameLoop);
}

function goMenu() {
  gameRunning = false;
  isPaused    = false;
  cancelAnimationFrame(rafId);
  clearTimeout(spawnTimer);
  elArena.querySelectorAll('.word').forEach(function(w) { w.remove(); });
  elPauseScreen.classList.remove('show');
  elGame.style.display = 'none';
  elMenu.style.display = 'flex';
}

// Re-focus input on arena click (but not when paused)
elArena.addEventListener('click', function() {
  if (!isPaused) elInput.focus();
});

// ============================================================
// PAUSE / RESUME
// ============================================================
function pauseGame() {
  if (!gameRunning || isPaused) return;
  isPaused = true;
  cancelAnimationFrame(rafId);
  clearTimeout(spawnTimer);
  elPauseScreen.classList.add('show');
}

function resumeGame() {
  if (!isPaused) return;
  isPaused = false;
  elPauseScreen.classList.remove('show');
  scheduleSpawn();
  rafId = requestAnimationFrame(gameLoop);
  elInput.focus();
}

document.getElementById('btn-pause').addEventListener('click', function() {
  if (isPaused) {
    resumeGame();
  } else {
    pauseGame();
  }
});
document.getElementById('btn-resume').addEventListener('click', resumeGame);

// Auto-pause when user switches tabs / minimises window
document.addEventListener('visibilitychange', function() {
  if (document.hidden && gameRunning && !isPaused) {
    pauseGame();
  }
});

// ============================================================
// HUD
// ============================================================
function updateHUD() {
  var hearts = '';
  for (var i = 0; i < lives; i++)  hearts += '❤️';
  for (var i = lives; i < 3; i++) hearts += '🖤';
  elHudLives.textContent = hearts;
  elHudLevel.textContent = 'Level ' + currentLevel + ' (' + xpThisLevel + '/' + XP_PER_LEVEL*currentLevel + ' xp)';
  elHudXP.textContent    = 'Total: ' + totalXP + ' xp';
}

// ============================================================
// SPAWNING
// ============================================================
function getSpawnInterval() {
  if(currentLevel == MAX_LEVEL)
	return 2800;
  return 2800 - (currentLevel - 1) * 280;
}
function getFallSpeed() {
  if(currentLevel == MAX_LEVEL)
	return 0.3;
  return 0.6 + (currentLevel - 1) * 0.1;
}

function scheduleSpawn() {
  if (!gameRunning || isPaused) return;
  spawnTimer = setTimeout(function() {
    spawnWord();
    scheduleSpawn();
  }, getSpawnInterval());
}

function spawnWord() {
  if (!gameRunning || isPaused) return;
  var text = getNextWord();
  var div  = document.createElement('div');
  div.className   = 'word';
  div.textContent = text;

  div.style.visibility = 'hidden';
  div.style.left = '0px';
  div.style.top  = '0px';
  elArena.appendChild(div);

  var wordWidth = div.offsetWidth;
  var maxX = elArena.clientWidth - wordWidth;
  var x    = Math.random() * Math.max(0, maxX);

  div.style.left = x + 'px';
  div.style.top  = '0px';
  div.style.visibility = 'visible';

  wordTexts.push(text);
  wordEls.push(div);
  wordYs.push(0);
  wordSpeeds.push(getFallSpeed());
}

function getGroundY() {
  return elArena.clientHeight - 54;
}

function rebuildArraysSkipping(skipIndex) {
  var newTexts  = [];
  var newEls    = [];
  var newYs     = [];
  var newSpeeds = [];
  for (var i = 0; i < wordEls.length; i++) {
    if (i !== skipIndex) {
      newTexts.push(wordTexts[i]);
      newEls.push(wordEls[i]);
      newYs.push(wordYs[i]);
      newSpeeds.push(wordSpeeds[i]);
    }
  }
  wordTexts  = newTexts;
  wordEls    = newEls;
  wordYs     = newYs;
  wordSpeeds = newSpeeds;
}

function gameLoop() {
  if (!gameRunning || isPaused) return;
  var ground     = getGroundY();
  var dangerZone = ground * 0.75;

  for (var i = wordEls.length - 1; i >= 0; i--) {
    wordYs[i] += wordSpeeds[i];
    wordEls[i].style.top = wordYs[i] + 'px';

    if (wordYs[i] > dangerZone) {
      wordEls[i].classList.add('danger');
    } else {
      wordEls[i].classList.remove('danger');
    }

    if (wordYs[i] + wordEls[i].offsetHeight >= ground) {
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
elInput.addEventListener('keydown', function(e) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  var typed = elInput.value.trim().toLowerCase();
  elInput.value = '';
  if (!typed || isPaused) return;
  var found = -1;
  for (var i = 0; i < wordTexts.length; i++) {
    if (wordTexts[i].toLowerCase() === typed) { found = i; break; }
  }
  if (found !== -1) {
	var xp = calcXP(wordTexts[found]);    totalXP     += xp;
    xpThisLevel += xp;
    showXPPop(wordEls[found], xp);
    wordEls[found].remove();
    rebuildArraysSkipping(found);
    updateHUD();
    checkLevelUp();
  }
});

// ============================================================
// SCORING — XP based on word length only
// ============================================================
function calcXP(text) {
  return text.length * 10;
}

function showXPPop(el, xp) {
  var pop = document.createElement('div');
  pop.className   = 'xp-pop';
  pop.textContent = '+' + xp + ' xp';
  var r  = el.getBoundingClientRect();
  var ar = elArena.getBoundingClientRect();
  pop.style.left = (r.left - ar.left) + 'px';
  pop.style.top  = (r.top  - ar.top)  + 'px';
  elArena.appendChild(pop);
  setTimeout(function() { pop.remove(); }, 900);
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
// LEVEL UP — based on XP earned THIS level, not total XP
// ============================================================
function checkLevelUp() {
  if (currentLevel < MAX_LEVEL && xpThisLevel >= XP_PER_LEVEL * currentLevel) {
    currentLevel++;
    xpThisLevel = 0;
    recentWords = [];  // reset recent words for new level
    setBackgroundImage(currentLevel);
    updateHUD();
    elBanner.classList.add('show');
    doFlash('#ffd166');
    setTimeout(function() { elBanner.classList.remove('show'); }, 1400);
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
}

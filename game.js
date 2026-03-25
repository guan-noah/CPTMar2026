// ============================================================
// WORD LISTS
// ============================================================
const words1 = ["cat","dog","sun","hat","run","cup","sky","ant","fly","bat","log","oak","dew","mud","hop"];
const words2 = ["jump","frog","leaf","rain","wind","tree","bark","moss","pond","swim","buzz","nest","mist","dawn","glow"];
const words3 = ["forest","breeze","rabbit","stream","canopy","meadow","sparrow","flutter","rustle","lantern","hollow","shadow"];
const words4 = ["moonlight","firefly","whisper","blossom","twilight","cascade","murmur","thicket","crescent","nightfall","glisten"];
const words5 = ["avalanche","frostbitten","snowbound","blizzard","glacial","treacherous","expedition","permafrost","snowdrift"];
const words6 = ["scorching","parched","evaporate","blistering","withering","desolation","relentless","mirage","suffocating"];
const words7 = ["interstellar","gravitational","juxtaposition","transcendental","kaleidoscope","extraordinary","incomprehensible"];
const words8 = ["antidisestablishmentarianism","supercalifragilisticexpialidocious","electroencephalography","floccinaucinihilipilification","hippopotomonstrosesquippedaliophobia"];

const ALL_WORDS    = [words1, words2, words3, words4, words5, words6, words7, words8];
const LEVEL_NAMES  = ["Easy","Breezy","Forest","Night","Frozen","Desert","Space","Nightmare"];
const XP_PER_LEVEL = 200; // XP needed to advance from one level to the next
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
let currentLevel, lives, totalXP, xpThisLevel, activeWords;
let spawnTimer, rafId, gameRunning, isPaused;

// Per-level word queue (ensures all words used before repeating)
let wordQueue = [];

// ============================================================
// WORD QUEUE FUNCTION
// Uses an array parameter, a for loop, and an if/else statement.
// Shuffles the word list so every word appears once before any repeats.
// ============================================================
function buildWordQueue(wordList) {
  // Copy the array, skipping words already visible on screen
  var activeTexts = activeWords ? activeWords.map(function(w) { return w.text; }) : [];
  var queue = [];
  for (var i = 0; i < wordList.length; i++) {
    if (activeTexts.indexOf(wordList[i]) !== -1) {
      // Word is currently falling — leave it out of this round
    } else {
      queue.push(wordList[i]);
    }
  }

  // Safety fallback: if every word is on screen, just use the full list
  if (queue.length === 0) {
    for (var i = 0; i < wordList.length; i++) {
      queue.push(wordList[i]);
    }
  }

  // Fisher-Yates shuffle
  for (var i = queue.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = queue[i];
    queue[i] = queue[j];
    queue[j] = temp;
  }

  return queue;
}

function getNextWord() {
  // If queue is empty, rebuild it from the current level's list
  if (wordQueue.length === 0) {
    wordQueue = buildWordQueue(ALL_WORDS[currentLevel - 1]);
  }
  return wordQueue.pop();
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
  activeWords   = [];
  gameRunning   = true;
  isPaused      = false;
  wordQueue     = buildWordQueue(ALL_WORDS[currentLevel - 1]);

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
  elHudLevel.textContent = 'Level ' + currentLevel + ' (' + xpThisLevel + '/' + XP_PER_LEVEL + ' xp)';
  elHudXP.textContent    = 'Total: ' + totalXP + ' xp';
}

// ============================================================
// SPAWNING
// ============================================================
function getSpawnInterval() {
  return Math.max(800, 2800 - (currentLevel - 1) * 280);
}
function getFallSpeed() {
  return 0.6 + (currentLevel - 1) * 0.25;
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

  var maxX = elArena.clientWidth - 200;
  var x    = 30 + Math.random() * Math.max(0, maxX);
  div.style.left = x + 'px';
  div.style.top  = '0px';
  elArena.appendChild(div);

  activeWords.push({ text: text, el: div, y: 0, speed: getFallSpeed() });
}

// ============================================================
// GAME LOOP
// ============================================================
function getGroundY() {
  return elArena.clientHeight - 54;
}

function gameLoop() {
  if (!gameRunning || isPaused) return;

  var ground     = getGroundY();
  var dangerZone = ground * 0.75;

  for (var i = activeWords.length - 1; i >= 0; i--) {
    var w = activeWords[i];
    w.y += w.speed;
    w.el.style.top = w.y + 'px';

    if (w.y > dangerZone) {
      w.el.classList.add('danger');
    } else {
      w.el.classList.remove('danger');
    }

    if (w.y + w.el.offsetHeight >= ground) {
      w.el.remove();
      activeWords.splice(i, 1);
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
  for (var i = 0; i < activeWords.length; i++) {
    if (activeWords[i].text.toLowerCase() === typed) { found = i; break; }
  }

  if (found !== -1) {
    var w  = activeWords[found];
    var xp = calcXP(w);
    totalXP      += xp;
    xpThisLevel  += xp;
    showXPPop(w.el, xp);
    w.el.remove();
    activeWords.splice(found, 1);
    updateHUD();
    checkLevelUp();
  }
});

// ============================================================
// SCORING — XP based on word length only
// ============================================================
function calcXP(w) {
  return w.text.length * 10;
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
  doFlash('#e63946');
  if (lives <= 0) endGame();
}

function doFlash(color) {
  elFlash.style.background = color;
  elFlash.style.opacity    = '0.35';
  setTimeout(function() { elFlash.style.opacity = '0'; }, 300);
}

// ============================================================
// LEVEL UP — based on XP earned THIS level, not total XP
// ============================================================
function checkLevelUp() {
  if (currentLevel < MAX_LEVEL && xpThisLevel >= XP_PER_LEVEL) {
    currentLevel++;
    xpThisLevel = 0; // reset counter for next level
    wordQueue   = buildWordQueue(ALL_WORDS[currentLevel - 1]); // fresh queue for new level
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

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

const ALL_WORDS   = [words1, words2, words3, words4, words5, words6, words7, words8];
const LEVEL_NAMES = ["Easy","Breezy","Forest","Night","Frozen","Desert","Space","Nightmare"];
const XP_THRESHOLDS = [0, 200, 500, 900, 1400, 2000, 2700, 3500];
const MAX_LEVEL = 8;

// ============================================================
// DOM REFERENCES
// ============================================================
const elMenu       = document.getElementById('menu');
const elGame       = document.getElementById('game');
const elLvDisplay  = document.getElementById('lv-display');
const elLvDown     = document.getElementById('lv-down');
const elLvUp       = document.getElementById('lv-up');
const elArena      = document.getElementById('arena');
const elInput      = document.getElementById('word-input');
const elHudLives   = document.getElementById('hud-lives');
const elHudLevel   = document.getElementById('hud-level');
const elHudXP      = document.getElementById('hud-xp');
const elGameover   = document.getElementById('gameover');
const elFlash      = document.getElementById('flash');
const elBanner     = document.getElementById('levelup-banner');
const elFinalScore = document.getElementById('final-score');
const elModalHow   = document.getElementById('modal-how');

// ============================================================
// GAME STATE
// ============================================================
let selectedLevel = 1;
let currentLevel, lives, totalXP, activeWords, spawnTimer, rafId, gameRunning;

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
// MENU — MODAL
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
// START / RETRY / MENU
// ============================================================
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-retry').addEventListener('click', startGame);
document.getElementById('btn-menu').addEventListener('click', goMenu);

function startGame() {
  elMenu.style.display = 'none';
  elGame.style.display = 'flex';
  elGameover.classList.remove('show');
  elBanner.classList.remove('show');

  // Remove any leftover word elements
  var oldWords = elArena.querySelectorAll('.word');
  oldWords.forEach(function(w) { w.remove(); });
  var oldPops = elArena.querySelectorAll('.xp-pop');
  oldPops.forEach(function(p) { p.remove(); });

  currentLevel = selectedLevel;
  lives        = 3;
  totalXP      = 0;
  activeWords  = [];
  gameRunning  = true;

  updateHUD();
  elInput.value = '';
  elInput.focus();

  scheduleSpawn();
  rafId = requestAnimationFrame(gameLoop);
}

function goMenu() {
  gameRunning = false;
  cancelAnimationFrame(rafId);
  clearTimeout(spawnTimer);
  var ws = elArena.querySelectorAll('.word');
  ws.forEach(function(w) { w.remove(); });
  elGame.style.display = 'none';
  elMenu.style.display = 'flex';
}

// Re-focus input when clicking anywhere in the arena
elArena.addEventListener('click', function() { elInput.focus(); });

// ============================================================
// HUD
// ============================================================
function updateHUD() {
  var hearts = '';
  for (var i = 0; i < lives; i++)     hearts += '❤️';
  for (var i = lives; i < 3; i++)     hearts += '🖤';
  elHudLives.textContent = hearts;
  elHudLevel.textContent = 'Level ' + currentLevel;
  elHudXP.textContent    = totalXP + ' xp';
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
  if (!gameRunning) return;
  spawnTimer = setTimeout(function() {
    spawnWord();
    scheduleSpawn();
  }, getSpawnInterval());
}

function spawnWord() {
  if (!gameRunning) return;
  var list = ALL_WORDS[currentLevel - 1];
  var text = list[Math.floor(Math.random() * list.length)];

  var div = document.createElement('div');
  div.className   = 'word';
  div.textContent = text;

  // Random horizontal position
  var maxX = elArena.clientWidth - 200;
  var x = 30 + Math.random() * Math.max(0, maxX);
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
  if (!gameRunning) return;

  var ground     = getGroundY();
  var dangerZone = ground * 0.75;

  for (var i = activeWords.length - 1; i >= 0; i--) {
    var w = activeWords[i];
    w.y += w.speed;
    w.el.style.top = w.y + 'px';

    // Danger glow when close to ground
    if (w.y > dangerZone) {
      w.el.classList.add('danger');
    } else {
      w.el.classList.remove('danger');
    }

    // Reached the ground
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
  e.preventDefault(); // stop space from doing anything else

  var typed = elInput.value.trim().toLowerCase();
  elInput.value = '';
  if (!typed) return;

  var found = -1;
  for (var i = 0; i < activeWords.length; i++) {
    if (activeWords[i].text.toLowerCase() === typed) { found = i; break; }
  }

  if (found !== -1) {
    var w  = activeWords[found];
    var xp = calcXP(w);
    totalXP += xp;
    showXPPop(w.el, xp);
    w.el.remove();
    activeWords.splice(found, 1);
    updateHUD();
    checkLevelUp();
  }
});

// ============================================================
// SCORING
// ============================================================
function calcXP(w) {
  var ground    = getGroundY();
  var remaining = Math.max(0, ground - w.y);
  var bonus     = Math.floor((remaining / ground) * 10);
  return w.text.length * 10 + bonus;
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
// LEVEL UP
// ============================================================
function checkLevelUp() {
  if (currentLevel < MAX_LEVEL && totalXP >= XP_THRESHOLDS[currentLevel]) {
    currentLevel++;
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
  elFinalScore.textContent = 'You scored ' + totalXP + ' xp!';
  elGameover.classList.add('show');
}

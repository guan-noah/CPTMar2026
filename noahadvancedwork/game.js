// ============================================================
// WORD LISTS (array storage system)
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

const ALL_WORDS   = [words1, words2, words3, words4, words5, words6, words7, words8];
const LEVEL_NAMES = [
  "Sunrise Forest","Green Canopy","Amber Dusk","Starlit Hollow",
  "Frozen Peaks","Scorched Wastes","The Void","Oblivion"
];
const XP_PER_LEVEL = 200;
const MAX_LEVEL    = 8;

// ============================================================
// DOM REFERENCES
// ============================================================
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
let selectedLevel = 1;
let currentLevel, lives, totalXP, xpThisLevel;
let spawnTimer, rafId, gameRunning, isPaused;

//word information
let wordTexts  = [];
let wordEls    = [];
let wordYs     = [];
let wordSpeeds = [];
let recentWords = [];

// ============================================================
// WORD SELECTION
// ============================================================
//our for and if loop! 
function pickWord(wordList) {
  let candidate;
  for (let attempts = 0; attempts < 10; attempts++) {
    candidate = wordList[Math.floor(Math.random() * wordList.length)];
    if (recentWords.indexOf(candidate) === -1 && wordTexts.indexOf(candidate) === -1) {
      recentWords.push(candidate);
      if (recentWords.length > 3) {
        recentWords.shift();//removes first element if array length > 3
      }
      return candidate;
    }
  }
  return candidate;
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

function compareScores(a, b) {
  return b.xp - a.xp;
}

function saveScore(xp) {
  let name   = elPlayerName.value.trim() || 'Anonymous';
  let scores = getScores();
  scores.push({ name: name, xp: xp, date: new Date().toLocaleDateString() });
  scores.sort(compareScores);
  scores = scores.slice(0, 5);
  localStorage.setItem('ddtw_scores', JSON.stringify(scores));
}

function renderScores() {
  let list   = document.getElementById('scores-list');
  let scores = getScores();
  let medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];
  if (scores.length === 0) {
    list.innerHTML = '<div class="score-empty">No scores yet — play your first game!</div>';
    return;
  }
  //dynamically adding high score
  let html = '';
  for (let i = 0; i < scores.length; i++) {
    html += '<div class="score-row">' +
      '<span class="score-rank">' + medals[i]       + '</span>' +
      '<span class="score-name">' + scores[i].name  + '</span>' +
      '<span class="score-xp">'   + scores[i].xp    + ' xp</span>' +
      '<span class="score-date">' + scores[i].date   + '</span>' +
    '</div>';
  }
  list.innerHTML = html;
}

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
function onBtnClearScores() {
  localStorage.removeItem('ddtw_scores');
  renderScores();
}

document.getElementById('btn-scores').addEventListener('click', onBtnScores);
document.getElementById('close-scores').addEventListener('click', onCloseScores);
elModalScores.addEventListener('click', onModalScoresClick);
document.getElementById('btn-clear-scores').addEventListener('click', onBtnClearScores);

// ============================================================
// BACKGROUND IMAGE
// ============================================================
function setBackgroundImage(level) {
  elArena.style.backgroundImage = 'url("../images/level' + level + '.jpeg")';
  // Background images generated by DeepAI based on the level themes, with a 
  // consistent style to create an immersive atmosphere as players progress through the game. 
  // Each image reflects the unique environment and mood of its respective level, enhancing the overall gaming experience.
}

// ============================================================
// MENU — LEVEL SELECTOR
// ============================================================
function updateLvDisplay() {
  elLvDisplay.textContent = "Level " + selectedLevel + " — " + LEVEL_NAMES[selectedLevel - 1];
  elLvDown.disabled = (selectedLevel <= 1);
  elLvUp.disabled   = (selectedLevel >= MAX_LEVEL);
}

function onLvDown() {
  if (selectedLevel > 1) { selectedLevel--; updateLvDisplay(); }
}
function onLvUp() {
  if (selectedLevel < MAX_LEVEL) { selectedLevel++; updateLvDisplay(); }
}

elLvDown.addEventListener('click', onLvDown);
elLvUp.addEventListener('click', onLvUp);
updateLvDisplay();

// ============================================================
// MENU — HOW TO PLAY MODAL
// ============================================================
function onBtnHow() {
  elModalHow.classList.add('open');
}
function onCloseHow() {
  elModalHow.classList.remove('open');
}
function onModalHowClick(e) {
  if (e.target === elModalHow) elModalHow.classList.remove('open');
}

document.getElementById('btn-how').addEventListener('click', onBtnHow);
document.getElementById('close-how').addEventListener('click', onCloseHow);
elModalHow.addEventListener('click', onModalHowClick);

// ============================================================
// START / RETRY / QUIT
// ============================================================
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-retry').addEventListener('click', startGame);
document.getElementById('btn-menu').addEventListener('click', goMenu);
document.getElementById('btn-quit').addEventListener('click', goMenu);

function removeEl(el) {
  el.remove();
}

//essentially, reset all
function startGame() {
  elMenu.style.display    = 'none';
  elGame.style.display    = 'flex';
  elGameover.classList.remove('show');
  elBanner.classList.remove('show');
  elPauseScreen.classList.remove('show');
  elArena.querySelectorAll('.word').forEach(removeEl);
  elArena.querySelectorAll('.xp-pop').forEach(removeEl);
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
  setBackgroundImage(currentLevel);
  updateHUD();//HUD = heads up display; the bar at the top
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
  elArena.querySelectorAll('.word').forEach(removeEl);
  elPauseScreen.classList.remove('show');
  elGame.style.display = 'none';
  elMenu.style.display = 'flex';
}

function onArenaClick() {
  if (!isPaused) elInput.focus();
}
elArena.addEventListener('click', onArenaClick);

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

function onBtnPause() {
  if (isPaused) { resumeGame(); } else { pauseGame(); }
}

document.getElementById('btn-pause').addEventListener('click', onBtnPause);
document.getElementById('btn-resume').addEventListener('click', resumeGame);

function onVisibilityChange() {
  if (document.hidden && gameRunning && !isPaused) pauseGame();
}
document.addEventListener('visibilitychange', onVisibilityChange);

// ============================================================
// HUD (Heads Up Display)
// ============================================================
function updateHUD() {
  let hearts = '';
  for (let i = 0; i < lives; i++)  hearts += '❤️';
  for (let i = lives; i < 3; i++) hearts += '🖤';
  elHudLives.textContent = hearts;
  elHudLevel.textContent = 'Level ' + currentLevel + ' (' 
	+ xpThisLevel + '/' + XP_PER_LEVEL * currentLevel + ' xp)';
  elHudXP.textContent    = 'Total: ' + totalXP + ' xp';
}

// ============================================================
// SPAWNING (word spawn speed and fall speed)
// ============================================================
function getSpawnInterval() {
  if (currentLevel == MAX_LEVEL) return 2800;
  return 2800 - (currentLevel - 1) * 280;
}
function getFallSpeed() {
  if (currentLevel == MAX_LEVEL) return 0.3;
  return 0.6 + (currentLevel - 1) * 0.1;
}

function onSpawnTimer() {
  spawnWord();
  scheduleSpawn();
}

function scheduleSpawn() {
  if (!gameRunning || isPaused) return;
  spawnTimer = setTimeout(onSpawnTimer, getSpawnInterval());
}

function spawnWord() {
  if (!gameRunning || isPaused) return;
  let text = getNextWord();
  
  //dynamically editing the div element 
  let div  = document.createElement('div');
  div.className   = 'word';
  div.textContent = text;
  div.style.visibility = 'hidden';
  div.style.left = '0px';
  div.style.top  = '0px';
  elArena.appendChild(div);
  
  let wordWidth = div.offsetWidth;
  let maxX = elArena.clientWidth - wordWidth;
  let x    = Math.random() * Math.max(0, maxX);
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
  let newTexts  = [];
  let newEls    = [];
  let newYs     = [];
  let newSpeeds = [];
  for (let i = 0; i < wordEls.length; i++) {
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
  let ground     = getGroundY();
  let dangerZone = ground * 0.75;
  for (let i = wordEls.length - 1; i >= 0; i--) {
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
}
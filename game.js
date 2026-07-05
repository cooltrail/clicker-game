// ═══════════════════════════════════════════════════
//  BUNNY CLICKER — game.js
// ═══════════════════════════════════════════════════

// ── Game State ──────────────────────────────────────
const state = {
  carrots: 0,
  totalEarned: 0,
  cpc: 1,           // carrots per click
  cps: 0,           // carrots per second
  rebirths: 0,
  rebirthMultiplier: 1,
};

// ── Cursor Upgrades (boost CPC) ─────────────────────
const UPGRADES = [
  { id: 'cursor',   name: '🖱️ Cursor',        cost: 15,     cpcBoost: 1,   desc: '+1 carrot/click' },
  { id: 'steel',    name: '⚙️ Steel Cursor',   cost: 500,    cpcBoost: 5,   desc: '+5 carrots/click' },
  { id: 'gold',     name: '✨ Gold Cursor',     cost: 3500,   cpcBoost: 25,  desc: '+25 carrots/click' },
  { id: 'diamond',  name: '💎 Diamond Cursor',  cost: 50000,  cpcBoost: 100, desc: '+100 carrots/click' },
];
const upgradeBought = {}; // { id: true }

// ── Buildings (auto CPS) ────────────────────────────
const BUILDINGS = [
  { id: 'auto_clicker', name: '🤖 Auto Clicker',   baseCost: 25,      cps: 0.2  },
  { id: 'auto_mine',    name: '⛏️ Auto Mine',       baseCost: 100,     cps: 1    },
  { id: 'factory',      name: '🏭 Auto Factory',    baseCost: 500,     cps: 7    },
  { id: 'lab',          name: '🔬 Carrot Lab',      baseCost: 2500,    cps: 45   },
  { id: 'temple',       name: '⛩️ Carrot Temple',   baseCost: 10000,   cps: 260  },
  { id: 'rocket',       name: '🚀 Carrot Rocket',   baseCost: 50000,   cps: 1400 },
  { id: 'timemachine',  name: '⏱️ Time Machine',    baseCost: 250000,  cps: 8000 },
  { id: 'carrotman',    name: '🥕 Carrot Man',      baseCost: 1000000, cps: 47000 },
  { id: 'carrotgod',    name: '🌌 Carrot God',      baseCost: 5000000, cps: 260000 },
];
const buildingOwned = {}; // { id: count }
BUILDINGS.forEach(b => buildingOwned[b.id] = 0);

// ── DOM refs ────────────────────────────────────────
const bunnyEl        = document.getElementById('bunny');
const carrotCountEl  = document.getElementById('carrot-count');
const cpsDisplayEl   = document.getElementById('cps-display');
const cpcDisplayEl   = document.getElementById('cpc-display');
const upgradesListEl = document.getElementById('upgrades-list');
const buildingsListEl= document.getElementById('buildings-list');
const floatiesEl     = document.getElementById('floaties');
const rebirthBtn     = document.getElementById('rebirth-btn');
const rebirthBonusEl = document.getElementById('rebirth-bonus');

// ── Helpers ──────────────────────────────────────────
function fmt(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000)         return (n / 1_000).toFixed(2) + 'K';
  return Math.floor(n).toLocaleString();
}

// Buildings get 15% more expensive per purchase
function buildingCost(building) {
  const owned = buildingOwned[building.id];
  return Math.ceil(building.baseCost * Math.pow(1.15, owned));
}

// Recalculate total CPS from all buildings
function recalcCPS() {
  let total = 0;
  BUILDINGS.forEach(b => {
    total += b.cps * buildingOwned[b.id];
  });
  state.cps = total;
}

// Recalculate CPC from upgrades + rebirth
function recalcCPC() {
  let base = 1;
  UPGRADES.forEach(u => {
    if (upgradeBought[u.id]) base += u.cpcBoost;
  });
  state.cpc = base * state.rebirthMultiplier;
}

// ── Click the Bunny ──────────────────────────────────
bunnyEl.addEventListener('click', (e) => {
  const earned = state.cpc;
  state.carrots    += earned;
  state.totalEarned+= earned;
  spawnFloatie(e, earned);
  updateUI();
});

function spawnFloatie(e, amount) {
  const el = document.createElement('div');
  el.className = 'floatie';
  el.textContent = '+' + fmt(amount) + ' 🥕';
  // position near click, relative to center div
  const rect = floatiesEl.getBoundingClientRect();
  el.style.left = (e.clientX - rect.left - 20) + 'px';
  el.style.top  = (e.clientY - rect.top  - 20) + 'px';
  floatiesEl.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

// ── Buy Building ────────────────────────────────────
function buyBuilding(id) {
  const b = BUILDINGS.find(x => x.id === id);
  const cost = buildingCost(b);
  if (state.carrots < cost) return;
  state.carrots -= cost;
  buildingOwned[id]++;
  recalcCPS();
  renderBuildings();
  updateUI();
}

// ── Buy Upgrade ─────────────────────────────────────
function buyUpgrade(id) {
  const u = UPGRADES.find(x => x.id === id);
  if (upgradeBought[id] || state.carrots < u.cost) return;
  state.carrots -= u.cost;
  upgradeBought[id] = true;
  recalcCPC();
  renderUpgrades();
  updateUI();
}

// ── Rebirth ──────────────────────────────────────────
rebirthBtn.addEventListener('click', () => {
  if (state.totalEarned < 100000) return;
  state.rebirths++;
  state.rebirthMultiplier = 1 + state.rebirths * 0.5; // +50% CPC per rebirth
  // Reset
  state.carrots = 0;
  state.totalEarned = 0;
  BUILDINGS.forEach(b => buildingOwned[b.id] = 0);
  Object.keys(upgradeBought).forEach(k => delete upgradeBought[k]);
  recalcCPS();
  recalcCPC();
  renderAll();
  updateUI();
  alert(`🌀 Reborn! You now earn x${state.rebirthMultiplier} carrots per click forever!`);
});

// ── Render ───────────────────────────────────────────
function renderUpgrades() {
  upgradesListEl.innerHTML = '';
  UPGRADES.forEach(u => {
    const btn = document.createElement('button');
    btn.className = 'upgrade-btn' + (upgradeBought[u.id] ? ' bought' : '');
    btn.disabled = upgradeBought[u.id] || state.carrots < u.cost;
    btn.innerHTML = `
      <span class="btn-name">${u.name}</span>
      <span class="btn-cost">${upgradeBought[u.id] ? '✅ Bought' : '🥕 ' + fmt(u.cost)}</span>
      <span class="btn-desc">${u.desc}</span>
    `;
    if (!upgradeBought[u.id]) btn.onclick = () => buyUpgrade(u.id);
    upgradesListEl.appendChild(btn);
  });
}

function renderBuildings() {
  buildingsListEl.innerHTML = '';
  BUILDINGS.forEach(b => {
    const cost = buildingCost(b);
    const owned = buildingOwned[b.id];
    const btn = document.createElement('button');
    btn.className = 'building-btn';
    btn.disabled = state.carrots < cost;
    btn.innerHTML = `
      <span class="btn-name">${b.name}</span>
      <span class="btn-cost">🥕 ${fmt(cost)}</span>
      <span class="btn-cps">+${b.cps}/sec each</span>
      ${owned > 0 ? `<span class="btn-owned">${owned}</span>` : ''}
    `;
    btn.onclick = () => buyBuilding(b.id);
    buildingsListEl.appendChild(btn);
  });
}

function renderAll() {
  renderUpgrades();
  renderBuildings();
}

function updateUI() {
  carrotCountEl.textContent = fmt(state.carrots) + ' 🥕';
  cpsDisplayEl.textContent  = fmt(state.cps) + ' carrots/sec';
  cpcDisplayEl.textContent  = fmt(state.cpc) + ' carrot/click';

  // Show rebirth button once player has earned enough
  if (state.totalEarned >= 100000) {
    rebirthBtn.style.display = 'block';
    rebirthBonusEl.textContent =
      `Rebirth ${state.rebirths + 1} → x${1 + (state.rebirths + 1) * 0.5} CPC forever`;
  }

  // Refresh button disabled states
  document.querySelectorAll('.building-btn').forEach((btn, i) => {
    const b = BUILDINGS[i];
    btn.disabled = state.carrots < buildingCost(b);
  });
  document.querySelectorAll('.upgrade-btn:not(.bought)').forEach((btn, i) => {
    const unbought = UPGRADES.filter(u => !upgradeBought[u.id]);
    if (unbought[i]) btn.disabled = state.carrots < unbought[i].cost;
  });
}

// ── Game Loop (20 ticks/sec) ─────────────────────────
setInterval(() => {
  const gained = (state.cps / 20) * state.rebirthMultiplier;
  state.carrots     += gained;
  state.totalEarned += gained;
  updateUI();
}, 50);

// ── Save / Load (localStorage) ───────────────────────
function saveGame() {
  const data = {
    carrots: state.carrots,
    totalEarned: state.totalEarned,
    rebirths: state.rebirths,
    rebirthMultiplier: state.rebirthMultiplier,
    upgradeBought: { ...upgradeBought },
    buildingOwned: { ...buildingOwned },
  };
  localStorage.setItem('bunnyClicker', JSON.stringify(data));
}

function loadGame() {
  const raw = localStorage.getItem('bunnyClicker');
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    state.carrots           = data.carrots || 0;
    state.totalEarned       = data.totalEarned || 0;
    state.rebirths          = data.rebirths || 0;
    state.rebirthMultiplier = data.rebirthMultiplier || 1;
    Object.assign(upgradeBought, data.upgradeBought || {});
    Object.assign(buildingOwned, data.buildingOwned || {});
    recalcCPS();
    recalcCPC();
  } catch(e) { console.warn('Save corrupted, starting fresh'); }
}

// Auto-save every 10 seconds
setInterval(saveGame, 10000);

// ── Init ─────────────────────────────────────────────
loadGame();
renderAll();
updateUI();

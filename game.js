// ═══════════════════════════════════════════════════
//  BUNNY CLICKER — game.js
// ═══════════════════════════════════════════════════

// ── Game State ──────────────────────────────────────
const state = {
  carrots: 0,
  totalEarned: 0,
  cpc: 1,
  cps: 0,
  rebirths: 0,
  multiplier: 1,
};

// ── Cursor Upgrades (boost CPC) ─────────────────────
const UPGRADES = [
  { id: 'cursor',   name: '🖱️ Cursor',        cost: 15,     cpcBoost: 1,   desc: '+1 carrot/click' },
  { id: 'steel',    name: '⚙️ Steel Cursor',   cost: 500,    cpcBoost: 5,   desc: '+5 carrots/click' },
  { id: 'gold',     name: '✨ Gold Cursor',     cost: 3500,   cpcBoost: 25,  desc: '+25 carrots/click' },
  { id: 'diamond',  name: '💎 Diamond Cursor',  cost: 50000,  cpcBoost: 100, desc: '+100 carrots/click' },
];
const upgradeCount = {}; // { id: number of times bought }
UPGRADES.forEach(u => upgradeCount[u.id] = 0);

// ── Buildings (auto CPS) ────────────────────────────
const BUILDINGS = [
  { id: 'auto_clicker',  name: '🤖 Auto Clicker',   baseCost: 25,      cps: 0.5   },
  { id: 'auto_mine',     name: '⛏️ Carrot Mine',       baseCost: 100,     cps: 2     },
  { id: 'auto_carrot',   name: '🥕 Auto Carrot',     baseCost: 250,     cps: 10    },
  { id: 'factory',       name: '🏭 Auto Factory',    baseCost: 500,     cps: 14    },
  { id: 'lab',           name: '🔬 Carrot Lab',      baseCost: 2500,    cps: 90    },
  { id: 'temple',        name: '⛩️ Carrot Temple',   baseCost: 10000,   cps: 520   },
  { id: 'rocket',        name: '🚀 Carrot Rocket',   baseCost: 50000,   cps: 2800  },
  { id: 'timemachine',   name: '⏱️ Time Machine',    baseCost: 250000,  cps: 16000 },
  { id: 'carrotman',     name: '🥕 Carrot Man',      baseCost: 1000000, cps: 94000 },
  { id: 'carrotgod',     name: '🌌 Carrot God',      baseCost: 5000000, cps: 520000 },
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

// ── Helpers ──────────────────────────────────────────
function fmt(n) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000)         return (n / 1_000).toFixed(2) + 'K';
  return Math.floor(n).toLocaleString();
}

// Buildings always cost the same
function buildingCost(building) {
  return building.baseCost;
}

// Upgrades always cost the same
function upgradeCost(upgrade) {
  return upgrade.cost;
}

// Recalculate total CPS from all buildings
function recalcCPS() {
  let total = 0;
  BUILDINGS.forEach(b => {
    total += b.cps * buildingOwned[b.id];
  });
  state.cps = total;
}

// Recalculate CPC from upgrades
function recalcCPC() {
  let base = 1;
  UPGRADES.forEach(u => {
    base += u.cpcBoost * upgradeCount[u.id];
  });
  state.cpc = base * state.multiplier;
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
  const cost = upgradeCost(u);
  if (state.carrots < cost) return;
  state.carrots -= cost;
  upgradeCount[id]++;
  recalcCPC();
  renderUpgrades();
  updateUI();
}

// ── Rebirth removed ──────────────────────────────────

// ── Rebirth ──────────────────────────────────────────
const rebirthSection = document.getElementById('rebirth-section');
const rebirthBtn     = document.getElementById('rebirth-btn');
const rebirthNextMult= document.getElementById('rebirth-next-mult');
const rebirthCountEl = document.getElementById('rebirth-count');

rebirthBtn.addEventListener('click', () => {
  if (state.carrots < 1_000_000_000_000) return;
  state.rebirths++;
  state.multiplier = 1 + state.rebirths; // x2, x3, x4...
  state.carrots = 0;
  state.totalEarned = 0;
  BUILDINGS.forEach(b => buildingOwned[b.id] = 0);
  UPGRADES.forEach(u => upgradeCount[u.id] = 0);
  recalcCPS();
  recalcCPC();
  renderAll();
  updateUI();
  alert(`🌀 Reborn! All carrots now x${state.multiplier} multiplier!`);
});

// ── Render ───────────────────────────────────────────
function renderUpgrades() {
  upgradesListEl.innerHTML = '';
  UPGRADES.forEach(u => {
    const count = upgradeCount[u.id];
    const cost = upgradeCost(u);
    const btn = document.createElement('button');
    btn.className = 'upgrade-btn';
    btn.disabled = state.carrots < cost;
    btn.innerHTML = `
      <span class="btn-name">${u.name} ${count > 0 ? `<span style="color:#ffd700">[${count}]</span>` : ''}</span>
      <span class="btn-cost">🥕 ${fmt(cost)}</span>
      <span class="btn-desc">${u.desc} each</span>
    `;
    btn.onclick = () => buyUpgrade(u.id);
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
  cpsDisplayEl.textContent  = fmt(state.cps * state.multiplier) + ' carrots/sec';
  cpcDisplayEl.textContent  = fmt(state.cpc) + ' carrot/click';

  // Show rebirth button when player hits 1 trillion
  if (state.carrots >= 1_000_000_000_000) {
    rebirthSection.style.display = 'block';
  }
  rebirthNextMult.textContent = state.multiplier + 1;
  if (state.rebirths > 0) {
    rebirthCountEl.textContent = `Rebirths: ${state.rebirths} (current x${state.multiplier})`;
  }

  document.querySelectorAll('.building-btn').forEach((btn, i) => {
    const b = BUILDINGS[i];
    btn.disabled = state.carrots < buildingCost(b);
  });
  document.querySelectorAll('.upgrade-btn').forEach((btn, i) => {
    const u = UPGRADES[i];
    if (u) btn.disabled = state.carrots < upgradeCost(u);
  });
}

// ── Game Loop (20 ticks/sec) ─────────────────────────
setInterval(() => {
  const gained = (state.cps / 20) * state.multiplier;
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
    multiplier: state.multiplier,
    upgradeCount: { ...upgradeCount },
    buildingOwned: { ...buildingOwned },
  };
  localStorage.setItem('bunnyClicker', JSON.stringify(data));
}

function loadGame() {
  const raw = localStorage.getItem('bunnyClicker');
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    state.carrots     = data.carrots || 0;
    state.totalEarned = data.totalEarned || 0;
    state.rebirths    = data.rebirths || 0;
    state.multiplier  = data.multiplier || 1;
    Object.assign(upgradeCount, data.upgradeCount || {});
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

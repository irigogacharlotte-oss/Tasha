/* =========================================================
   FINANCE DASHBOARD — app.js
   ========================================================= */

'use strict';

// ── State ─────────────────────────────────────────────────
const state = {
  transactions: [],
  goals: [],
  budgets: [],
};

// ── Persistence ───────────────────────────────────────────
function save() {
  localStorage.setItem('fd_transactions', JSON.stringify(state.transactions));
  localStorage.setItem('fd_goals',        JSON.stringify(state.goals));
  localStorage.setItem('fd_budgets',      JSON.stringify(state.budgets));
}
function load() {
  state.transactions = JSON.parse(localStorage.getItem('fd_transactions') || '[]');
  state.goals        = JSON.parse(localStorage.getItem('fd_goals')        || '[]');
  state.budgets      = JSON.parse(localStorage.getItem('fd_budgets')      || '[]');
  if (!state.transactions.length) seedDemoData();
}

// ── Demo seed ─────────────────────────────────────────────
function seedDemoData() {
  const now  = new Date();
  const y    = now.getFullYear();
  const m    = String(now.getMonth() + 1).padStart(2, '0');
  const pm   = String(now.getMonth()).padStart(2, '0') || '12';
  const py   = now.getMonth() === 0 ? y - 1 : y;

  const txs = [
    { type:'income',  description:'Monthly Salary',     amount:500000,  category:'Salary',            date:`${y}-${m}-01`,  note:'' },
    { type:'income',  description:'Freelance Project',  amount:120000,  category:'Freelance',          date:`${y}-${m}-08`,  note:'Web design' },
    { type:'expense', description:'Rent',               amount:150000,  category:'Housing',            date:`${y}-${m}-01`,  note:'' },
    { type:'expense', description:'Electricity Bill',   amount:18000,   category:'Utilities',          date:`${y}-${m}-05`,  note:'' },
    { type:'expense', description:'Groceries',          amount:35000,   category:'Food & Groceries',   date:`${y}-${m}-10`,  note:'Weekly shop' },
    { type:'expense', description:'Gym Membership',     amount:10000,   category:'Healthcare',         date:`${y}-${m}-03`,  note:'' },
    { type:'expense', description:'MTN / Airtel Data',  amount:5000,    category:'Entertainment',      date:`${y}-${m}-06`,  note:'' },
    { type:'expense', description:'Moto Taxi',          amount:22000,   category:'Transport',          date:`${y}-${m}-02`,  note:'' },
    { type:'expense', description:'Online Shopping',    amount:28000,   category:'Shopping',           date:`${y}-${m}-12`,  note:'Jumia' },
    { type:'income',  description:'Monthly Salary',     amount:500000,  category:'Salary',            date:`${py}-${pm}-01`, note:'' },
    { type:'expense', description:'Rent',               amount:150000,  category:'Housing',            date:`${py}-${pm}-01`, note:'' },
    { type:'expense', description:'Groceries',          amount:30000,   category:'Food & Groceries',   date:`${py}-${pm}-14`, note:'' },
    { type:'expense', description:'Dining Out',         amount:15000,   category:'Food & Groceries',   date:`${py}-${pm}-18`, note:'' },
    { type:'expense', description:'Transport',          amount:20000,   category:'Transport',          date:`${py}-${pm}-05`, note:'' },
    { type:'expense', description:'Utilities',          amount:18000,   category:'Utilities',          date:`${py}-${pm}-07`, note:'' },
    { type:'income',  description:'Investment Return',  amount:45000,   category:'Investment',         date:`${py}-${pm}-25`, note:'Dividends' },
  ];
  txs.forEach(t => state.transactions.push({ id: uid(), ...t }));

  state.goals = [
    { id: uid(), name:'Family Holiday',  icon:'🏖️', target:800000,   saved:320000,  deadline:`${y}-08-31` },
    { id: uid(), name:'Emergency Fund',  icon:'🌟', target:2000000,  saved:1300000, deadline:'' },
    { id: uid(), name:'New Laptop',      icon:'💻', target:350000,   saved:350000,  deadline:'' },
  ];
  state.budgets = [
    { id: uid(), category:'Housing',          amount:160000 },
    { id: uid(), category:'Food & Groceries', amount:60000  },
    { id: uid(), category:'Transport',        amount:30000  },
    { id: uid(), category:'Entertainment',    amount:15000  },
    { id: uid(), category:'Shopping',         amount:40000  },
  ];
  save();
}

// ── Helpers ───────────────────────────────────────────────
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function fmt(n) { return 'RWF ' + Math.abs(n).toLocaleString('en-RW', { minimumFractionDigits:0, maximumFractionDigits:0 }); }
function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return new Date(+y, +m - 1, +d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}
function monthKey(iso) { return iso ? iso.slice(0, 7) : ''; }

// ── Filtering ─────────────────────────────────────────────
function getFilter() { return document.getElementById('monthFilter').value; }

function filteredTx() {
  const f = getFilter();
  if (f === 'all') return state.transactions;
  return state.transactions.filter(t => monthKey(t.date) === f);
}

// Category colours
const CAT_COLOURS = [
  '#6c63ff','#38bdf8','#f59e0b','#ef4444','#22c55e',
  '#a78bfa','#fb923c','#e879f9','#34d399','#f472b6',
];
const catColourMap = {};
function catColour(cat) {
  if (!catColourMap[cat]) {
    catColourMap[cat] = CAT_COLOURS[Object.keys(catColourMap).length % CAT_COLOURS.length];
  }
  return catColourMap[cat];
}

// Category emoji
const CAT_ICONS = {
  'Salary':'💼','Freelance':'🖥️','Investment':'📈','Gift':'🎁','Other Income':'💰',
  'Housing':'🏠','Food & Groceries':'🛒','Transport':'🚌','Utilities':'💡',
  'Healthcare':'🏥','Entertainment':'🎬','Shopping':'🛍️','Education':'📚',
  'Savings Transfer':'🏦','Other Expense':'💸',
};

// ── Charts ────────────────────────────────────────────────
let monthlyChart, categoryChart, savingsChart, budgetChart;

Chart.defaults.color = '#7c80a0';
Chart.defaults.font.family = "'Inter', system-ui, sans-serif";

function buildMonthlyChart() {
  // Get last 6 months
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  }
  const labels = months.map(m => {
    const [y, mo] = m.split('-');
    return new Date(+y, +mo - 1, 1).toLocaleDateString('en-GB', { month:'short', year:'2-digit' });
  });
  const incomes  = months.map(m => state.transactions.filter(t => t.type==='income'  && monthKey(t.date)===m).reduce((s,t) => s+t.amount, 0));
  const expenses = months.map(m => state.transactions.filter(t => t.type==='expense' && monthKey(t.date)===m).reduce((s,t) => s+t.amount, 0));

  const ctx = document.getElementById('monthlyChart').getContext('2d');
  if (monthlyChart) monthlyChart.destroy();
  monthlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label:'Income',   data:incomes,  backgroundColor:'rgba(34,197,94,.75)',  borderRadius:5, borderSkipped:false },
        { label:'Expenses', data:expenses, backgroundColor:'rgba(239,68,68,.75)', borderRadius:5, borderSkipped:false },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend:{ labels:{ boxWidth:10, padding:16 } }, tooltip:{ callbacks:{ label: c => ' '+fmt(c.raw) } } },
      scales: {
        x: { grid:{ color:'rgba(255,255,255,.04)' }, border:{ display:false } },
        y: { grid:{ color:'rgba(255,255,255,.04)' }, border:{ display:false }, ticks:{ callback: v => 'RWF '+Math.round(v).toLocaleString('en-RW') } },
      },
    },
  });
}

function buildCategoryChart() {
  const expenses = filteredTx().filter(t => t.type === 'expense');
  const catTotals = {};
  expenses.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + t.amount; });
  const cats   = Object.keys(catTotals);
  const values = cats.map(c => catTotals[c]);
  const colours = cats.map(c => catColour(c));

  const ctx = document.getElementById('categoryChart').getContext('2d');
  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels:cats, datasets:[{ data:values, backgroundColor:colours, borderWidth:2, borderColor:'#1a1d27', hoverOffset:6 }] },
    options: {
      cutout: '68%',
      plugins: { legend:{ display:false }, tooltip:{ callbacks:{ label: c => ` ${c.label}: ${fmt(c.raw)}` } } },
    },
  });

  // Custom legend
  const legend = document.getElementById('categoryLegend');
  legend.innerHTML = cats.map((c,i) => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${colours[i]}"></div>
      ${c}
    </div>`).join('');
}

function buildSavingsChart() {
  const ctx = document.getElementById('savingsChart').getContext('2d');
  if (savingsChart) savingsChart.destroy();
  if (!state.goals.length) return;
  savingsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: state.goals.map(g => g.name),
      datasets: [
        { label:'Saved',  data:state.goals.map(g => g.saved),                  backgroundColor:'rgba(108,99,255,.8)',  borderRadius:5, borderSkipped:false },
        { label:'Remaining', data:state.goals.map(g => Math.max(0, g.target - g.saved)), backgroundColor:'rgba(255,255,255,.08)', borderRadius:5, borderSkipped:false },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: { legend:{ labels:{ boxWidth:10 } }, tooltip:{ callbacks:{ label: c => ' '+fmt(c.raw) } } },
      scales: {
        x: { stacked:true, grid:{ color:'rgba(255,255,255,.04)' }, border:{ display:false }, ticks:{ callback: v => 'RWF '+Math.round(v).toLocaleString('en-RW') } },
        y: { stacked:true, grid:{ display:false }, border:{ display:false } },
      },
    },
  });
}

function buildBudgetChart() {
  const ctx = document.getElementById('budgetChart').getContext('2d');
  if (budgetChart) budgetChart.destroy();
  if (!state.budgets.length) return;

  const thisMonth = new Date().toISOString().slice(0,7);
  const labels  = state.budgets.map(b => b.category);
  const budgets = state.budgets.map(b => b.amount);
  const actuals = state.budgets.map(b => {
    return state.transactions
      .filter(t => t.type==='expense' && t.category===b.category && monthKey(t.date)===thisMonth)
      .reduce((s,t) => s+t.amount, 0);
  });

  budgetChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label:'Budget', data:budgets, backgroundColor:'rgba(108,99,255,.4)', borderColor:'rgba(108,99,255,.9)', borderWidth:1, borderRadius:5, borderSkipped:false },
        { label:'Actual', data:actuals, backgroundColor: actuals.map((a,i) => a > budgets[i] ? 'rgba(239,68,68,.75)' : 'rgba(34,197,94,.65)'), borderRadius:5, borderSkipped:false },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend:{ labels:{ boxWidth:10 } }, tooltip:{ callbacks:{ label: c => ' '+fmt(c.raw) } } },
      scales: {
        x: { grid:{ color:'rgba(255,255,255,.04)' }, border:{ display:false } },
        y: { grid:{ color:'rgba(255,255,255,.04)' }, border:{ display:false }, ticks:{ callback: v => 'RWF '+Math.round(v).toLocaleString('en-RW') } },
      },
    },
  });
}

// ── Summary Cards ─────────────────────────────────────────
function updateCards() {
  const txs      = filteredTx();
  const income   = txs.filter(t => t.type==='income').reduce((s,t) => s+t.amount, 0);
  const expenses = txs.filter(t => t.type==='expense').reduce((s,t) => s+t.amount, 0);
  const balance  = income - expenses;
  const rate     = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;

  document.getElementById('totalBalance').textContent  = (balance >= 0 ? '+' : '-') + fmt(balance);
  document.getElementById('totalBalance').style.color  = balance >= 0 ? 'var(--income)' : 'var(--expense)';
  document.getElementById('totalIncome').textContent   = fmt(income);
  document.getElementById('totalExpenses').textContent = fmt(expenses);
  document.getElementById('savingsRate').textContent   = rate + '%';
  document.getElementById('savingsRate').style.color   = rate >= 20 ? 'var(--income)' : rate >= 0 ? 'var(--savings)' : 'var(--expense)';

  document.getElementById('balanceTrend').textContent  = balance >= 0 ? '▲ Positive balance' : '▼ Negative balance';
  document.getElementById('balanceTrend').className    = 'card-trend ' + (balance >= 0 ? 'up' : 'down');
  document.getElementById('incomeTrend').textContent   = `${txs.filter(t=>t.type==='income').length} income entries`;
  document.getElementById('expenseTrend').textContent  = `${txs.filter(t=>t.type==='expense').length} expense entries`;
  document.getElementById('savingsTrend').textContent  = rate >= 20 ? 'Great savings rate!' : rate >= 10 ? 'Good, aim for 20%+' : 'Try to save more';
}

// ── Month Filter Populator ────────────────────────────────
function populateMonthFilter() {
  const sel = document.getElementById('monthFilter');
  const existing = new Set(state.transactions.map(t => monthKey(t.date)).filter(Boolean));
  const months = [...existing].sort().reverse();
  // keep "All Time" option, remove old month options
  while (sel.options.length > 1) sel.remove(1);
  months.forEach(m => {
    const [y, mo] = m.split('-');
    const label = new Date(+y, +mo - 1, 1).toLocaleDateString('en-GB', { month:'long', year:'numeric' });
    sel.add(new Option(label, m));
  });
}

// ── Render Transactions ───────────────────────────────────
function txHTML(t, showActions = true) {
  const icon  = CAT_ICONS[t.category] || (t.type==='income' ? '💰' : '💸');
  const sign  = t.type === 'income' ? '+' : '-';
  const actions = showActions ? `
    <div class="tx-actions">
      <button class="tx-btn" onclick="editTx('${t.id}')" title="Edit">✏️</button>
      <button class="tx-btn delete" onclick="deleteTx('${t.id}')" title="Delete">🗑️</button>
    </div>` : '';
  return `
    <div class="tx-item" data-id="${t.id}">
      <div class="tx-icon ${t.type}">${icon}</div>
      <div class="tx-info">
        <div class="tx-desc">${esc(t.description)}</div>
        <div class="tx-meta">${esc(t.category)}${t.note ? ' · '+esc(t.note) : ''}</div>
      </div>
      <div class="tx-right">
        <div class="tx-amount ${t.type}">${sign}${fmt(t.amount)}</div>
        <div class="tx-date">${fmtDate(t.date)}</div>
      </div>
      ${actions}
    </div>`;
}

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderRecent() {
  const sorted = [...filteredTx()].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 8);
  const el = document.getElementById('recentTransactions');
  const empty = document.getElementById('emptyOverview');
  if (!sorted.length) { el.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display = 'none';
  el.innerHTML = sorted.map(t => txHTML(t)).join('');
}

function renderAll() {
  const typeF = document.getElementById('typeFilter').value;
  const catF  = document.getElementById('categoryFilter').value;
  let txs = [...filteredTx()].sort((a,b) => b.date.localeCompare(a.date));
  if (typeF !== 'all') txs = txs.filter(t => t.type === typeF);
  if (catF  !== 'all') txs = txs.filter(t => t.category === catF);

  const el    = document.getElementById('allTransactions');
  const empty = document.getElementById('emptyTransactions');
  if (!txs.length) { el.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display = 'none';
  el.innerHTML = txs.map(t => txHTML(t)).join('');

  // Populate category filter
  const cats = [...new Set(state.transactions.map(t => t.category))].sort();
  const sel  = document.getElementById('categoryFilter');
  const prev = sel.value;
  while (sel.options.length > 1) sel.remove(1);
  cats.forEach(c => sel.add(new Option(c, c)));
  sel.value = prev;
}

// ── Goals ─────────────────────────────────────────────────
function renderGoals() {
  const el    = document.getElementById('savingsGoals');
  const empty = document.getElementById('emptyGoals');
  if (!state.goals.length) { el.innerHTML=''; empty.style.display='block'; buildSavingsChart(); return; }
  empty.style.display = 'none';

  el.innerHTML = state.goals.map(g => {
    const pct      = Math.min(100, Math.round((g.saved / g.target) * 100));
    const complete = g.saved >= g.target;
    const dl       = g.deadline ? `<div class="goal-deadline">🗓️ By ${fmtDate(g.deadline)}</div>` : '';
    return `
      <div class="goal-card">
        <div class="goal-header">
          <div class="goal-icon">${g.icon}</div>
          <div class="goal-name">${esc(g.name)}</div>
          <div class="goal-actions">
            <button class="tx-btn" onclick="editGoal('${g.id}')" title="Edit">✏️</button>
            <button class="tx-btn delete" onclick="deleteGoal('${g.id}')" title="Delete">🗑️</button>
          </div>
        </div>
        <div class="goal-amounts">
          <span class="goal-current">${fmt(g.saved)} saved</span>
          <span class="goal-target">of ${fmt(g.target)}</span>
        </div>
        <div class="goal-progress-bar">
          <div class="goal-progress-fill ${complete?'complete':''}" style="width:${pct}%"></div>
        </div>
        <div class="goal-pct">${complete ? '✅ Goal reached!' : pct + '% complete'}</div>
        ${dl}
      </div>`;
  }).join('');
  buildSavingsChart();
}

// ── Budget ────────────────────────────────────────────────
function renderBudgets() {
  const el    = document.getElementById('budgetList');
  const empty = document.getElementById('emptyBudget');
  if (!state.budgets.length) { el.innerHTML=''; empty.style.display='block'; buildBudgetChart(); return; }
  empty.style.display = 'none';

  const thisMonth = new Date().toISOString().slice(0,7);
  el.innerHTML = state.budgets.map(b => {
    const spent  = state.transactions
      .filter(t => t.type==='expense' && t.category===b.category && monthKey(t.date)===thisMonth)
      .reduce((s,t) => s+t.amount, 0);
    const pct    = Math.round((spent / b.amount) * 100);
    const status = pct >= 100 ? 'over' : pct >= 80 ? 'warning' : '';
    return `
      <div class="budget-item">
        <div class="budget-row">
          <div class="budget-category">${CAT_ICONS[b.category]||'📦'} ${esc(b.category)}</div>
          <div class="budget-amounts">
            <span class="${status==='over'?'over':''}">${fmt(spent)}</span> / ${fmt(b.amount)}
            ${status==='over' ? '<span class="over"> (over by '+fmt(spent-b.amount)+')</span>' : ''}
          </div>
          <div class="budget-actions">
            <button class="tx-btn" onclick="editBudget('${b.id}')" title="Edit">✏️</button>
            <button class="tx-btn delete" onclick="deleteBudget('${b.id}')" title="Delete">🗑️</button>
          </div>
        </div>
        <div class="budget-bar">
          <div class="budget-bar-fill ${status}" style="width:${Math.min(100,pct)}%"></div>
        </div>
      </div>`;
  }).join('');
  buildBudgetChart();
}

// ── Full Render ───────────────────────────────────────────
function renderAll_() {
  populateMonthFilter();
  updateCards();
  renderRecent();
  renderAll();
  renderGoals();
  renderBudgets();
  buildMonthlyChart();
  buildCategoryChart();
}

// ── Tabs ──────────────────────────────────────────────────
const TAB_TITLES = {
  overview:     ['Overview',       'Your financial snapshot'],
  transactions: ['Transactions',   'All income & expenses'],
  savings:      ['Savings Goals',  'Track your goals'],
  budget:       ['Budget',         'Monthly spending limits'],
};
function switchTab(name) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  document.querySelector(`.nav-item[data-tab="${name}"]`).classList.add('active');
  const [title, sub] = TAB_TITLES[name] || ['', ''];
  document.getElementById('pageTitle').textContent    = title;
  document.getElementById('pageSubtitle').textContent = sub;
  // Rebuild chart on tab switch (canvas size may have been 0 when hidden)
  if (name === 'overview')     { buildMonthlyChart(); buildCategoryChart(); }
  if (name === 'savings')      { buildSavingsChart(); }
  if (name === 'budget')       { buildBudgetChart(); }
}

// ── Transaction Modal ─────────────────────────────────────
let editingTxId = null;

function openTransactionModal(tx = null) {
  editingTxId = tx ? tx.id : null;
  document.getElementById('modalTxTitle').textContent = tx ? 'Edit Transaction' : 'Add Transaction';
  document.getElementById('txEditId').value       = tx ? tx.id : '';
  document.getElementById('txDescription').value  = tx ? tx.description : '';
  document.getElementById('txAmount').value        = tx ? tx.amount : '';
  document.getElementById('txDate').value          = tx ? tx.date : new Date().toISOString().slice(0,10);
  document.getElementById('txCategory').value      = tx ? tx.category : '';
  document.getElementById('txNote').value          = tx ? tx.note : '';
  document.querySelectorAll('input[name="txType"]').forEach(r => { r.checked = r.value === (tx ? tx.type : 'income'); });
  document.getElementById('transactionModal').classList.add('open');
  document.getElementById('txDescription').focus();
}

function closeTransactionModal() {
  document.getElementById('transactionModal').classList.remove('open');
  document.getElementById('transactionForm').reset();
  editingTxId = null;
}

document.getElementById('addTransactionBtn').addEventListener('click', () => openTransactionModal());
document.getElementById('closeTransactionModal').addEventListener('click', closeTransactionModal);
document.getElementById('cancelTransaction').addEventListener('click', closeTransactionModal);
document.querySelector('#transactionModal .modal-overlay').addEventListener('click', closeTransactionModal);

document.getElementById('transactionForm').addEventListener('submit', e => {
  e.preventDefault();
  const tx = {
    id:          editingTxId || uid(),
    type:        document.querySelector('input[name="txType"]:checked').value,
    description: document.getElementById('txDescription').value.trim(),
    amount:      parseFloat(document.getElementById('txAmount').value),
    date:        document.getElementById('txDate').value,
    category:    document.getElementById('txCategory').value,
    note:        document.getElementById('txNote').value.trim(),
  };
  if (editingTxId) {
    const idx = state.transactions.findIndex(t => t.id === editingTxId);
    if (idx !== -1) state.transactions[idx] = tx;
  } else {
    state.transactions.push(tx);
  }
  save();
  closeTransactionModal();
  renderAll_();
});

window.editTx = function(id) {
  const tx = state.transactions.find(t => t.id === id);
  if (tx) openTransactionModal(tx);
};
window.deleteTx = function(id) {
  if (!confirm('Delete this transaction?')) return;
  state.transactions = state.transactions.filter(t => t.id !== id);
  save();
  renderAll_();
};

// ── Goal Modal ────────────────────────────────────────────
let editingGoalId = null;

function openGoalModal(g = null) {
  editingGoalId = g ? g.id : null;
  document.getElementById('modalGoalTitle').textContent = g ? 'Edit Goal' : 'Add Savings Goal';
  document.getElementById('goalEditId').value   = g ? g.id : '';
  document.getElementById('goalName').value     = g ? g.name : '';
  document.getElementById('goalTarget').value   = g ? g.target : '';
  document.getElementById('goalSaved').value    = g ? g.saved : '0';
  document.getElementById('goalDeadline').value = g ? g.deadline : '';
  document.getElementById('goalIcon').value     = g ? g.icon : '🌟';
  document.getElementById('goalModal').classList.add('open');
  document.getElementById('goalName').focus();
}
function closeGoalModal() {
  document.getElementById('goalModal').classList.remove('open');
  document.getElementById('goalForm').reset();
  editingGoalId = null;
}
document.getElementById('addGoalBtn').addEventListener('click', () => openGoalModal());
document.getElementById('closeGoalModal').addEventListener('click', closeGoalModal);
document.getElementById('cancelGoal').addEventListener('click', closeGoalModal);
document.querySelector('#goalModal .modal-overlay').addEventListener('click', closeGoalModal);

document.getElementById('goalForm').addEventListener('submit', e => {
  e.preventDefault();
  const g = {
    id:       editingGoalId || uid(),
    name:     document.getElementById('goalName').value.trim(),
    icon:     document.getElementById('goalIcon').value,
    target:   parseFloat(document.getElementById('goalTarget').value),
    saved:    parseFloat(document.getElementById('goalSaved').value) || 0,
    deadline: document.getElementById('goalDeadline').value,
  };
  if (editingGoalId) {
    const idx = state.goals.findIndex(g2 => g2.id === editingGoalId);
    if (idx !== -1) state.goals[idx] = g;
  } else {
    state.goals.push(g);
  }
  save(); closeGoalModal(); renderGoals();
});
window.editGoal = function(id) {
  const g = state.goals.find(g => g.id === id);
  if (g) openGoalModal(g);
};
window.deleteGoal = function(id) {
  if (!confirm('Delete this goal?')) return;
  state.goals = state.goals.filter(g => g.id !== id);
  save(); renderGoals();
};

// ── Budget Modal ──────────────────────────────────────────
let editingBudgetId = null;

function openBudgetModal(b = null) {
  editingBudgetId = b ? b.id : null;
  document.getElementById('modalBudgetTitle').textContent = b ? 'Edit Budget' : 'Set Budget';
  document.getElementById('budgetEditId').value    = b ? b.id : '';
  document.getElementById('budgetCategory').value  = b ? b.category : '';
  document.getElementById('budgetAmount').value    = b ? b.amount : '';
  document.getElementById('budgetModal').classList.add('open');
  document.getElementById('budgetAmount').focus();
}
function closeBudgetModal() {
  document.getElementById('budgetModal').classList.remove('open');
  document.getElementById('budgetForm').reset();
  editingBudgetId = null;
}
document.getElementById('addBudgetBtn').addEventListener('click', () => openBudgetModal());
document.getElementById('closeBudgetModal').addEventListener('click', closeBudgetModal);
document.getElementById('cancelBudget').addEventListener('click', closeBudgetModal);
document.querySelector('#budgetModal .modal-overlay').addEventListener('click', closeBudgetModal);

document.getElementById('budgetForm').addEventListener('submit', e => {
  e.preventDefault();
  const b = {
    id:       editingBudgetId || uid(),
    category: document.getElementById('budgetCategory').value,
    amount:   parseFloat(document.getElementById('budgetAmount').value),
  };
  if (editingBudgetId) {
    const idx = state.budgets.findIndex(b2 => b2.id === editingBudgetId);
    if (idx !== -1) state.budgets[idx] = b;
  } else {
    state.budgets.push(b);
  }
  save(); closeBudgetModal(); renderBudgets();
});
window.editBudget = function(id) {
  const b = state.budgets.find(b => b.id === id);
  if (b) openBudgetModal(b);
};
window.deleteBudget = function(id) {
  if (!confirm('Delete this budget?')) return;
  state.budgets = state.budgets.filter(b => b.id !== id);
  save(); renderBudgets();
};

// ── Nav & Filter Events ───────────────────────────────────
document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', ev => {
    ev.preventDefault();
    switchTab(el.dataset.tab);
  });
});
document.querySelectorAll('.view-all[data-tab-link]').forEach(el => {
  el.addEventListener('click', ev => {
    ev.preventDefault();
    switchTab(el.dataset.tabLink);
  });
});
document.getElementById('monthFilter').addEventListener('change', () => { updateCards(); renderRecent(); renderAll(); buildCategoryChart(); });
document.getElementById('typeFilter').addEventListener('change', renderAll);
document.getElementById('categoryFilter').addEventListener('change', renderAll);

// ── Keyboard Shortcut (Esc to close modals) ───────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeTransactionModal();
    closeGoalModal();
    closeBudgetModal();
  }
});

// ── Current month label ───────────────────────────────────
document.getElementById('currentMonth').textContent =
  new Date().toLocaleDateString('en-GB', { month:'long', year:'numeric' });

// ── Init ──────────────────────────────────────────────────
load();
renderAll_();

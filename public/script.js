let state = {
  dayName: '',
  budget: 0,
  expenses: []
};

const categories = {
  comida: 'Comida',
  transporte: 'Transporte',
  entretenimiento: 'Entretenimiento',
  servicios: 'Servicios/Facturas',
  estudio: 'Estudio Poli',
  gustos: 'Gustos culposos'
};

const categoryColors = {
  comida: '#f97316',
  transporte: '#06b6d4',
  entretenimiento: '#a855f7',
  servicios: '#3b82f6',
  estudio: '#ec4899',
  gustos: '#f59e0b'
};

const setupForm = document.getElementById('setupForm');
setupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const dayName = document.getElementById('dayName').value.trim();
  const budget = parseFloat(document.getElementById('budget').value);

  if (!dayName) {
    showAlert('El nombre del día es requerido', 'error');
    return;
  }

  if (budget <= 0) {
    showAlert('El presupuesto debe ser mayor a 0', 'error');
    return;
  }

  state.dayName = dayName;
  state.budget = budget;
  state.expenses = [];

  switchScreen('dashboard');
  updateDisplay();
  setupForm.reset();
});

const expenseForm = document.getElementById('expenseForm');
expenseForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const description = document.getElementById('description').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value;

  if (!description || !category) {
    showAlert('Completa todos los campos', 'error');
    return;
  }

  if (amount <= 0) {
    showAlert('El monto debe ser mayor a 0', 'error');
    return;
  }

  const expense = { description, amount, category };
  state.expenses.push(expense);

  const totalSpent = calculateTotal();
  const percentageUsed = (totalSpent / state.budget) * 100;
  const excess = totalSpent - state.budget;

  if (excess > 0) {
    showAlert(
      `Exceso: Has gastado $${excess.toLocaleString('es-CO')} más de tu presupuesto`,
      'error'
    );
  } else if (percentageUsed >= 85) {
    showAlert(
      `Cuidado: Has usado el ${Math.round(percentageUsed)}% de tu presupuesto`,
      'warning'
    );
  } else {
    showAlert(
      `Gasto registrado: $${amount.toLocaleString('es-CO')}`,
      'success'
    );
  }

  updateDisplay();
  expenseForm.reset();
});

function calculateTotal() {
  return state.expenses.reduce((sum, exp) => sum + exp.amount, 0);
}

function switchScreen(screenName) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenName + 'Screen').classList.add('active');
}

function updateDisplay() {
  document.getElementById('displayDay').textContent = state.dayName;
  document.getElementById('displayBudget').textContent = 
    `$${state.budget.toLocaleString('es-CO')}`;
  document.getElementById('summaryBudget').textContent = 
    `$${state.budget.toLocaleString('es-CO')}`;

  const totalSpent = calculateTotal();
  document.getElementById('totalSpent').textContent = 
    `$${totalSpent.toLocaleString('es-CO')}`;

  const available = state.budget - totalSpent;
  const availableRow = document.getElementById('availableRow');
  const excessRow = document.getElementById('excessRow');

  if (available >= 0) {
    availableRow.style.display = 'flex';
    excessRow.style.display = 'none';
    document.getElementById('available').textContent = 
      `$${available.toLocaleString('es-CO')}`;
  } else {
    availableRow.style.display = 'none';
    excessRow.style.display = 'flex';
    document.getElementById('excess').textContent = 
      `+$${Math.abs(available).toLocaleString('es-CO')}`;
  }

  const expensesList = document.getElementById('expensesList');
  if (state.expenses.length === 0) {
    expensesList.innerHTML = '<div class="empty-state"><p>No hay gastos registrados aún</p></div>';
  } else {
    expensesList.innerHTML = state.expenses.map((exp, idx) => `
      <div class="expense-item" data-category="${exp.category}">
        <div class="expense-text">
          <span class="expense-desc">${exp.description}</span>
          <span class="expense-category">${categories[exp.category]}</span>
        </div>
        <span class="expense-amount">$${exp.amount.toLocaleString('es-CO')}</span>
        <button type="button" class="expense-delete" data-index="${idx}">×</button>
      </div>
    `).join('');

    document.querySelectorAll('.expense-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        state.expenses.splice(idx, 1);
        updateDisplay();
      });
    });
  }

  updateCategoryBreakdown();
}

function updateCategoryBreakdown() {
  const total = calculateTotal();
  const categoryTotals = {};

  Object.keys(categories).forEach(cat => {
    categoryTotals[cat] = 0;
  });

  state.expenses.forEach(exp => {
    categoryTotals[exp.category] += exp.amount;
  });

  const breakdown = document.getElementById('categoryBreakdown');
  if (total === 0) {
    breakdown.innerHTML = '<p style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">Sin gastos registrados</p>';
  } else {
    breakdown.innerHTML = Object.entries(categoryTotals)
      .filter(([_, amount]) => amount > 0)
      .map(([cat, amount]) => {
        const percentage = (amount / total) * 100;
        return `
          <div class="category-bar">
            <span class="category-label">${categories[cat]}</span>
            <div class="category-bar-fill">
              <div class="category-bar-value" style="width: ${percentage}%; background: ${categoryColors[cat]};"></div>
            </div>
            <span class="category-percent">${Math.round(percentage)}%</span>
          </div>
        `;
      }).join('');
  }
}

function showAlert(message, type = 'info') {
  const container = document.getElementById('alertsContainer');
  const alert = document.createElement('div');
  alert.className = `alert ${type}`;
  alert.innerHTML = `
    <span>${message}</span>
    <button type="button" class="alert-close">×</button>
  `;
  
  container.appendChild(alert);

  alert.querySelector('.alert-close').addEventListener('click', () => {
    alert.remove();
  });

  setTimeout(() => {
    if (alert.parentElement) alert.remove();
  }, 5000);
}

document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Se borrarán todos los gastos.')) {
    state = { dayName: '', budget: 0, expenses: [] };
    document.getElementById('alertsContainer').innerHTML = '';
    switchScreen('setup');
  }
});

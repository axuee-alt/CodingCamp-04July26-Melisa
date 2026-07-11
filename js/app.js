// ===================================
// Elegant Expense Tracker - Vanilla JavaScript
// ===================================

// ===================================
// Storage Service Module
// ===================================
const StorageService = {
  saveTransactions(transactions) {
    try {
      localStorage.setItem('expenses_transactions', JSON.stringify(transactions));
    } catch (e) {
      console.error('Error saving transactions:', e);
    }
  },

  loadTransactions() {
    try {
      const data = localStorage.getItem('expenses_transactions');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading transactions:', e);
      return [];
    }
  },

  saveBudget(limit) {
    try {
      localStorage.setItem('expenses_budget', limit.toString());
    } catch (e) {
      console.error('Error saving budget:', e);
    }
  },

  loadBudget() {
    try {
      const budget = localStorage.getItem('expenses_budget');
      return budget ? parseFloat(budget) : 0;
    } catch (e) {
      console.error('Error loading budget:', e);
      return 0;
    }
  },

  saveCategories(categories) {
    try {
      localStorage.setItem('expenses_categories', JSON.stringify(categories));
    } catch (e) {
      console.error('Error saving categories:', e);
    }
  },

  loadCategories() {
    try {
      const data = localStorage.getItem('expenses_categories');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading categories:', e);
      return [];
    }
  },

  saveTheme(theme) {
    try {
      localStorage.setItem('expenses_theme', theme);
    } catch (e) {
      console.error('Error saving theme:', e);
    }
  },

  loadTheme() {
    try {
      return localStorage.getItem('expenses_theme') || 'dark';
    } catch (e) {
      console.error('Error loading theme:', e);
      return 'dark';
    }
  }
};

// ===================================
// Category Manager Module
// ===================================
const CategoryManager = {
  defaultCategories: ['Food', 'Transport', 'Entertainment', 'Bills', 'Shopping', 'Health', 'Other'],
  customCategories: [],

  init() {
    this.customCategories = StorageService.loadCategories();
  },

  getDefaultCategories() {
    return this.defaultCategories;
  },

  addCustomCategory(name) {
    const trimmedName = name.trim();
    if (!trimmedName) return { success: false, error: 'Category name cannot be empty' };
    if (trimmedName.length > 30) return { success: false, error: 'Category name too long (max 30 characters)' };
    if (this.categoryExists(trimmedName)) return { success: false, error: 'Category already exists' };

    this.customCategories.push(trimmedName);
    StorageService.saveCategories(this.customCategories);
    return { success: true };
  },

  getAllCategories() {
    return [...this.defaultCategories, ...this.customCategories];
  },

  categoryExists(name) {
    const allCategories = this.getAllCategories();
    return allCategories.some(cat => cat.toLowerCase() === name.toLowerCase());
  }
};

// ===================================
// Transaction Manager Module
// ===================================
const TransactionManager = {
  transactions: [],

  init() {
    this.transactions = StorageService.loadTransactions();
  },

  addTransaction(amount, category, date, description) {
    const transaction = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      category: category,
      date: date,
      description: description || ''
    };

    this.transactions.push(transaction);
    StorageService.saveTransactions(this.transactions);
    return transaction;
  },

  deleteTransaction(id) {
    this.transactions = this.transactions.filter(t => t.id !== id);
    StorageService.saveTransactions(this.transactions);
    return true;
  },

  getAllTransactions() {
    return [...this.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  getTransactionById(id) {
    return this.transactions.find(t => t.id === id);
  }
};

// ===================================
// Calculation Engine Module
// ===================================
const CalculationEngine = {
  sumTransactions(transactions) {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  },

  groupByCategory(transactions) {
    const grouped = {};
    transactions.forEach(t => {
      if (!grouped[t.category]) {
        grouped[t.category] = 0;
      }
      grouped[t.category] += t.amount;
    });
    return grouped;
  },

  groupByMonth(transactions) {
    const grouped = {};
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          name: monthName,
          total: 0,
          count: 0
        };
      }
      grouped[monthKey].total += t.amount;
      grouped[monthKey].count += 1;
    });
    return grouped;
  },

  calculatePercentage(value, total) {
    if (total === 0) return 0;
    return (value / total) * 100;
  }
};

// ===================================
// Budget Manager Module
// ===================================
const BudgetManager = {
  budget: 0,

  init() {
    this.budget = StorageService.loadBudget();
  },

  setBudget(limit) {
    this.budget = parseFloat(limit);
    StorageService.saveBudget(this.budget);
  },

  getBudget() {
    return this.budget;
  },

  calculateTotalSpending(transactions) {
    return CalculationEngine.sumTransactions(transactions);
  },

  calculateSpendingByCategory(transactions) {
    return CalculationEngine.groupByCategory(transactions);
  },

  getBudgetStatus(spending, budget) {
    if (budget === 0) return 'normal';
    const percentage = (spending / budget) * 100;
    if (percentage < 80) return 'normal';
    if (percentage <= 100) return 'warning';
    return 'over';
  }
};

// ===================================
// UI Controller Module
// ===================================
const UIController = {
  elements: {
    transactionForm: document.getElementById('transaction-form'),
    transactionList: document.getElementById('transaction-list'),
    budgetInput: document.getElementById('budget-input'),
    setBudgetBtn: document.getElementById('set-budget-btn'),
    categorySelect: document.getElementById('category'),
    dateInput: document.getElementById('date'),
    budgetError: document.getElementById('budget-error'),
    categoryError: document.getElementById('category-error'),
    customCategoryInput: document.getElementById('custom-category'),
    addCategoryBtn: document.getElementById('add-category-btn'),
    categoryBreakdown: document.getElementById('category-breakdown'),
    monthlySummary: document.getElementById('monthly-summary'),
    themeToggle: document.getElementById('theme-toggle'),
    dashTabButtons: document.querySelectorAll('.dash-tab-btn'),
    // New header elements
    headerBudget: document.getElementById('header-budget'),
    headerSpent: document.getElementById('header-spent'),
    headerRemaining: document.getElementById('header-remaining'),
    headerProgressBar: document.getElementById('header-progress-bar'),
    headerProgressText: document.getElementById('header-progress-text'),
    headerProgressPercent: document.getElementById('header-progress-percent'),
    recentTransactionsList: document.getElementById('recent-transactions-list'),
    categoryChart: document.getElementById('category-pie-chart'),
    chartEmptyState: document.getElementById('chart-empty-state'),
    // Hero preview elements
    heroBudget: document.getElementById('hero-budget'),
    heroSpent: document.getElementById('hero-spent'),
    heroRemaining: document.getElementById('hero-remaining'),
    heroProgressBar: document.getElementById('hero-progress-bar'),
    heroRecentList: document.getElementById('hero-recent-list')
  },

  pieChartInstance: null,

  init() {
    this.updateCategoryDropdown();
    this.setDefaultDate();
    this.applyTheme();
    this.setupCanvas();
  },

  setupCanvas() {
    if (this.elements.categoryChart) {
      this.elements.categoryChart.width = 250;
      this.elements.categoryChart.height = 250;
    }
  },

  setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    this.elements.dateInput.value = today;
  },

  updateCategoryDropdown() {
    const categories = CategoryManager.getAllCategories();
    this.elements.categorySelect.innerHTML = '<option value="">Select category</option>';
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      this.elements.categorySelect.appendChild(option);
    });
  },

  renderTransactionList(transactions) {
    if (transactions.length === 0) {
      this.elements.transactionList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <p class="empty-title">No transactions yet</p>
          <p class="empty-subtitle">Start tracking your expenses by adding your first transaction above.</p>
        </div>
      `;
      return;
    }

    this.elements.transactionList.innerHTML = '';
    transactions.forEach(transaction => {
      const card = document.createElement('div');
      card.className = 'transaction-card';

      card.innerHTML = `
        <div class="transaction-info">
          <div class="transaction-header">
            <span class="transaction-amount">$${transaction.amount.toFixed(2)}</span>
            <span class="transaction-category">${transaction.category}</span>
          </div>
          <div class="transaction-details">
            <span class="transaction-date">📅 ${this.formatDate(transaction.date)}</span>
          </div>
          ${transaction.description ? `<div class="transaction-description">${transaction.description}</div>` : ''}
        </div>
        <button class="btn-delete" onclick="EventHandler.handleTransactionDelete('${transaction.id}')">Delete</button>
      `;

      this.elements.transactionList.appendChild(card);
    });
  },

  renderBudgetSummary(spending, budget, status) {
    const remaining = budget - spending;
    const percentage = budget > 0 ? Math.min((spending / budget) * 100, 100) : 0;

    // Update header cards
    if (this.elements.headerBudget) this.elements.headerBudget.textContent = `$${budget.toFixed(2)}`;
    if (this.elements.headerSpent) this.elements.headerSpent.textContent = `$${spending.toFixed(2)}`;
    if (this.elements.headerRemaining) this.elements.headerRemaining.textContent = `$${remaining.toFixed(2)}`;
    
    // Update hero preview
    if (this.elements.heroBudget) {
      this.elements.heroBudget.textContent = budget > 0 ? `$${budget.toFixed(0)}` : '—';
    }
    if (this.elements.heroSpent) {
      this.elements.heroSpent.textContent = spending > 0 ? `$${spending.toFixed(0)}` : '—';
    }
    if (this.elements.heroRemaining) {
      this.elements.heroRemaining.textContent = remaining > 0 ? `$${remaining.toFixed(0)}` : '—';
    }
    if (this.elements.heroProgressBar) {
      this.elements.heroProgressBar.style.width = `${percentage}%`;
    }
    
    // Update progress
    if (this.elements.headerProgressBar) {
      this.elements.headerProgressBar.style.width = `${percentage}%`;
      this.elements.headerProgressBar.className = `progress-bar status-${status}`;
    }
    if (this.elements.headerProgressText) {
      this.elements.headerProgressText.textContent = `$${spending.toFixed(0)} spent of $${budget.toFixed(0)}`;
    }
    if (this.elements.headerProgressPercent) {
      this.elements.headerProgressPercent.textContent = `${percentage.toFixed(0)}%`;
    }
  },

  renderHeroRecentTransactions(transactions) {
    if (!this.elements.heroRecentList) return;

    if (transactions.length === 0) {
      this.elements.heroRecentList.innerHTML = '<div class="hero-empty">No transactions yet</div>';
      return;
    }

    const recent = transactions.slice(0, 3);
    this.elements.heroRecentList.innerHTML = '';

    recent.forEach(t => {
      const icon = this.getCategoryIcon(t.category);
      const item = document.createElement('div');
      item.className = 'hero-recent-item';
      item.innerHTML = `
        <div class="hero-recent-left">
          <span class="hero-recent-icon">${icon}</span>
          <span class="hero-recent-category">${t.category}</span>
        </div>
        <span class="hero-recent-amount">$${t.amount.toFixed(0)}</span>
      `;
      this.elements.heroRecentList.appendChild(item);
    });
  },

  renderRecentTransactions(transactions) {
    if (!this.elements.recentTransactionsList) return;

    if (transactions.length === 0) {
      this.elements.recentTransactionsList.innerHTML = `
        <div class="chart-empty">
          <div class="empty-icon">📝</div>
          <p class="empty-title">No transactions yet</p>
          <p class="empty-subtitle">Add your first transaction to start tracking</p>
        </div>
      `;
      return;
    }

    const recent = transactions.slice(0, 5);
    this.elements.recentTransactionsList.innerHTML = '';

    recent.forEach(t => {
      const icon = this.getCategoryIcon(t.category);
      const item = document.createElement('div');
      item.className = 'recent-transaction-item';
      item.innerHTML = `
        <div class="recent-transaction-left">
          <span class="recent-icon">${icon}</span>
          <div class="recent-info">
            <div class="recent-category">${t.category}</div>
            <div class="recent-date">${this.formatDate(t.date)}</div>
          </div>
        </div>
        <div class="recent-amount">$${t.amount.toFixed(2)}</div>
      `;
      this.elements.recentTransactionsList.appendChild(item);
    });
  },

  getCategoryIcon(category) {
    const icons = {
      'Food': '🍔',
      'Transport': '🚗',
      'Entertainment': '🎮',
      'Bills': '📄',
      'Shopping': '🛒',
      'Health': '💊',
      'Other': '📦'
    };
    return icons[category] || '💰';
  },

  renderCategoryChart(categoryTotals) {
    if (!this.elements.categoryChart || !this.elements.chartEmptyState) return;

    if (Object.keys(categoryTotals).length === 0) {
      this.elements.categoryChart.style.display = 'none';
      this.elements.chartEmptyState.style.display = 'flex';
      return;
    }

    this.elements.categoryChart.style.display = 'block';
    this.elements.chartEmptyState.style.display = 'none';

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const colors = [
      '#4d9eff',
      '#6db0ff',
      '#8dc3ff',
      '#acd5ff',
      '#cce7ff',
      '#198754',
      '#ffc107'
    ];

    // Destroy old chart if exist
    if (this.pieChartInstance) {
      this.pieChartInstance.destroy();
    }

    // Create simple pie chart (no library needed - draw on canvas)
    const ctx = this.elements.categoryChart.getContext('2d');
    const centerX = this.elements.categoryChart.width / 2;
    const centerY = this.elements.categoryChart.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    ctx.clearRect(0, 0, this.elements.categoryChart.width, this.elements.categoryChart.height);

    const total = data.reduce((sum, val) => sum + val, 0);
    let currentAngle = -Math.PI / 2;

    data.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.lineTo(centerX, centerY);
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      
      currentAngle += sliceAngle;
    });
  },

  renderCategoryBreakdown(categoryTotals) {
    if (Object.keys(categoryTotals).length === 0) {
      this.elements.categoryBreakdown.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🏷️</div>
          <p class="empty-title">No spending data yet</p>
          <p class="empty-subtitle">Add transactions to see your spending breakdown by category.</p>
        </div>
      `;
      return;
    }

    const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

    this.elements.categoryBreakdown.innerHTML = '';
    sortedCategories.forEach(([category, amount]) => {
      const percentage = (amount / total) * 100;
      const item = document.createElement('div');
      item.className = 'category-item';

      item.innerHTML = `
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span class="category-name">${category}</span>
            <span class="category-amount">$${amount.toFixed(2)}</span>
          </div>
          <div class="category-bar-container">
            <div class="category-bar">
              <div class="category-bar-fill" style="width: ${percentage}%"></div>
            </div>
          </div>
        </div>
      `;

      this.elements.categoryBreakdown.appendChild(item);
    });
  },

  renderMonthlySummary(monthlySummary) {
    if (Object.keys(monthlySummary).length === 0) {
      this.elements.monthlySummary.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <p class="empty-title">No monthly data available</p>
          <p class="empty-subtitle">Start adding transactions to see your monthly spending summary.</p>
        </div>
      `;
      return;
    }

    const sortedMonths = Object.entries(monthlySummary).sort((a, b) => b[0].localeCompare(a[0]));

    this.elements.monthlySummary.innerHTML = '';
    sortedMonths.forEach(([, data]) => {
      const card = document.createElement('div');
      card.className = 'month-card';

      card.innerHTML = `
        <div class="month-name">${data.name}</div>
        <div class="month-total">$${data.total.toFixed(2)}</div>
        <div class="month-count">${data.count} transaction${data.count !== 1 ? 's' : ''}</div>
      `;

      this.elements.monthlySummary.appendChild(card);
    });
  },

  switchView(viewName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });

    // Show selected view
    const viewMap = {
      'overview': 'overview-view',
      'transactions': 'transactions-view',
      'monthly': 'monthly-view',
      'categories': 'categories-view'
    };

    const viewId = viewMap[viewName];
    if (viewId) {
      const viewElement = document.getElementById(viewId);
      if (viewElement) viewElement.classList.add('active');
    }

    // Update tab buttons
    document.querySelectorAll('.dash-tab-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.view === viewName) {
        btn.classList.add('active');
      }
    });
  },

  updateDashboardPreview(spending, budget, transactions) {
    const remaining = budget - spending;
    const percentage = budget > 0 ? Math.min((spending / budget) * 100, 100) : 0;

    // Update preview cards in landing page
    const previewBudget = document.getElementById('preview-budget');
    const previewSpent = document.getElementById('preview-spent');
    const previewRemaining = document.getElementById('preview-remaining');
    const previewProgressBar = document.getElementById('preview-progress-bar');
    const previewProgressText = document.getElementById('preview-progress-text');
    const previewTransactions = document.getElementById('preview-transactions');

    if (previewBudget) previewBudget.textContent = `$${budget.toFixed(2)}`;
    if (previewSpent) previewSpent.textContent = `$${spending.toFixed(2)}`;
    if (previewRemaining) previewRemaining.textContent = `$${remaining.toFixed(2)}`;
    if (previewProgressBar) previewProgressBar.style.width = `${percentage}%`;
    if (previewProgressText) previewProgressText.textContent = `${percentage.toFixed(0)}%`;

    // Update recent transactions
    if (previewTransactions) {
      if (transactions.length === 0) {
        previewTransactions.innerHTML = '<div class="mockup-empty">No transactions yet. Add some to see them here.</div>';
      } else {
        const recentTransactions = transactions.slice(0, 5);
        previewTransactions.innerHTML = '';
        
        recentTransactions.forEach(transaction => {
          const item = document.createElement('div');
          item.className = 'mockup-transaction-item';
          item.innerHTML = `
            <div class="mockup-transaction-info">
              <span class="mockup-transaction-category">${transaction.category}</span>
              <span class="mockup-transaction-date">${this.formatDate(transaction.date)}</span>
            </div>
            <span class="mockup-transaction-amount">$${transaction.amount.toFixed(2)}</span>
          `;
          previewTransactions.appendChild(item);
        });
      }
    }
  },

  showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
      errorElement.textContent = message;
      setTimeout(() => {
        errorElement.textContent = '';
      }, 3000);
    }
  },

  clearForm() {
    this.elements.transactionForm.reset();
    this.setDefaultDate();
  },

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  },

  applyTheme() {
    const theme = StorageService.loadTheme();
    const body = document.body;
    const icon = this.elements.themeToggle.querySelector('.icon');

    if (theme === 'dark') {
      body.classList.add('dark-mode');
      icon.textContent = '🌙';
    } else {
      body.classList.remove('dark-mode');
      icon.textContent = '☀️';
    }
  },

  toggleTheme() {
    const body = document.body;
    const icon = this.elements.themeToggle.querySelector('.icon');
    
    body.classList.toggle('dark-mode');
    
    if (body.classList.contains('dark-mode')) {
      StorageService.saveTheme('dark');
      icon.textContent = '🌙';
    } else {
      StorageService.saveTheme('light');
      icon.textContent = '☀️';
    }
  }
};

// ===================================
// Event Handler Module
// ===================================
const EventHandler = {
  init() {
    // Transaction form submission
    UIController.elements.transactionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleTransactionSubmit();
    });

    // Budget setting
    UIController.elements.setBudgetBtn.addEventListener('click', () => {
      this.handleBudgetSubmit();
    });

    // Custom category addition
    UIController.elements.addCategoryBtn.addEventListener('click', () => {
      this.handleCustomCategoryAdd();
    });

    // Theme toggle
    UIController.elements.themeToggle.addEventListener('click', () => {
      UIController.toggleTheme();
    });

    // Tab switching
    UIController.elements.dashTabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        UIController.switchView(view);
        
        // Update data when switching views
        if (view === 'monthly') {
          this.updateMonthlySummary();
        }
        
        if (view === 'categories') {
          this.updateCategoryBreakdown();
        }
      });
    });
  },

  handleTransactionSubmit() {
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const description = document.getElementById('description').value;

    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      UIController.showError('budget-error', 'Please enter a valid amount');
      return;
    }

    if (!category) {
      UIController.showError('budget-error', 'Please select a category');
      return;
    }

    if (!date) {
      UIController.showError('budget-error', 'Please select a date');
      return;
    }

    // Add transaction
    TransactionManager.addTransaction(amount, category, date, description);

    // Update UI
    this.updateAllViews();

    // Clear form
    UIController.clearForm();
  },

  handleBudgetSubmit() {
    const budget = UIController.elements.budgetInput.value;

    if (!budget || parseFloat(budget) <= 0) {
      UIController.showError('budget-error', 'Please enter a valid budget amount');
      return;
    }

    BudgetManager.setBudget(budget);
    this.updateBudgetDisplay();
    UIController.elements.budgetInput.value = '';
  },

  handleTransactionDelete(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
      TransactionManager.deleteTransaction(id);
      this.updateAllViews();
    }
  },

  handleCustomCategoryAdd() {
    const categoryName = UIController.elements.customCategoryInput.value;
    const result = CategoryManager.addCustomCategory(categoryName);

    if (!result.success) {
      UIController.showError('category-error', result.error);
      return;
    }

    UIController.updateCategoryDropdown();
    UIController.elements.customCategoryInput.value = '';
    this.updateCategoryBreakdown();
  },

  updateAllViews() {
    const transactions = TransactionManager.getAllTransactions();
    const budget = BudgetManager.getBudget();
    const spending = BudgetManager.calculateTotalSpending(transactions);
    const status = BudgetManager.getBudgetStatus(spending, budget);
    const categoryTotals = BudgetManager.calculateSpendingByCategory(transactions);

    UIController.renderTransactionList(transactions);
    UIController.renderBudgetSummary(spending, budget, status);
    UIController.renderRecentTransactions(transactions);
    UIController.renderHeroRecentTransactions(transactions);
    UIController.renderCategoryChart(categoryTotals);
    UIController.updateDashboardPreview(spending, budget, transactions);
    this.updateCategoryBreakdown();
  },

  updateBudgetDisplay() {
    const transactions = TransactionManager.getAllTransactions();
    const budget = BudgetManager.getBudget();
    const spending = BudgetManager.calculateTotalSpending(transactions);
    const status = BudgetManager.getBudgetStatus(spending, budget);

    UIController.renderBudgetSummary(spending, budget, status);
    UIController.updateDashboardPreview(spending, budget, transactions);
  },

  updateCategoryBreakdown() {
    const transactions = TransactionManager.getAllTransactions();
    const categoryTotals = BudgetManager.calculateSpendingByCategory(transactions);
    UIController.renderCategoryBreakdown(categoryTotals);
  },

  updateMonthlySummary() {
    const transactions = TransactionManager.getAllTransactions();
    const monthlySummary = CalculationEngine.groupByMonth(transactions);
    UIController.renderMonthlySummary(monthlySummary);
  }
};

// ===================================
// Application Initializer
// ===================================
const App = {
  init() {
    // Initialize all modules
    CategoryManager.init();
    TransactionManager.init();
    BudgetManager.init();
    UIController.init();
    EventHandler.init();

    // Load and display initial data
    this.loadInitialData();
  },

  loadInitialData() {
    const transactions = TransactionManager.getAllTransactions();
    const budget = BudgetManager.getBudget();
    const spending = BudgetManager.calculateTotalSpending(transactions);
    const status = BudgetManager.getBudgetStatus(spending, budget);
    const categoryTotals = BudgetManager.calculateSpendingByCategory(transactions);

    UIController.renderTransactionList(transactions);
    UIController.renderBudgetSummary(spending, budget, status);
    UIController.renderRecentTransactions(transactions);
    UIController.renderHeroRecentTransactions(transactions);
    UIController.renderCategoryChart(categoryTotals);
    UIController.updateDashboardPreview(spending, budget, transactions);
    UIController.renderCategoryBreakdown(categoryTotals);
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
  initSmoothScroll();
  initViewportAnimations();
  initScrollToTop();
  initFAQAccordion();
});

// ===================================
// Smooth Scroll Navigation
// ===================================
function initSmoothScroll() {
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      
      if (href.startsWith('#')) {
        e.preventDefault();
        
        const targetId = href.substring(1);
        const targetSection = document.getElementById(targetId);
        
        if (targetSection) {
          const navbarHeight = document.querySelector('.navbar').offsetHeight;
          const targetPosition = targetSection.offsetTop - navbarHeight;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
        
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  });
  
  // Update active link on scroll
  const sections = document.querySelectorAll('section[id]');
  
  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    
    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 100;
      const sectionId = section.getAttribute('id');
      
      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  });
}

// ===================================
// Viewport Animations
// ===================================
function initViewportAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-view');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  const animateElements = document.querySelectorAll('.feature-card, .faq-item, .dashboard-mockup');
  animateElements.forEach(el => observer.observe(el));
}

// ===================================
// Scroll to Top Button
// ===================================
function initScrollToTop() {
  const scrollBtn = document.createElement('button');
  scrollBtn.innerHTML = '↑';
  scrollBtn.className = 'scroll-to-top';
  scrollBtn.setAttribute('aria-label', 'Scroll to top');
  document.body.appendChild(scrollBtn);
  
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      scrollBtn.classList.add('visible');
    } else {
      scrollBtn.classList.remove('visible');
    }
  });
  
  scrollBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// ===================================
// FAQ Accordion
// ===================================
function initFAQAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('h3');
    const answer = item.querySelector('p');
    
    question.style.cursor = 'pointer';
    question.style.userSelect = 'none';
    
    const icon = document.createElement('span');
    icon.className = 'faq-icon';
    icon.textContent = '+';
    question.appendChild(icon);
    
    answer.style.maxHeight = answer.scrollHeight + 'px';
    answer.classList.add('faq-open');
    
    question.addEventListener('click', () => {
      const isOpen = answer.classList.contains('faq-open');
      
      if (isOpen) {
        answer.style.maxHeight = '0';
        answer.classList.remove('faq-open');
        icon.textContent = '+';
        icon.style.transform = 'rotate(0deg)';
      } else {
        answer.style.maxHeight = answer.scrollHeight + 'px';
        answer.classList.add('faq-open');
        icon.textContent = '−';
        icon.style.transform = 'rotate(90deg)';
      }
    });
  });
}

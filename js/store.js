/* ==========================================================================
   Store - State & Local Storage Management (Clean Slate & Dual Income/Expense)
   ========================================================================== */

const STORAGE_KEYS = {
  TRANSACTIONS: 'sheetflow_transactions_v2', // v2 for clean zero-demo start
  BUDGET: 'sheetflow_monthly_budget',
  WEBHOOK_URL: 'sheetflow_webhook_url',
  CURRENCY: 'sheetflow_currency',
  SYNC_QUEUE: 'sheetflow_pending_queue',
};

// Expense Categories
const EXPENSE_CATEGORIES = [
  { name: 'Food & Drinks', icon: '🍔', color: '#F97316' },
  { name: 'Groceries', icon: '🛒', color: '#10B981' },
  { name: 'Transport & Fuel', icon: '🚗', color: '#38BDF8' },
  { name: 'Shopping', icon: '🛍️', color: '#EC4899' },
  { name: 'Bills & Utilities', icon: '⚡', color: '#FBBF24' },
  { name: 'Education', icon: '📚', color: '#8B5CF6' },
  { name: 'Entertainment', icon: '🎬', color: '#6366F1' },
  { name: 'Health & Medical', icon: '💊', color: '#14B8A6' },
  { name: 'Rent & Housing', icon: '🏠', color: '#06B6D4' },
  { name: 'Personal Care', icon: '💅', color: '#F43F5E' },
  { name: 'Other Expense', icon: '🏷️', color: '#94A3B8' },
];

// Income Categories
const INCOME_CATEGORIES = [
  { name: 'Salary', icon: '💼', color: '#10B981' },
  { name: 'Freelance & Gigs', icon: '💻', color: '#38BDF8' },
  { name: 'Pocket Money / Allowance', icon: '💵', color: '#34D399' },
  { name: 'Business & Sales', icon: '📈', color: '#FBBF24' },
  { name: 'Investments & Dividends', icon: '📊', color: '#8B5CF6' },
  { name: 'Gifts & Rewards', icon: '🎁', color: '#EC4899' },
  { name: 'Rental Income', icon: '🏢', color: '#06B6D4' },
  { name: 'Other Income', icon: '💰', color: '#A3E635' },
];

const DEFAULT_MODES = ['UPI', 'Cash', 'Card', 'NetBanking'];

class Store {
  constructor() {
    this.expenseCategories = EXPENSE_CATEGORIES;
    this.incomeCategories = INCOME_CATEGORIES;
    this.modes = DEFAULT_MODES;
    this.currency = this._loadCurrency();
    this.monthlyBudget = this._loadBudget();
    this.webhookUrl = this._loadWebhookUrl();
    this.transactions = this._loadTransactions(); // Starts 100% empty!
    this.pendingQueue = this._loadPendingQueue();
  }

  _loadCurrency() {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENCY);
    return saved ? JSON.parse(saved) : { symbol: '₹', code: 'INR', locale: 'en-IN' };
  }

  setCurrency(curr) {
    this.currency = curr;
    localStorage.setItem(STORAGE_KEYS.CURRENCY, JSON.stringify(curr));
  }

  _loadBudget() {
    const saved = localStorage.getItem(STORAGE_KEYS.BUDGET);
    return saved ? parseFloat(saved) : 15000;
  }

  setBudget(budget) {
    this.monthlyBudget = Number(budget);
    localStorage.setItem(STORAGE_KEYS.BUDGET, this.monthlyBudget.toString());
  }

  _loadWebhookUrl() {
    return localStorage.getItem(STORAGE_KEYS.WEBHOOK_URL) || '';
  }

  setWebhookUrl(url) {
    this.webhookUrl = (url || '').trim();
    localStorage.setItem(STORAGE_KEYS.WEBHOOK_URL, this.webhookUrl);
  }

  // Load transactions without any demo data
  _loadTransactions() {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      // Empty by default for new users
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      // Clean up any legacy demo data if found
      const filtered = parsed.filter(t => !t.id.startsWith('TXN-1718000'));
      return filtered;
    } catch {
      return [];
    }
  }

  _saveTransactions() {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(this.transactions));
  }

  _loadPendingQueue() {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    return raw ? JSON.parse(raw) : [];
  }

  _savePendingQueue() {
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(this.pendingQueue));
  }

  /**
   * Add a transaction
   * @param {Object} item
   * @param {string} item.type - 'Expense' or 'Income'
   * @param {string} item.category - Category name
   * @param {number} item.amount - Amount
   * @param {string} item.mode - Payment mode (UPI, Cash, Card, etc.)
   * @param {string} item.source - For Expense: 'Income' (spent from income) or 'Other' (spent from savings/credit/other)
   * @param {string} item.notes - Optional note
   * @param {boolean} isSynced - Whether already synced to remote sheet
   */
  addTransaction(item, isSynced = false) {
    const isExpense = item.type === 'Expense';
    const cat = item.category || (isExpense ? 'Other Expense' : 'Other Income');
    const bucket = item.bucket || (isExpense ? (window.FinancialBrain ? window.FinancialBrain.categoryBuckets[cat] || 'Needs' : 'Needs') : 'Income');
    
    const txn = {
      id: item.id || `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: item.date || this.formatCurrentDate(),
      type: isExpense ? 'Expense' : 'Income',
      category: cat,
      bucket: bucket,
      amount: Number(item.amount) || 0,
      mode: item.mode || 'UPI',
      // Key feature: distinguish if expense is spent from income or other/savings
      source: isExpense ? (item.source || 'Income') : 'Direct',
      notes: item.notes || '',
      synced: isSynced,
    };

    // Prepend (newest first)
    this.transactions.unshift(txn);
    this._saveTransactions();

    if (!isSynced) {
      this.pendingQueue.push({ ...txn, action: 'UPSERT' });
      this._savePendingQueue();
    }

    return txn;
  }

  markSynced(id) {
    const txn = this.transactions.find(t => t.id === id);
    if (txn) txn.synced = true;
    this.pendingQueue = this.pendingQueue.filter(t => t.id !== id);
    this._saveTransactions();
    this._savePendingQueue();
  }

  setRemoteTransactions(list) {
    const pendingIds = new Set(this.pendingQueue.map(p => p.id));
    const pendingItems = this.transactions.filter(t => pendingIds.has(t.id));

    const syncedRemote = list.map(item => ({
      ...item,
      amount: Number(item.amount) || 0,
      source: item.source || (item.type === 'Expense' ? 'Income' : 'Direct'),
      synced: true,
    }));

    this.transactions = [...pendingItems, ...syncedRemote];
    this._saveTransactions();
  }

  deleteTransaction(id) {
    this.transactions = this.transactions.filter(t => t.id !== id);
    this.pendingQueue = this.pendingQueue.filter(t => t.id !== id);
    this._saveTransactions();
    this._savePendingQueue();
  }

  formatCurrentDate() {
    return new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  getTotals() {
    let totalExpense = 0;
    let spentFromIncome = 0;
    let spentFromOther = 0;
    let totalIncome = 0;

    for (const t of this.transactions) {
      const amt = Number(t.amount) || 0;
      if (t.type === 'Expense') {
        totalExpense += amt;
        if (t.source === 'Other') {
          spentFromOther += amt;
        } else {
          spentFromIncome += amt;
        }
      } else if (t.type === 'Income') {
        totalIncome += amt;
      }
    }

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remainingDays = Math.max(1, (daysInMonth - now.getDate()) + 1);

    // Remaining available from Income specifically
    const unspentIncome = Math.max(0, totalIncome - spentFromIncome);

    // If budget is set, calculate remaining budget against total expense
    const remainingBudget = Math.max(0, this.monthlyBudget - totalExpense);

    // Weekend-Weighted Self-Healing Safe Daily Spend (1.35x Saturday & Sunday)
    const safeDailySpend = window.FinancialBrain
      ? window.FinancialBrain.calculateWeightedSafeSpend(this.monthlyBudget, totalExpense)
      : (remainingBudget > 0 ? Math.round(remainingBudget / remainingDays) : 0);

    // 7-day EWMA Daily Burn Rate
    const ewmaBurnRate = window.FinancialBrain
      ? window.FinancialBrain.calculateEwmaBurnRate(this.transactions)
      : 0;

    // Month-End AI Forecast
    const forecast = window.FinancialBrain
      ? window.FinancialBrain.calculateMonthEndForecast(this.monthlyBudget, totalExpense, ewmaBurnRate)
      : { projectedTotal: totalExpense, projectedBalance: remainingBudget, onTrack: true };

    const percentSpent = this.monthlyBudget > 0 
      ? Math.min(100, (totalExpense / this.monthlyBudget) * 100)
      : 0;

    return {
      totalExpense,
      spentFromIncome,
      spentFromOther,
      totalIncome,
      unspentIncome,
      netSavings: totalIncome - totalExpense,
      monthlyBudget: this.monthlyBudget,
      remainingBudget,
      safeDailySpend,
      ewmaBurnRate,
      forecast,
      remainingDays,
      daysInMonth,
      percentSpent,
    };
  }

  formatCurrency(amount) {
    const val = Number(amount) || 0;
    return `${this.currency.symbol}${val.toLocaleString(this.currency.locale, {
      maximumFractionDigits: 0
    })}`;
  }

  getCategoryInfo(catName, type = 'Expense') {
    const list = type === 'Income' ? this.incomeCategories : this.expenseCategories;
    const found = list.find(c => c.name === catName);
    if (found) return found;

    // Cross-search if not found in preferred list
    const crossFound = (type === 'Income' ? this.expenseCategories : this.incomeCategories).find(c => c.name === catName);
    if (crossFound) return crossFound;

    return {
      name: catName,
      icon: type === 'Income' ? '💰' : '🏷️',
      color: '#94A3B8'
    };
  }
}

window.store = new Store();

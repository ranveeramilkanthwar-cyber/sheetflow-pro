/* ==========================================================================
   Financial Brain - Complex Financial Algorithms & Intelligence Engine
   - Algorithm A: EWMA Burn-Rate & Month-End Exhaustion Predictor
   - Algorithm B: Dynamic Self-Healing Safe-to-Spend (Weekend Multiplier 1.35x)
   - Algorithm C: Automated UPI & Bank SMS Deterministic Regex Parser
   - Algorithm D: Keyword Matrix + Levenshtein Auto-Categorizer
   - Algorithm E: 50 / 30 / 20 Budget Rule Allocation (Needs / Wants / Savings)
   ========================================================================== */

class FinancialBrain {
  // 50 / 30 / 20 Category Bucket Mapping
  static categoryBuckets = {
    'Food & Drinks': 'Needs',
    'Groceries': 'Needs',
    'Transport & Fuel': 'Needs',
    'Bills & Utilities': 'Needs',
    'Education': 'Needs',
    'Rent & Housing': 'Needs',
    'Health & Medical': 'Needs',
    'Shopping': 'Wants',
    'Entertainment': 'Wants',
    'Personal Care': 'Wants',
    'Dining & Outing': 'Wants',
    'Subscriptions': 'Wants',
    'Investments & Dividends': 'Savings',
    'Investments': 'Savings',
    'Salary': 'Income',
    'Freelance & Gigs': 'Income',
    'Pocket Money / Allowance': 'Income',
    'Business & Sales': 'Income',
    'Gifts & Rewards': 'Income',
    'Rental Income': 'Income',
    'Other Income': 'Income',
    'Other Expense': 'Needs',
  };

  // Keyword dictionary for instant zero-effort auto-categorization
  static keywordRules = {
    'chai': 'Food & Drinks',
    'tea': 'Food & Drinks',
    'coffee': 'Food & Drinks',
    'mess': 'Food & Drinks',
    'canteen': 'Food & Drinks',
    'snack': 'Food & Drinks',
    'zomato': 'Dining & Outing',
    'swiggy': 'Dining & Outing',
    'dominos': 'Dining & Outing',
    'mcdonalds': 'Dining & Outing',
    'kfc': 'Dining & Outing',
    'blinkit': 'Groceries',
    'zepto': 'Groceries',
    'instamart': 'Groceries',
    'dmart': 'Groceries',
    'milk': 'Groceries',
    'vegetable': 'Groceries',
    'auto': 'Transport & Fuel',
    'uber': 'Transport & Fuel',
    'ola': 'Transport & Fuel',
    'rapido': 'Transport & Fuel',
    'petrol': 'Transport & Fuel',
    'fuel': 'Transport & Fuel',
    'diesel': 'Transport & Fuel',
    'irctc': 'Transport & Fuel',
    'metro': 'Transport & Fuel',
    'bus': 'Transport & Fuel',
    'train': 'Transport & Fuel',
    'jio': 'Bills & Utilities',
    'airtel': 'Bills & Utilities',
    'vi': 'Bills & Utilities',
    'wifi': 'Bills & Utilities',
    'broadband': 'Bills & Utilities',
    'electricity': 'Bills & Utilities',
    'bescom': 'Bills & Utilities',
    'water': 'Bills & Utilities',
    'cylinder': 'Bills & Utilities',
    'gas': 'Bills & Utilities',
    'amazon': 'Shopping',
    'flipkart': 'Shopping',
    'myntra': 'Shopping',
    'meesho': 'Shopping',
    'zara': 'Shopping',
    'h&m': 'Shopping',
    'netflix': 'Subscriptions',
    'spotify': 'Subscriptions',
    'prime': 'Subscriptions',
    'hotstar': 'Subscriptions',
    'youtube': 'Subscriptions',
    'gym': 'Health & Medical',
    'medicine': 'Health & Medical',
    'pharmacy': 'Health & Medical',
    'doctor': 'Health & Medical',
    'apollo': 'Health & Medical',
    '1mg': 'Health & Medical',
    'sip': 'Investments & Dividends',
    'mutual': 'Investments & Dividends',
    'zerodha': 'Investments & Dividends',
    'groww': 'Investments & Dividends',
    'stock': 'Investments & Dividends',
    'rent': 'Rent & Housing',
    'maintenance': 'Rent & Housing',
    'book': 'Education',
    'course': 'Education',
    'udemy': 'Education',
    'xerox': 'Education',
    'print': 'Education',
    'salary': 'Salary',
    'freelance': 'Freelance & Gigs',
    'upwork': 'Freelance & Gigs',
    'fiverr': 'Freelance & Gigs',
  };

  /**
   * Levenshtein Distance for typo tolerance & fuzzy note matching
   */
  static levenshtein(a, b) {
    const s1 = a.toLowerCase();
    const s2 = b.toLowerCase();
    const track = Array(s2.length + 1).fill(null).map(() =>
      Array(s1.length + 1).fill(null));
    for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
    for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;
    for (let j = 1; j <= s2.length; j += 1) {
      for (let i = 1; i <= s1.length; i += 1) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    return track[s2.length][s1.length];
  }

  static similarity(a, b) {
    if (!a || !b) return 0;
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1.0;
    const dist = this.levenshtein(a, b);
    return 1 - (dist / maxLen);
  }

  /**
   * Algorithm D: Predict Category & Bucket from Note
   */
  static predictCategory(note, history = []) {
    const clean = (note || '').toLowerCase().trim();
    if (!clean) {
      return { category: 'Food & Drinks', bucket: 'Needs' };
    }

    // 1. Check historical transactions for exact or fuzzy match (>0.80 similarity)
    for (const item of history) {
      if (item.notes) {
        const itemNote = item.notes.toLowerCase().trim();
        if (itemNote === clean || clean.includes(itemNote) || itemNote.includes(clean)) {
          return {
            category: item.category,
            bucket: item.bucket || this.categoryBuckets[item.category] || 'Needs'
          };
        }
        if (clean.length >= 4 && this.similarity(clean, itemNote) >= 0.80) {
          return {
            category: item.category,
            bucket: item.bucket || this.categoryBuckets[item.category] || 'Needs'
          };
        }
      }
    }

    // 2. Keyword Dictionary match
    for (const [kw, cat] of Object.entries(this.keywordRules)) {
      if (clean.includes(kw)) {
        return {
          category: cat,
          bucket: this.categoryBuckets[cat] || 'Needs'
        };
      }
    }

    return { category: 'Food & Drinks', bucket: 'Needs' };
  }

  /**
   * Algorithm C: Automated UPI & Bank SMS Regex Parser
   * Parses raw Indian Bank / UPI SMS text into structured transaction fields
   */
  static parseUpiSms(rawSms, history = []) {
    if (!rawSms || typeof rawSms !== 'string') return null;

    // Amount regex
    const amountRegex = /(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.\d{1,2})?)/i;
    const match = rawSms.match(amountRegex);
    if (!match) return null;

    const rawAmt = match[1].replace(/,/g, '');
    const amount = parseFloat(rawAmt);
    if (!amount || amount <= 0) return null;

    // Debit vs Credit detection
    const isCredit = /\b(credited|received|deposited|refund)\b/i.test(rawSms);

    // Merchant / VPA extraction
    let merchant = isCredit ? "Incoming Payment" : "UPI Transaction";
    const merchantRegex = /(?:to|at|from|VPA)\s+([A-Za-z0-9.\-_@\s]{3,25}?)(?:\s+on|\s+Ref|\s+UPI|\.|$)/i;
    const mMatch = rawSms.match(merchantRegex);
    if (mMatch && mMatch[1]) {
      merchant = mMatch[1].trim();
    }

    const prediction = this.predictCategory(merchant, history);

    return {
      amount,
      type: isCredit ? 'Income' : 'Expense',
      notes: merchant,
      category: isCredit ? 'Pocket Money / Allowance' : prediction.category,
      bucket: isCredit ? 'Income' : prediction.bucket,
      mode: 'UPI',
      source: isCredit ? 'Direct' : 'Income'
    };
  }

  /**
   * Algorithm A: 7-day Exponentially Weighted Moving Average (EWMA) daily burn rate
   * alpha = 2 / (N + 1) = 2 / 8 = 0.25 (7-day window)
   */
  static calculateEwmaBurnRate(txns = []) {
    const now = new Date();
    const alpha = 2 / (7 + 1); // 0.25
    let ewma = 0.0;

    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const daySpend = txns.filter(t => {
        if (t.type !== 'Expense') return false;
        const d = new Date(t.date);
        return !isNaN(d) &&
          d.getFullYear() === targetDate.getFullYear() &&
          d.getMonth() === targetDate.getMonth() &&
          d.getDate() === targetDate.getDate();
      }).reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      if (i === 6) {
        ewma = daySpend;
      } else {
        ewma = (alpha * daySpend) + ((1 - alpha) * ewma);
      }
    }
    return Math.round(ewma);
  }

  /**
   * Algorithm B: Weekend-Weighted Self-Healing Safe Daily Spend
   * Allocates 1.35x higher allowance for Saturdays and Sundays
   */
  static calculateWeightedSafeSpend(monthlyBudget, spentSoFar) {
    const remaining = monthlyBudget - spentSoFar;
    if (remaining <= 0) return 0;

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    let weekdaysLeft = 0;
    let weekendsLeft = 0;

    for (let d = now.getDate(); d <= daysInMonth; d++) {
      const dayOfWeek = new Date(now.getFullYear(), now.getMonth(), d).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        weekendsLeft++;
      } else {
        weekdaysLeft++;
      }
    }

    const denominator = weekdaysLeft + (1.35 * weekendsLeft);
    const baseWeekdaySafe = remaining / (denominator > 0 ? denominator : 1);
    const todayDay = now.getDay();
    const isTodayWeekend = todayDay === 0 || todayDay === 6;

    const safeSpend = isTodayWeekend ? baseWeekdaySafe * 1.35 : baseWeekdaySafe;
    return Math.round(safeSpend);
  }

  /**
   * Algorithm A (continued): Month-End Exhaustion & Runway Predictor
   */
  static calculateMonthEndForecast(monthlyBudget, spentSoFar, ewmaBurnRate) {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = Math.max(1, (daysInMonth - now.getDate()) + 1);

    const projectedTotal = spentSoFar + (ewmaBurnRate * daysRemaining);
    const projectedBalance = monthlyBudget - projectedTotal;

    let daysUntilBroke = null;
    if (ewmaBurnRate > 0) {
      const remainingFunds = monthlyBudget - spentSoFar;
      if (remainingFunds > 0) {
        daysUntilBroke = Math.floor(remainingFunds / ewmaBurnRate);
      } else {
        daysUntilBroke = 0;
      }
    }

    return {
      projectedTotal: Math.round(projectedTotal),
      projectedBalance: Math.round(projectedBalance),
      daysUntilBroke,
      daysRemaining,
      onTrack: projectedBalance >= 0
    };
  }

  /**
   * Algorithm E: 50 / 30 / 20 Budget Rule Allocation
   */
  static calculate50_30_20(txns = [], monthlyBudget = 15000) {
    let needsSpent = 0;
    let wantsSpent = 0;
    let savingsSpent = 0;

    txns.filter(t => t.type === 'Expense').forEach(t => {
      const bucket = t.bucket || this.categoryBuckets[t.category] || 'Needs';
      const amt = Number(t.amount) || 0;
      if (bucket === 'Needs') needsSpent += amt;
      else if (bucket === 'Wants') wantsSpent += amt;
      else if (bucket === 'Savings') savingsSpent += amt;
    });

    const needsTarget = monthlyBudget * 0.50;
    const wantsTarget = monthlyBudget * 0.30;
    const savingsTarget = monthlyBudget * 0.20;

    return {
      needsSpent,
      needsTarget,
      needsRatio: needsTarget > 0 ? Math.min(100, (needsSpent / needsTarget) * 100) : 0,
      wantsSpent,
      wantsTarget,
      wantsRatio: wantsTarget > 0 ? Math.min(100, (wantsSpent / wantsTarget) * 100) : 0,
      savingsSpent,
      savingsTarget,
      savingsRatio: savingsTarget > 0 ? Math.min(100, (savingsSpent / savingsTarget) * 100) : 0,
    };
  }
}

window.FinancialBrain = FinancialBrain;

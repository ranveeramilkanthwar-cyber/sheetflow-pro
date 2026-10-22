/* ==========================================================================
   Sync - Webhook Bridge Engine (Batch Upsert & Delete, LockService Support)
   ========================================================================== */

class SyncEngine {
  constructor(store) {
    this.store = store;
    this.isSyncing = false;
    this.listeners = [];
  }

  onStatusChange(fn) {
    this.listeners.push(fn);
  }

  _notify(status, message) {
    this.listeners.forEach(fn => fn({ status, message, timestamp: Date.now() }));
  }

  // Fetch transactions from Google Sheets / n8n Webhook
  async fetchFromSheet() {
    const url = this.store.webhookUrl;
    if (!url) {
      this._notify('disconnected', 'No webhook URL configured (running in local mode)');
      return { success: false, reason: 'no_url' };
    }

    this.isSyncing = true;
    this._notify('syncing', 'Fetching latest data from sheet...');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        this.store.setRemoteTransactions(data);
        this._notify('connected', `Synced ${data.length} transactions from cloud sheet`);
        return { success: true, count: data.length };
      } else {
        throw new Error('Response format is not an array of transactions');
      }
    } catch (err) {
      console.warn('Sync Fetch Error:', err);
      this._notify('error', `Sync failed: ${err.message || 'Network error'}`);
      return { success: false, error: err };
    } finally {
      this.isSyncing = false;
    }
  }

  // Push single transaction (or delete action)
  async pushTransaction(txn, action = 'UPSERT') {
    const url = this.store.webhookUrl;
    if (!url) {
      return { success: false, reason: 'local_only' };
    }

    const bucket = txn.bucket || (window.FinancialBrain ? window.FinancialBrain.categoryBuckets[txn.category] || 'Needs' : 'Needs');
    const itemData = {
      id: txn.id,
      date: txn.date,
      type: txn.type,
      category: txn.category,
      bucket: bucket,
      amount: Number(txn.amount),
      mode: txn.mode,
      source: txn.source || (txn.type === 'Expense' ? 'Income' : 'Direct'),
      notes: txn.notes || ''
    };

    const payload = JSON.stringify({
      action: action,
      items: [itemData]
    });

    try {
      // Use text/plain to avoid browser CORS preflight
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: payload,
      });

      this.store.markSynced(txn.id);
      this._notify('connected', 'Synced with cloud sheet');
      return { success: true };
    } catch (err) {
      console.warn('Push error, trying mode: no-cors', err);
      try {
        await fetch(url, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: payload,
        });
        this.store.markSynced(txn.id);
        this._notify('connected', 'Sent to cloud sheet (opaque)');
        return { success: true };
      } catch (innerErr) {
        console.error('Failed to sync to sheet:', innerErr);
        this._notify('error', 'Saved locally (pending sync)');
        return { success: false, error: innerErr };
      }
    }
  }

  // Push all pending transactions (batch sync)
  async syncPendingQueue() {
    if (!this.store.webhookUrl) return;
    const queue = [...this.store.pendingQueue];
    if (queue.length === 0) return;

    this.isSyncing = true;
    this._notify('syncing', `Pushing ${queue.length} pending items...`);

    const upserts = queue.filter(q => q.action !== 'DELETE');
    const deletes = queue.filter(q => q.action === 'DELETE');

    let pushed = 0;

    // Batch upsert
    if (upserts.length > 0) {
      try {
        const payload = JSON.stringify({
          action: 'UPSERT',
          items: upserts.map(t => ({
            id: t.id,
            date: t.date,
            type: t.type,
            category: t.category,
            bucket: t.bucket || (window.FinancialBrain ? window.FinancialBrain.categoryBuckets[t.category] || 'Needs' : 'Needs'),
            amount: Number(t.amount),
            mode: t.mode,
            source: t.source || 'Income',
            notes: t.notes || ''
          }))
        });

        await fetch(this.store.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: payload,
        });
        upserts.forEach(t => this.store.markSynced(t.id));
        pushed += upserts.length;
      } catch (e) {
        // Fallback to sequential
        for (const item of upserts) {
          const res = await this.pushTransaction(item, 'UPSERT');
          if (res.success) pushed++;
        }
      }
    }

    // Deletes
    for (const del of deletes) {
      await this.pushTransaction(del, 'DELETE');
      this.store.pendingQueue = this.store.pendingQueue.filter(p => p.id !== del.id);
      this.store._savePendingQueue();
    }

    this.isSyncing = false;
    this._notify('connected', `Synchronized ${pushed} entries to Excel sheet!`);
  }

  // Test URL responsiveness
  async testConnection(url) {
    if (!url) return { ok: false, msg: 'URL cannot be empty' };
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) {
        return { ok: true, msg: 'Webhook verified successfully!' };
      }
      return { ok: false, msg: `Server returned status: ${res.status}` };
    } catch (e) {
      return { ok: false, msg: `Connection failed: ${e.message}` };
    }
  }
}

window.syncEngine = new SyncEngine(window.store);

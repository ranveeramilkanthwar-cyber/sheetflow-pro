# 💎 SheetFlow Pro — Enterprise Cloud Spreadsheet Ledger & Financial AI

SheetFlow Pro is a financial intelligence application and cloud spreadsheet ledger connected directly to **Google Sheets** and **Microsoft Excel (.xlsx)** via an idempotent serverless Webhook Bridge.

Available as both a **Web / PWA Application** (running live locally) and a **Flutter Mobile App**.

---

## 🌟 Key Architecture & Features

### 1. 0% Demo Data — Clean Financial Slate
- Launches in a pristine, clean state without artificial placeholder entries.
- Clear empty state prompts you to add your first real Income or Expense.

### 2. Dual-Engine: Separate Expense & Income Tracking
- **Income Management**: Track Salary, Freelance, Pocket Money, Business Sales, Investments, and Gifts with separate categories and positive cashflow indicators.
- **Expense Source Tracking**: When logging any expense, select where the money came from:
  - `💰 Current Income`: Deducts directly from your active monthly income pool.
  - `🏦 Other / Savings / Credit`: Tracks expenses funded by external savings or credit lines without eroding current month's cashflow.

### 3. Financial Intelligence Brain (`brain.js`)
- **Algorithm A (7-Day EWMA Daily Burn Rate)**: Exponentially Weighted Moving Average ($\alpha = 0.25$) forecasting month-end exhaustion and days of runway left.
- **Algorithm B (Weekend-Weighted Self-Healing Safe Daily Spend)**: Automatically weights Saturdays and Sundays at $1.35\times$ so weekend plans don't break your weekday discipline.
- **Algorithm C (Deterministic UPI / Bank SMS Parser)**: 1-Tap clipboard extraction for HDFC, SBI, ICICI, Axis, PayTM, PhonePe, and Google Pay SMS notifications.
- **Algorithm D (Levenshtein Distance Auto-Categorizer)**: Automatically tags categories and 50/30/20 buckets as you type note descriptions.
- **Algorithm E (50/30/20 Budget Rule Engine)**: Segregates expenditure into *Needs (50%)*, *Wants (30%)*, and *Savings (20%)*.

### 4. Visual Excellence & Aesthetic Themes
- 5 Luxury Curated Themes:
  1. `Midnight Void` (Deep OLED dark with cyan accents)
  2. `Aurora Borealis` (Emerald night sky with emerald & teal neon)
  3. `Sunset Mirage` (Warm dusk violet and coral orange)
  4. `Frost Glass` (Minimalist icy obsidian)
  5. `Gold Sovereign` (Ultra-luxury dark obsidian with warm champagne gold)
- Ambient floating gradient orbs, glassmorphic backdrop filters, and zero-dependency Web Audio synthesizers for tactile sounds.

### 5. Enterprise 4-Tab Relational Excel Ledger
A ready-to-use OpenXML workbook is generated on disk:
📁 `SheetFlow_Enterprise_Ledger.xlsx`
- **Tab 1: `1_Transactions`**: `ID`, `Timestamp`, `Type`, `Category`, `Bucket`, `Amount`, `Mode`, `Source`, `Notes`, `Is_Recurring`
- **Tab 2: `2_Budgets`**: Auto-calculating `SUMIFS` formulas linked to Tab 1.
- **Tab 3: `3_Recurring`**: Active subscription and bill auditor.
- **Tab 4: `4_Analytics`**: Month-by-month income, needs, wants, and net savings rate formulas.

---

## 🚀 Running the Apps

### Web / PWA App
- **Live Local Server**: [http://localhost:4321](http://localhost:4321)
- **1-Click Windows Launcher**: Double-click [`run_app.bat`](./run_app.bat)
- **Direct Browser File**: Open [`index.html`](./index.html) directly.

### Flutter Mobile App
- Location: [`../sheetflow_pro_flutter/`](../sheetflow_pro_flutter/)
- Scaffolded with `lib/main.dart`, `pubspec.yaml`, and Android network permissions.
- To run on mobile/emulator:
  ```bash
  cd sheetflow_pro_flutter
  flutter pub get
  flutter run
  ```

---

## 🔗 Connecting Your Google Sheet / Excel File

### Option A: Use the Pre-Built Ledger
1. Open [`SheetFlow_Enterprise_Ledger.xlsx`](./SheetFlow_Enterprise_Ledger.xlsx) in Microsoft Excel or upload it to Google Drive / OneDrive.
2. In Google Sheets, click **Extensions ➔ Apps Script**, paste the script from the app's **Setup Guide (📘)**, and click **Deploy ➔ Web App**.
3. Copy your Web App URL and paste it into **SheetFlow Settings (⚙️)**.

### Option B: Connect an Existing Sheet
Provide your Google Sheets or OneDrive link in the chat, or open **SheetFlow Settings ➔ Webhook URL** and paste your Web App endpoint. SheetFlow Pro will automatically serialize, upsert, and sync your data with lock-safe concurrency!

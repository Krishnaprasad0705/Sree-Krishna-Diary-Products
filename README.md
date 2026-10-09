# Sree Krishna Dairy Products (SKDP) — Admin Management Platform

A modern, responsive, full-stack administrative platform built for **Sree Krishna Dairy Products**, a family-owned Indian dairy business in Kanchipuram, Tamil Nadu specializing in farm-fresh pure cow milk and traditional A2 ghee.

![SKDP Logo](public/logo.png)

---

## 🌟 Key Features

* **Official Royal Navy & Gold Visual Identity**: Inspired directly by the official SKDP emblem with high-resolution branding.
* **Monthly Milk Subscription Engine**:
  * **Model A (Actual Delivery Billing)**: Charges customer per recorded daily delivery.
  * **Model B (Fixed Recurring Billing)**: Agreed fixed monthly charge with separate line-item accounting for extra milk.
  * Inline daily quantity adjustment & pause/resume controls.
* **Daily Delivery Tracker**:
  * Fast 1-tap logging (250ml, 500ml, 750ml, 1L, 1.5L, 2L, custom).
  * Bulk Batch recording for morning deliveries.
  * Separate tracking for additional/extra milk portions.
* **Quick Sale POS Counter**:
  * Touch-friendly checkout for walk-in counter sales.
  * Fresh Milk, Traditional A2 Ghee jars, and Farm Paneer packs.
  * Thermal/A4 receipt printing with itemized breakdown and discount support.
* **Payments & Flexible Settlements**:
  * Record customer payments on any arbitrary date (7th, 18th, anytime).
  * Automatic balance reduction, partial settlements, and overpayment customer credit.
  * Printable payment acknowledgement vouchers.
* **Monthly Invoices & Billing**:
  * Single and batch monthly bill generation.
  * Printable A4 invoice layout with official business details, UPI QR payment information, and line-item breakdown.
* **Full Financial Customer Ledger**:
  * Chronological audit trail of all debits, credits, and running balances.
  * Full customer deletion and archiving with cascade cleanup.
* **Live Analytics & Reports**:
  * Real-time KPI summary cards, Recharts revenue trends, product breakdowns, receivables aging, and CSV export.
* **Stock & Inventory**:
  * Daily farm milk procurement logs and delivery deductions.
* **Offline-First Storage Engine + Supabase Ready**:
  * Fully functional out of the box with reactive localStorage persistence.
  * Production PostgreSQL schema with Row Level Security (RLS) provided in `src/db/schema.sql`.

---

## 🛠️ Technology Stack

* **Frontend**: React 18, TypeScript, Vite
* **Styling**: Tailwind CSS with custom Royal Navy & Gold tokens
* **Icons**: Lucide Icons
* **Charts**: Recharts
* **Backend / Database**: PostgreSQL / Supabase ready (`src/db/schema.sql`)
* **Testing**: Vitest (`npm test`)

---

## 🚀 Getting Started Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open **`http://localhost:5173/`** in your browser.
* **Default Owner Access PIN**: `1234` (or click *"One-Click Owner Demo Login"*).

### 3. Run Automated Tests
```bash
npm test
```

### 4. Build for Production
```bash
npm run build
```

---

## 🌐 How to Deploy

### Option 1: Deploy on Vercel (Recommended — 2 Minutes)

1. Push this repository to GitHub (instructions below).
2. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
3. Click **"Add New"** &rarr; **"Project"**.
4. Import your repository: `Krishnaprasad0705/Sree-Krishna-Diary-Products`.
5. Under Build and Output Settings:
   * **Framework Preset**: Vite
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
6. Click **Deploy**. Your application will be live at `https://your-project.vercel.app`!

---

### Option 2: Deploy on Netlify

1. Go to [netlify.com](https://netlify.com) and sign in.
2. Click **"Add new site"** &rarr; **"Import an existing project"**.
3. Select GitHub and choose `Sree-Krishna-Diary-Products`.
4. Configure build settings:
   * **Build command**: `npm run build`
   * **Publish directory**: `dist`
5. Click **Deploy Site**.

---

### Option 3: Optional Supabase Database Connection

If you want to sync data with a cloud PostgreSQL database:
1. Create a project on [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in Supabase and paste the contents of [`src/db/schema.sql`](src/db/schema.sql).
3. In Vercel / Netlify environment variables (or in your local `.env`), add:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

---

## 📄 License
Private commercial software for **Sree Krishna Dairy Products**. All rights reserved.

# FreightPulse AI — Multi-Tenant Lead Research & Cold Outreach Platform

FreightPulse AI is a full-stack, production-ready, multi-tenant B2B cold outreach & lead intelligence platform designed for the freight forwarding and global logistics industry.

---

## 🚀 Key Features

- **Lead Intelligence & Ingestion:**
  - Bulk Drag-and-Drop CSV & Excel (.xlsx/.xls) uploader with automatic header mapping.
  - Interactive multi-select data grid with filters (Country, Status, Source) and CSV export.
  - Manual single lead creation wizard.
- **Autonomous Web Crawling & Gemini AI Enrichment:**
  - Cheerio-based web scraper that extracts company context, trade services, and operational footprints.
  - Google Gemini 1.5 Flash structured synthesis producing executive synopses, capacity indicators, high-converting trade corridor subject lines, and non-generic cold outreach pitches.
- **Self Brand Profile Synchronization:**
  - Freight agency identity form (Air, Ocean, Customs, Cold Chain, Project Cargo).
  - Target trade corridors and industry accreditations (IATA, FIATA, WCA).
  - Standard outgoing signature with live AI Prompt Benchmark Simulator.
- **Outreach & Nodemailer SMTP Transport:**
  - BYOK (Bring Your Own Key) Google Gemini API key configuration with live connection test.
  - Custom SMTP setup (Google Workspace, Office 365, Resend, SendGrid) with handshake validator and test email sender.
  - Autonomous auto-send toggle and hourly throttling controls.
- **Interactive Sliding Lead Drawer:**
  - Deep prospect intelligence view, editable email draft, live HTML/Markdown preview, and one-click "Approve & Send" with celebratory confetti feedback.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14+ (App Router), TypeScript
- **Styling:** Tailwind CSS, PostCSS, Lucide React
- **Database & Auth:** Supabase (PostgreSQL, Row-Level Security, Database Triggers)
- **AI Engine:** Google Gemini API (`@google/generative-ai`)
- **Email Engine:** Nodemailer SMTP
- **Scraper:** Cheerio, Fetch with safety timeouts
- **Charts & UI:** Recharts, PapaParse, XLSX, Canvas Confetti

---

## 📦 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/bkh786/email-outreach-automation.git
cd email-outreach-automation
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Credentials (Optional for Demo Mode, Required for Production Multi-Tenancy)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini API Key (Can also be set in /settings in the UI)
GEMINI_API_KEY=your-gemini-key

# Cron Secret for Vercel Cron or webhook authorization
CRON_SECRET=freightpulse_dev_secret

# Default Platform App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup (Supabase)

Run the SQL migration in your Supabase SQL Editor:
- [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 License

MIT License. Built for global freight forwarders and logistics professionals.

# Dokan POS (دکان) | Offline Accounting & Inventory System for Retail & Apparel

<div align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Dexie.js](https://img.shields.io/badge/Dexie.js-IndexedDB-336791?style=for-the-badge&logo=sqlite&logoColor=white)
![PWA Offline](https://img.shields.io/badge/PWA-100%25_Offline-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
![License MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)

<p align="center">
  <strong>A standalone, zero-cloud, high-performance Progressive Web Application (PWA) tailored for traditional bazaar merchants, apparel retailers, and boutiques.</strong>
  <br />
  Operates 100% offline directly on Android tablets, touch terminals, and smartphones without servers, subscriptions, or network latency.
</p>

[Key Features](#-key-features) • [Problem Statement](#-problem-statement) • [System Architecture](#-system-architecture) • [Android & Tablet Guide](#-how-to-install--use-on-android--tablets) • [Installation](#-installation--local-development) • [خلاصه فارسی](#-راهنمای-فارسی-پروژه-دکان)

</div>

---

## 📌 Problem Statement

In bustling wholesale markets and retail bazaars (such as Tehran Grand Bazaar, clothing boutiques, and wholesale apparel centers), retail operations face distinct operational hurdles:

1. **Unstable or Blocked Connectivity**: Network interruptions, DNS issues, and ISP outages paralyze cloud-based SaaS accounting software right during peak shopping hours.
2. **High Latency & Slow POS Operations**: Waiting for API roundtrips during checkout frustrates retail customers standing in line.
3. **Data Sovereignty & Privacy**: Merchants strongly prefer keeping sensitive financial records, customer debt ledgers, and profit margins stored securely on their physical hardware rather than on third-party servers.
4. **Apparel Industry Nuances**: Off-the-shelf generic POS applications lack built-in garment-specific attributes like dual sizing (numeric `36-54` & letter `S-5XL`), color variants, and pack/dozen (جین/بسته) packaging.

**Dokan POS (دکان)** solves this by adopting a **Pure Client-Side, Offline-First Architecture**. All data resides permanently in browser-managed IndexedDB with zero cloud dependencies, instant tactile feedback, and complete independence from internet availability.

---

## ✨ Key Features

### 👗 1. Apparel-Specific Inventory Matrix
* **Garment Sizing**: Native support for numeric sizes (36, 38, ..., 54) and letter sizes (XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL) plus custom freeform sizes.
* **Packaging Units**: Sell by Single Piece (تکی) or Pack/Dozen (جین / بسته) with automatic unit price calculations.
* **Cost vs. Selling Margin**: Tracks purchase cost per item alongside retail selling price to compute live margins.
* **Visual Low-Stock Safeguards**: Instant badges notifying when inventory hits critical thresholds (قرمز: کسری انبار).

### 🧾 2. Ergonomic Touch-First POS Engine
* **Ultra-Fast Invoice Generation**: Designed for one-thumb and tablet stylus workflows with minimum 44px+ touch targets.
* **Real-time Inventory Deductions**: Automatic stock adjustments when sales invoices are confirmed.
* **Flexible Multi-Payment Tenders**: Split payments between **Cash (نقد)**, **Store Credit / Deferred (نسیه)**, **Bank Card (کارتخوان)**, and **Promissory/Cheque (چک)**.
* **Instant Thermal / A4 Print**: CSS `@media print` optimized for standard 80mm thermal receipt printers and standard A4 formal invoices.

### 👥 3. Comprehensive Customer Ledger & Credit Limits
* **Debtor / Creditor Ledger (دفتر حساب دفتری)**: Instant visibility into who owes money (بدهکار) and outstanding supplier payables (بستانکار).
* **Credit Limit Enforcement (سقف اعتبار نسیه)**: Set per-customer credit caps with warning banners if a transaction exceeds credit safety.
* **Payment Logging (دریافت و پرداخت)**: Quick recording of cash or card debt settlements.

### 💳 4. Sayad Cheque Pipeline (مدیریت چک صیادی)
* **Status Lifecycle**: Track incoming and issued cheques through states: *Pending Clearance (در جریان وصول)*, *Cleared (پاس شده)*, *Bounced (برگشتی)*, *Endorsed/Spent (خرج شده)*.
* **Live Due-Date Countdown**: Real-time Jalali calendar counter highlighting upcoming deadlines (e.g. *«۲ روز مانده»* or *«سررسید گذشته»*).

### 📊 5. Expense Tracking & Net Profit Analytics
* **Operational Expense Ledger**: Track shop rent, staff wages, utility bills, courier/shipping fees, and incidental costs.
* **Net Profit Algorithm**: Automatically calculates **Net Realized Profit = (Invoice Revenue - COGS) - Operational Expenses**.

### 📱 6. Zero-Cost Receipt Sharing & SMS
* **Native Web Share API**: Share invoices and account balance reminders directly to WhatsApp, Telegram, Bale, or Eitaa without external API keys.
* **Direct SMS Intent (`sms:?body=...`)**: Automatically composes formatted payment reminders in the phone’s native SMS app with zero gateway fees.

### 💾 7. Offline Storage Engine & Single-Click Backup
* **Persistent IndexedDB**: Integrated with `navigator.storage.persist()` to protect against automatic browser cache evictions on mobile OSs.
* **One-Click JSON Migration**: Instant full-database export and restore within milliseconds, ensuring zero vendor lock-in.

---

## 🏛 System Architecture

Dokan POS operates on an **Offline-First Reactive Architecture** where IndexedDB is the authoritative single source of truth.

```
┌─────────────────────────────────────────────────────────────┐
│                       Dokan POS Client                      │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │             React 19 Touch Interface                │   │
│   │    (Tailwind CSS + Lucide Icons + Vazirmatn Font)   │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │ Dispatches mutations         │
│                              ▼                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                   Dexie.js ORM                      │   │
│   │           (Relational indexed schema layer)         │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │ Non-blocking async I/O       │
│                              ▼                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                 Browser IndexedDB                   │   │
│   │  [Products]  [Customers]  [Invoices]  [Cheques]     │   │
│   │  + navigator.storage.persist() Eviction Guard       │   │
│   └─────────────────────────────────────────────────────┘   │
│                              │                              │
│   ┌──────────────────────────┴──────────────────────────┐   │
│   │              Service Worker Cache (Workbox)         │   │
│   │     Precaches HTML, JS, CSS, SVGs & Web Fonts       │   │
│   │               Instant Offline Launch                │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌────────────────────────┐            ┌────────────────────────┐
│  Hardware Integrations │            │   Native Device APIs   │
│  - 80mm POS Thermal    │            │  - Web Share API       │
│  - Standard A4 Print   │            │  - Pre-filled SMS URL  │
└────────────────────────┘            └────────────────────────┘
```

---

## 📱 How to Install & Use on Android & Tablets

Dokan is built to function just like a native APK, installed straight through Google Chrome without going through the Play Store.

### Step 1: Open the Application in Chrome
1. Connect your Android tablet or mobile phone to the network (or launch from your local Vite server IP address, e.g. `https://192.168.1.103:5173`).
2. Open **Google Chrome** on your device and navigate to the address.

### Step 2: Install the App (PWA)
1. In Google Chrome, an automatic prompt **"Install app"** or **"Add Dokan to Home Screen"** will appear at the bottom.
2. If it does not appear automatically, tap the **Chrome Menu (three vertical dots `⋮`)** at the top right corner.
3. Select **"Install app" (نصب برنامه)** or **"Add to Home Screen" (افزودن به صفحه اصلی)**.
4. Confirm by clicking **"Install"**.

<div align="center">
  <img src="https://raw.githubusercontent.com/Erfannk/dokkan-pos/main/public/icon-512.png" width="96" height="96" alt="Dokan Icon" style="border-radius: 20px;" />
  <br />
  <em>The Dokan app icon will now appear directly in your device’s app drawer and home screen.</em>
</div>

### Step 3: 100% Offline Standalone Usage
* Once installed, launch **Dokan** from your home screen.
* It launches in **Standalone Fullscreen mode** with no browser address bar.
* **You can turn off Wi-Fi and Mobile Data completely** — the application will continue to load, process sales, update inventory, and manage accounts offline without any interruption.

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [React 19](https://react.dev/) | Component architecture, state hooks, high-performance UI rendering |
| **Build Tool** | [Vite 8](https://vite.dev/) | Sub-second HMR development and optimized production bundling |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) | Rapid, responsive utility-first styling with dark theme palette |
| **Database** | [Dexie.js 4](https://dexie.org/) | Type-safe, indexed transactional wrapper around native IndexedDB |
| **PWA & Cache**| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | Service worker lifecycle, precaching assets via Google Workbox |
| **Date & Calendar** | [jalaali-js](https://github.com/jalaali/jalaali-js) | Solar Hijri (شمسی) date calculations and formatting |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, accessible SVG iconography |
| **Linter** | [Oxlint](https://oxc.rs/) | Blazing-fast Rust-based static code analysis |

---

## 🚀 Installation & Local Development

### Prerequisites
* [Node.js](https://nodejs.org/) (version `18.0.0` or higher recommended)
* `npm` or `pnpm`

### 1. Clone the Repository
```bash
git clone https://github.com/erfanjll/dokkan-pos.git
cd dokkan-pos
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Launch Development Server
```bash
npm run dev
```
The server will boot with local HTTPS certificate support at:
`https://localhost:5173` (and your local network IP `https://192.168.x.x:5173` for testing on mobile devices over Wi-Fi).

### 4. Build Production Artifacts
```bash
npm run build
```
Production assets (including compiled service workers, manifests, and optimized chunks) are generated inside the `dist/` directory.

### 5. Run Linter
```bash
npm run lint
```

---

## 🖼 Screenshots Showcase

<div align="center">

| 📊 داشبورد و آمار روزانه | 🛒 صدور فاکتور و صندوق لمسی |
| :---: | :---: |
| *(Dashboard & Quick KPIs)* | *(Fast POS Touch Invoicing)* |

| 👗 انبار و مدیریت سایزبندی | 💳 دفتر چک‌های صیادی |
| :---: | :---: |
| *(Apparel Matrix & Stock)* | *(Sayad Cheque Tracker)* |

</div>

---

## 🇮🇷 راهنمای فارسی پروژه دکان

### درباره نرم‌افزار دکان
**دکان (Dokan POS)** یک وب‌اپلیکیشن پیش‌رونده (PWA) کاملاً مستقل، آفلاین و محلی است که به طور اختصاصی برای **فروشگاه‌ها، بوتیک‌ها، بنکداران و تولیدی‌های پوشاک** توسعه یافته است. این سیستم بدون نیاز به خرید اشتراک ماهانه، سرور اینترنتی، یا سخت‌افزارهای گران‌قیمت، روی تبلت‌ها و گوشی‌های اندرویدی اجرا می‌شود.

### مزایای اصلی:
1. **۱۰۰٪ آفلاین و بدون قطعی:** حتی با قطع کامل اینترنت بین‌الملل و ملی، تمامی عملیات ثبت فاکتور، ورود کالا، و تسویه‌حساب بدون وقفه انجام می‌شود.
2. **پشتیبانی تخصصی از پوشاک:** دارای جدول سایزبندی استاندارد عددی (۳۶ تا ۵۴)، حروفی (S تا 5XL) و بسته‌بندی جینی/تکی.
3. **دفتر نسیه و سقف اعتبار:** جلوگیری از ایجاد بدهی‌های مشکوک‌الوصول با تعیین سقف نسیه برای هر طرف‌حساب.
4. **روزشمار چک‌های صیادی:** نمایش زمان باقی‌مانده تا سررسید چک‌های دریافتی و پرداختی با رنگ‌بندی هشداردهنده.
5. **پشتیبان‌گیری امن و رایگان:** خروجی فایل پشتیبان JSON با یک کلیک بدون وابستگی به هیچ شرکت نرم‌افزاری.

---

## 🤝 Acknowledgements

* Developed using modern **Rapid Prototyping** and AI-assisted engineering methodologies with Google DeepMind Antigravity and Gemini.
* Built with dedication to Iran's retail community, boutique owners, and bazaar tradespeople.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — free for personal and commercial usage.

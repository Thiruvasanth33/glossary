# FreshPrice - Grocery Shop Price Management Dashboard

A complete, responsive, full-stack grocery shop price management website built with React 18, TypeScript, Tailwind CSS, Lucide Icons, and Supabase (PostgreSQL), featuring persistent multi-tab and multi-device synchronization, authoritative single-source price tracking, full audit price history, and voice-based product search in **English** and **Tamil**.

---

## 🌟 Key Features

1. **Home Dashboard**
   - Live metrics calculated directly from stored data: Total Categories, Total Products, Price Increases, Price Decreases, Recent Changes (last 7 days).
   - Fast Instant Price Checker with live suggestions.
   - Recently Updated Prices audit stream with before/after prices, differences (+₹5 / -₹3), and exact timestamps.
   - Recently Added Products feed.
   - Quick category shortcuts and one-click quick actions.

2. **View Grocery Prices Page (`/prices`)**
   - Category-grouped view matching standard supermarket aisles (Rice, Soap, Oil, Flour, Pulses and Dal, Sugar and Salt, Spices and Masala, Snacks and Biscuits, Beverages, Other Grocery Items).
   - Expand All / Collapse All accordion controls.
   - Clean desktop table and touch-friendly mobile cards.
   - Filters by Search query, Category dropdown, and Brand dropdown.
   - Sorting by Name (A-Z, Z-A), Selling Price (Low-High, High-Low), and Last Price Changed Date.
   - Print Price Catalog and Export to CSV features.

3. **Manage Products & Edit Prices (`/products`)**
   - Complete product management: Product Name, Category, Brand, Package Quantity (Value & Unit), Selling Price in Indian Rupees (₹), optional SKU, and Description.
   - Supported units: Gram (`g`), Kilogram (`kg`), Millilitre (`ml`), Litre (`L`), Piece, Packet, Box, Bottle, Dozen, Bundle, Tin.
   - Multi-brand & multi-quantity independence (e.g. *Ponni Rice Brand A 1kg @ ₹65*, *Ponni Rice Brand A 5kg @ ₹320*, *Ponni Rice Brand B 1kg @ ₹68*).
   - Quick Price Adjustment modal with ±₹1, ±₹2, ±₹5, ±₹10 steppers and real-time difference preview.
   - Safe deletion with prompt confirmation.

4. **Critical Authoritative Price Synchronization**
   - **One single source of truth:** When a price is modified (e.g., Ponni Rice from ₹60 to ₹65), every page (Dashboard, View Prices, Manage Products, Voice Search) updates immediately.
   - Automatic record creation in **Price History** with historical snapshots.
   - `last_price_changed_at` updates **only** when the price actually changes (not when editing product descriptions or SKUs).
   - Instant cross-tab sync powered by `BroadcastChannel` and optional Supabase Realtime for cloud-connected devices.

5. **Category Management (`/categories`)**
   - Add custom categories, rename existing categories, and adjust display priorities.
   - Reorder categories dynamically with Up/Down controls.
   - View assigned products count with quick jump to filtered catalog.
   - **Delete Protection:** Prevents accidental deletion of categories containing products. Requires reassigning products to an alternate category before deletion.

6. **Voice-Based Grocery Search (`/voice-search` and Header Modal)**
   - Real device microphone audio recognition using Web Speech API.
   - Language selector: **English (India - `en-IN`)**, **Tamil (India - `ta-IN`)**, and **English (US - `en-US`)**.
   - Intelligent NLP parser for English, Tamil, and Tanglish phrases:
     - *"Show Ponni Rice"* -> matches all Ponni rice varieties.
     - *"Find five kilogram Ponni Rice"* -> prioritizes 5 kg package size.
     - *"Show sunflower oil one litre"* -> prioritizes 1 L sunflower oil.
     - *"Ponni rice kaattunga"* (Tamil command) -> displays Ponni rice products and prices.
     - *"Toor dal vilai sollunga"* (Tamil command) -> displays dal prices.
     - *"Coconut oil irukka?"* (Tamil command) -> displays coconut oil products.
   - Clear visual states: Ready, Listening (audio visualizer wave), Processing NLP, Results Found, No Results, and Permission Denied fallback to keyboard search.

7. **Price Change History (`/history`)**
   - Immutable audit log storing: History ID, Product Name snapshot, Brand snapshot, Quantity snapshot, Previous Price, New Price, Price Difference (+₹5 / -₹3), Changed Date & Time (formatted Asia/Kolkata), and User.
   - Retains complete historical snapshots even if products are renamed or deleted in the future.
   - Filters by Direction (Increases / Decreases), Date Range (24h, 7d, 30d, All Time), and Search keywords.
   - Export History to CSV.

8. **Settings & Database Configuration (`/settings`)**
   - Store name customization and currency display (INR ₹).
   - Dual-mode architecture:
     - **Persistent Local Storage Mode:** Works out of the box with zero external configuration. Includes cross-tab synchronization.
     - **Supabase Cloud Mode:** Direct connection to PostgreSQL on Supabase for multi-device sync across phones, tablets, and computers. Includes live connection tester in the UI.
   - One-click "Load Sample Grocery Catalog" to restore demo products.

---

## 🛠 Technology Stack

- **Frontend:** React 18 with TypeScript
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS 3
- **Icons:** Lucide React
- **Routing:** React Router v6
- **Database:** Supabase with PostgreSQL (with local IndexedDB/LocalStorage hybrid fallback)
- **Voice Recognition:** Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) with grocery NLP parser
- **State & Sync:** React Context + `BroadcastChannel` multi-tab synchronization

---

## 📁 Directory Structure

```
Glossary/
├── index.html                       # HTML5 entry with Inter font & favicon
├── package.json                     # Project scripts and dependencies
├── postcss.config.js                # PostCSS config
├── tailwind.config.js               # Custom colors (grocery greens & spice accents)
├── tsconfig.json                    # TypeScript compiler configuration
├── vite.config.ts                   # Vite bundler configuration
├── .env.example                     # Environment variable blueprint
├── test-verification.mjs            # Automated verification test suite (15 tests)
├── supabase/
│   └── migrations/
│       └── 20261025_init_grocery_schema.sql  # Authoritative SQL schema, RLS, functions & seed
└── src/
    ├── App.tsx                      # Application router and routes
    ├── main.tsx                     # React root with providers
    ├── index.css                    # Tailwind directives & custom scrollbars
    ├── vite-env.d.ts                # Vite environment types
    ├── types/
    │   └── index.ts                 # TypeScript types (Category, Product, PriceHistory, etc.)
    ├── utils/
    │   └── formatters.ts            # Currency (₹), DateTime (IST), Relative time & UUID
    ├── lib/
    │   ├── constants.ts             # Default categories, units, and seed products
    │   └── supabase.ts              # Supabase client & connection validator
    ├── services/
    │   ├── groceryService.ts        # Data Access Layer & multi-tab broadcast sync
    │   └── voiceSearch.ts           # Speech recognition & bilingual NLP engine
    ├── context/
    │   ├── GroceryContext.tsx       # Authoritative store state & business actions
    │   └── ToastContext.tsx         # Notification toast system
    ├── components/
    │   ├── layout/
    │   │   ├── AppLayout.tsx        # Responsive layout shell & mobile drawer
    │   │   ├── Header.tsx           # Global search, date, voice trigger & add button
    │   │   └── Sidebar.tsx          # Navigation menu & database status badge
    │   ├── common/
    │   │   ├── Modal.tsx            # Accessible modal dialog
    │   │   ├── ConfirmDialog.tsx    # Safety confirmation dialog
    │   │   └── Badge.tsx            # Visual status badges
    │   ├── dashboard/
    │   │   ├── StatCard.tsx         # Metric KPI card
    │   │   └── PriceChangeBadge.tsx # +₹5 (green) / -₹3 (rose) badge
    │   ├── products/
    │   │   ├── ProductFormModal.tsx # Add & Edit product details modal
    │   │   └── QuickPriceModal.tsx  # Fast selling price updater with diff preview
    │   └── voice/
    │       └── VoiceSearchModal.tsx # Interactive speech dialog with sample chips
    └── pages/
        ├── DashboardPage.tsx        # KPI metrics, quick checker & recent changes
        ├── ViewPricesPage.tsx       # Grouped price list with print & CSV export
        ├── ManageProductsPage.tsx   # Product CRUD with brands & package sizes
        ├── CategoriesPage.tsx       # Category manager with order priority & delete safety
        ├── VoiceSearchPage.tsx      # Voice search hub with Tamil & English NLP
        ├── PriceHistoryPage.tsx     # Price change audit history with filters
        └── SettingsPage.tsx         # Store profile, voice language & Supabase settings
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js version 18.0.0 or higher
- npm version 9.0.0 or higher

### 2. Installation
Clone or navigate to the project directory:
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000` to interact with the website.

### 4. Run Production Build
```bash
npm run build
```
Verify the build with:
```bash
npm run preview
```

### 5. Run Verification Tests
A dedicated 15-point automated test suite verifies all critical workflows from Section 17 of the prompt (Category creation, Product creation, Price update to ₹65, Price history diff calculation, No-change update safety, Multi-brand independence, Search, Voice search English & Tamil NLP, and Data persistence):
```bash
npx tsx test-verification.mjs
```

---

## 🗄️ Setting Up Supabase Database (Optional)

FreshPrice works out-of-the-box in persistent local storage mode. To enable real-time multi-device synchronization across physical phones, tablets, and store cash registers:

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard, open the **SQL Editor**.
3. Copy and run the entire SQL migration script located at:
   ```
   supabase/migrations/20261025_init_grocery_schema.sql
   ```
   This script creates:
   - `categories` table with display order indexes.
   - `products` table with price constraints.
   - `price_history` table with immutable snapshots.
   - `update_product_price()` atomic stored procedure.
   - Row Level Security (RLS) policies allowing public read and store owner updates.
   - Starter grocery catalog seed items.
4. Copy your **Project URL** and **anon public key** from `Settings -> API`.
5. Open FreshPrice, go to **Settings** (`/settings`), paste your credentials into the **Database Connection** section, and click **Test & Save Supabase**.
6. Alternatively, add them to your `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

---

## 🌐 Production Deployment

### Deploying to Vercel
1. Install the Vercel CLI: `npm i -g vercel` or import the GitHub repository in the Vercel dashboard.
2. Build command: `npm run build`
3. Output directory: `dist`
4. If using Supabase, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Vercel Environment Variables.

### Deploying to Netlify
1. Create a new site from Git in Netlify.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add a `_redirects` file in `public/` with `/* /index.html 200` for client-side routing.

---

## 🧪 Verified Workflows Checklist

- [x] **Category Creation:** Added categories appear in navigation, forms, and filters.
- [x] **Product Creation:** Added products appear immediately across all screens.
- [x] **Price Synchronization:** Updating Ponni Rice from ₹60 to ₹65 immediately reflects in View Prices, Dashboard, and Voice Search.
- [x] **Price History Tracking:** Logs previous price (₹60), new price (₹65), difference (+₹5), and timestamp.
- [x] **No-change Updates:** Modifying non-price fields preserves `last_price_changed_at` and avoids creating false history entries.
- [x] **Multiple Brands & Quantities:** Ponni Rice Brand A 1kg (₹65), Brand A 5kg (₹320), Brand B 1kg (₹68) maintain independent prices.
- [x] **Voice Search:** Web Speech API integration with Tamil and English speech matching and text fallback.
- [x] **Data Persistence:** Data is retained across browser refreshes and tab restarts.
- [x] **Responsive Mobile Layout:** Collapsible sidebar, horizontal tables, touch-friendly cards, and keyboard-friendly forms.

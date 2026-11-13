# KadaKootam (കടക്കൂട്ടം) – Voice-Powered Local Shop Platform

**Tagline:** *Local shops. One community. (നാട്ടുപീടികകൾ. ഒറ്റ കൂട്ടായ്മ.)*

KadaKootam connects local neighborhood shopkeepers and customers across Kerala through an accessible voice-powered inventory management and product discovery platform. 

Shopkeepers can manage their inventory using Malayalam, English, or code-mixed (Manglish) voice commands. Customers can discover which participating local shops currently have their required grocery items in stock and compare prices side-by-side.

---

## 🌟 Key Features

### 1. 🏪 Shopkeeper Dashboard (കടയുടമ ഡാഷ്ബോർഡ്)
- **Voice-Driven Stock Updates:** Large, high-contrast microphone button designed for elderly shopkeepers.
  - Supports Malayalam, English, and Manglish (e.g., *"Ente kada-yil 10 kg Ponni rice undu"*, *"Add 10 kg Ponni rice"*, *"Reduce milk stock by 3"*).
  - Displays recognized transcript.
  - Deterministically extracts product name, quantity, unit, and intended action (`ADD`, `REDUCE`, `SET`).
  - **Mandatory Confirmation Gate:** Visual before/after stock comparison cards. Stock is updated and saved **only** after explicit user confirmation.
- **Store Overview Metrics:** Real-time counters for Total Products, Available Products, Low-Stock items, and Out-of-Stock items.
- **Full Inventory CRUD:** Add, edit, or delete items. Rapid `+` / `-` touch buttons for tablet and mobile screens.
- **Low-Stock Warnings:** Automated alerts for items falling below minimum thresholds.
- **Recent Inventory Activity:** Chronological audit trail showing voice vs. manual updates, quantity deltas, and original speech transcripts.
- **Shop Profile & Multiple Demo Stores:** Seamless switching between 3 demo Kerala shops (*Valluvanad General Stores*, *Kavitha Provisions*, *Malabar Spices*).

### 2. 🔍 Customer Discovery & Search (ഉപഭോക്താവ്)
- **Natural Voice & Text Search:** Search using natural phrasing (e.g., *"Where can I get Ponni rice?"*, *"മിൽമ പാൽ ഉണ്ടോ?"*).
- **Multi-Shop Comparison:** Displays matching products across registered shops with stock levels, price per unit, shop location, and contact numbers.
- **Best Price Ribbon:** Automatically highlights the lowest price for an item across the community.
- **Read-Aloud Search Results:** Spoken audio output summarizing findings via **Gnani Timbre TTS** (with browser Web Speech synthesis fallback).
- **Smart Product Alternatives:** Contextual recommendations when a product is low or out of stock (e.g., *Kerala Matta Rice* or *Jaya Rice* for *Ponni Rice*; *Marayoor Jaggery* for *Sugar*).
- **Favorite Shops:** Customers can bookmark their trusted neighborhood stores.
- **Direct Call & Pickup Request:** Contact shopkeepers directly or place counter reservation requests.

### 3. ♿ Accessibility & Senior-Friendly Design
- **Elderly / Large-Text Mode (`A+`):** One-click toggle that enlarges typography and touch targets.
- **Bilingual Interface:** Instant switching between Malayalam (മലയാളം) and English.
- **Demo Data Transparency:** All demonstration inventories are explicitly labeled with last-updated timestamps to avoid false live claims.

---

## 🎙️ Gnani AI Integration Details

KadaKootam integrates with official **Gnani.ai Vachana platform** APIs:

| Capability | Model | Endpoint | Purpose |
| :--- | :--- | :--- | :--- |
| **Speech-to-Text (STT)** | Gnani Prisma v3.0 | `POST https://api.vachana.ai/stt/v3` | Transcribes Malayalam, English, and code-mixed shopkeeper voice commands and customer voice queries. |
| **Text-to-Speech (TTS)** | Gnani Timbre v3.0 | `POST https://api.vachana.ai/api/v1/tts/inference` | Synthesizes natural Malayalam and Indian English spoken summaries of search results. |

### Robust Server-Side Architecture & Zero-Crash Fallback
- **Server API Routes:** Keys are strictly kept server-side (`/api/voice/stt` and `/api/voice/tts`). Secrets are **never** exposed to frontend client code.
- **Deterministic Intent Parsing:** Deterministic parsing in `lib/voice-intent-parser.js` ensures **zero LLM credits** are wasted on basic arithmetic, filtering, or stock updates.
- **Seamless Fallback:** If `GNANI_API_KEY` is not configured, the app automatically switches to client-side Web Speech recognition/synthesis and demo presets so evaluators can run the complete demo without missing a beat.

---

## 📋 Evaluation Walkthrough (Step-by-Step)

### Workflow 1: Shopkeeper Voice Stock Update
1. Open the application (defaults to **Shopkeeper Dashboard**).
2. Click the red **"Voice Stock Update"** button or the floating microphone.
3. Click **"Demo Presets"** and select:
   > *"Ente kada-yil 10 kg Ponni rice undu"*
   *(or click the giant red mic to speak live if microphone permissions are enabled)*.
4. Observe the transcript and deterministic extraction:
   - **Action:** Set exact stock (`SET`)
   - **Product:** Ponni Rice
   - **Quantity:** 10 kg
   - **Current Stock:** 45 kg ➔ **Proposed Stock:** 10 kg
5. Click **"Confirm & Update (സ്ഥിരീകരിക്കുക)"**.
6. The inventory card updates immediately, logs to recent activity, and triggers celebratory confetti.

### Workflow 2: Customer Price & Availability Search
1. Click the **"Customer (ഉപഭോക്താവ്)"** tab in the top navigation.
2. In the search box, click the preset chip **"Ponni Rice"** (or type *"Where can I get Ponni rice?"*).
3. Review the comparison grid across demo shops:
   - *Valluvanad Stores:* 10 kg remaining (reflects the update made in Step 1!) at ₹54/kg.
   - *Kavitha Provisions:* 25 kg remaining at ₹52/kg (**Best Price badge**).
   - *Malabar Spices:* 80 kg remaining at ₹56/kg.
4. Click **"Read Aloud (Gnani Timbre)"** to hear the audio summary read aloud.
5. Notice the **"Smart Alternatives"** section recommending *Kerala Matta Rice* and *Jaya Rice*.

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory:

```env
# Gnani.ai API Configuration
GNANI_API_KEY=your_gnani_api_key_here
GNANI_BASE_URL=https://api.vachana.ai
```

*(Note: The app is fully functional out-of-the-box even without an API key thanks to the intelligent fallback adapter.)*

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run the intent parser verification tests
node scripts/test-intent.mjs

# 3. Start development server
npm run dev

# 4. Open in browser
# Visit http://localhost:3000
```

### Production Build & Vercel Deployment
```bash
npm run build
npm run start
```
The application is 100% standard Next.js App Router architecture and deploys directly to Vercel without special server configuration.

---

## 🛠️ Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** JavaScript (ES6+ modules)
- **Styling:** Tailwind CSS (Warm Kerala palette: terracotta amber, leaf emerald, rich cream)
- **Icons:** Lucide React
- **Voice AI:** Gnani Prisma (STT) & Gnani Timbre (TTS)
- **State Persistence:** LocalStorage state synchronization with cross-tab event bus

# Women's Wellness Companion - Final Hackathon Documentation

## 🌟 Executive Summary
The **Women's Wellness Companion** is an AI-powered, offline-first Progressive Web Application (PWA) designed to provide accessible, intelligent, and culturally aware reproductive health support. It bridges the gap in rural and underserved demographic healthcare by combining an empathetic AI chatbot, a predictive machine-learning diagnostic tool (for PCOS), and robust offline capabilities specifically tailored for regions with unstable internet connectivity.

---

## 🏗️ Core Architecture & Tech Stack
- **Frontend Framework:** Next.js 14 (Pages Router), React 18
- **Styling:** Tailwind CSS (Custom thematic styling with maroon/pink gradients)
- **Database / Backend:** Supabase (PostgreSQL) for user, log, and alert management
- **AI Core:** Google Gemini Pro (`@google/generative-ai`) for personalized health conversation and automated symptom extraction
- **Machine Learning API:** Vercel Python FastAPI backend (Custom 9-feature ML model for PCOS prediction)
- **Offline / PWA Engine:** `@ducanh2912/next-pwa` combined with `localforage` (IndexedDB)
- **Translation:** LibreTranslate (Voice-to-Text dynamic translation for local languages)

---

## 🚀 Key Innovation Highlights (The "Wow" Features)

### 1. Offline-First PWA Synchronization
*   **The Problem:** Rural users often lack reliable internet, making cloud-dependent health trackers useless when they need them most.
*   **The Solution:** The app utilizes Service Workers to cache the app shell. If a user logs symptoms when offline, it intercepts the `fetch` failure and pushes the payload into the browser's persistent `IndexedDB` storage using `localforage`. A global `online` event listener automatically syncs queued logs to Supabase the moment cellular connectivity is restored.

### 2. Embedded AI PCOS Risk Assessment (ML Integration)
*   **The Problem:** Polycystic Ovary Syndrome (PCOS) goes undiagnosed for years due to a lack of awareness and clinical access.
*   **The Solution:** An integrated, wizard-like intake form (`/pcos`) that gathers minimally invasive data (Age, Height, Weight, Hemoglobin, along with 4 qualitative symptoms). It automatically calculates BMI and passes the 9-feature array securely through a Server-Side Next.js Proxy (`/api/predict`) to a custom Vercel ML model, bypassing browser CORS restrictions. It returns an instant probability score (e.g., "67.9% probability of PCOS").

### 3. Voice-Native & Multilingual AI Chat
*   **The Problem:** Text-heavy apps alienate users with lower literacy levels or those typing in vernacular languages.
*   **The Solution:** The chat interface directly integrates the Web Speech API. Users can speak their symptoms in real-time. If their selected language isn't English, the audio is transcribed and silently routed through LibreTranslate to convert to English for Gemini, then routed back. The AI simultaneously chats *and* automatically extracts clinical symptoms from the conversation to save to the user's local logs.

### 4. Hormonal Phase Generation & ICS Calendar Export
*   **The Problem:** Apps create isolated environments; women want actionable insights that fit seamlessly into their actual lives.
*   **The Solution:** Based on logged symptoms, the Gemini API generates a tailored "7-Day Wellness & Recovery Schedule." A pure client-side ICS generator (`buildICS`) constructs a valid `.ics` file, allowing users to instantly download and push their biological energy cycles (e.g., "Follicular Phase - Creative Peak") directly into Google Calendar or Outlook to plan work meetings around their physical health.

---

## 📂 Detailed System Components

### A. Dashboard & Quick Actions (`pages/dashboard.jsx`)
The command center of the app. Built on a responsive grid layout. 
- **AI Chat Companion:** Persistent on the left side. Reads time-of-day to provide contextual greetings. Includes 4 "Quick Prompts" to lower the barrier to entry for interacting with the AI.
- **Quick Action Cards:** High-conversion buttons with bespoke emojis and subtitles granting rapid access to core features:
  - Generate 7-Day Schedule
  - Update Logs
  - PCOS AI Risk Test
- **Recent Logs Widget:** Reads `localStorage` to immediately render the last 3 logged sessions as color-coded symptom pills without requiring a database fetch, ensuring instant load speeds.
- **Mobile Floating Action Button (FAB):** A fixed "Log Symptoms" button appears only on mobile viewports for rapid thumb access.

### B. Cycle Tracking Engine (`pages/cycle.jsx` & `CycleForm.jsx`)
- **Visual Symptom Tagging:** Users log symptoms via an intuitive toggle grid (each symptom mapped to an emoji and value, e.g., 🌡️ Cramps).
- **Backend Syncing:** Saves to Supabase (`/api/log`) and pushes to `symptomLogs` array in `localStorage` for cross-component state management. 
- **Fail-Safe Offline Mode:** Integrated tightly with `lib/sync.js`. If the `fetch` throws a Network Error, it falls back to IndexedDB.



---

## 🗄️ Backend API Routes

1. **`POST /api/chat`**
   - Receives chat history and current message.
   - Prompts Gemini setting strict medical boundaries ("You are an empathetic companion... you are not a doctor").
   - Analyzes user phrasing to enforce JSON extraction of mentioned symptoms.
2. **`POST /api/log`**
   - Next.js wrapper around Supabase.
   - Logs the user `uuid`, date, array of symptoms, and current timestamp.
   - Evaluates severity. If "severe" symptoms (e.g., heavy bleeding) are logged consecutively, it triggers a warning alert.
3. **`POST /api/schedule`**
   - Reads the latest menstrual start date log. Calculates the exact phase (Menstrual, Follicular, Ovulation, Luteal).
   - Prompts Gemini to generate 7 specific days of task tips, workouts, and nutrition advice matching that phase, returned as strict JSON.
4. **`POST /api/predict`**
   - Server-side CORS proxy. Forwards the 9-factor array from the frontend to `backend-pcos.vercel.app`.

---

## 🔒 Security & Privacy
- **Anonymous Sessions:** The app employs a frictionless authentication strategy. Upon first visit, it generates a `uuidv4` stored in `localStorage` as `anonymousUserId`. No emails, phone numbers, or passwords are required, guaranteeing absolute privacy for a highly sensitive topic.
- **CORS Proxies:** Sensitive ML data is handled entirely server-to-server.

---

## ✨ Future Scalability
- **ASHA Worker Dashboard:** Expand the database to support a `/dashboard/admin` route aggregating anonymized regional data to detect village-level health trends for government health workers.
- **WhatsApp Bot Integration:** Port the Gemini chat and logging logic over to the Twilio API, allowing users without smartphones to access the AI via standard SMS/WhatsApp.

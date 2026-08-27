# Clinic Management System (CMS) — Frontend Application

## Student Information
* **Name:** Lahiru Mudith
* **Student Number:** CMS-ST-2026
* **GCP Project ID:** `cms-cloud-architecture`

---

## Project Overview
This repository contains the Single Page Application (SPA) dashboard for the **Clinic Management System**, rebuilt on **Next.js** (latest version with App Router & TypeScript). 

It communicates directly with the domain services (Patient, Doctor, and Appointment services) via the centralized **API Gateway** on port `7000`.

---

## 🎨 Design Features
* **Premium Dark Theme:** Styled with a modern medical dashboard visual layout featuring custom fonts, color palettes, and glassmorphism styling.
* **Responsive Layout:** Adaptive left navigation bar and main view compatible with both desktop and mobile resolutions.
* **Unified Clinical Control Center:**
  * **Dashboard Tab:** Highlights total clinical registrations, schedule numbers, and action shortcut controls.
  * **Patients Registry:** Supports patient profile creation (with image preview & upload to GCS), profile editing, detail queries, and removal.
  * **Doctor Registry:** Supports specialized medical officer registration, schedule assignment, and availability listings.
  * **Appointment Scheduling:** Full booking orchestration matching patients and specialists by day and time slot with status management.

---

## 🚀 Getting Started

### 1. Install Dependencies
Run from the `cms-frontend` folder:
```bash
npm install
```

### 2. Start the Development Server
Run the local dev server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
Run the production build:
```bash
npm run build
```
The production bundle will be optimized and compiled into the `.next` directory.

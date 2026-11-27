# Chemistry QB Engine

**A CBSE Class 12 Chemistry Question Bank & Adaptive Remediation Workbench** — upload syllabus notes or question PDFs, automatically extract and classify questions by chapter and Bloom's Taxonomy level, link YouTube video walkthroughs, export printable QR-coded worksheets, and guide students through active-recall practice.

- **Live Web App (Vercel):** https://chemistry-qb-engine.vercel.app
- **Backend API (Render):** https://chemistry-qb-backend.onrender.com

---

## Key Features

### Teacher Studio
- **Syllabus-Aware Document Ingestion (`/upload`):** Upload `.pdf` or `.txt` files (up to 10 MB per file). The Spring Boot backend extracts text with Apache PDFBox, chunks content, filters against the 2026 CBSE Class 12 Chemistry syllabus (10 active chapters, 6 excluded chapters), and tags questions by chapter, topic, sub-topic, Bloom's level (`1–6`), and hint with multi-stage progress tracking (`Uploading` → `Extracting` → `Tagging` → `Saved`).
- **Question Bank & Inspector (`/questions`):** Browse and filter questions by keyword, CBSE chapter, and Bloom's Taxonomy level pills (`L1 Remembering` through `L6 Creating`). Chemistry equations and formulas (`$...$` / `$$...$$`) render cleanly via KaTeX. Click any row to open the slide-over **Question Inspector Drawer** with collapsible hints and linked video previews.
- **Printable QR Worksheet PDF Export:** Export an entire chapter, all chapters, or individually checked questions via the floating bulk export dock. Each question in the generated A4 PDF includes an embedded QR code linking students directly to its remediation video or online solve view (`/solve/:id`).
- **Video Library (`/videos`):** Manage chapter- and Bloom-tagged YouTube URLs. Newly ingested or seeded questions automatically match and link to relevant remediation videos.
- **Editorial Dashboard & Bento Overview (`/`):** Real-time repository counts, quick actions, chapter coverage matrix, and Bloom's level distribution, paired with a global **`Cmd/Ctrl + K` Command Palette** (`cmdk`) and Light/Dark theme support.

### Student Mode
- **Active-Recall Solve Workspace (`/solve`, `/solve/:id`):** Distraction-free reading card with KaTeX notation, a **Show Hint** toggle (hidden by default), working textarea, and `1–5` confidence slider. Submitting or skipping records diagnostic telemetry and unlocks the linked YouTube solution or remediation guidance.
- **Proficiency Map (`/proficiency`):** Displays chapter-level mastery depth across the CBSE Class 12 curriculum.

---

## Architecture & Tech Stack

```text
chemistry-qb-engine/
├── frontend-ui/        # React 19 + Vite 8 + Tailwind CSS v4 + KaTeX + cmdk (Vercel)
├── backend_api/        # Java 21 + Spring Boot 4 + JPA + PostgreSQL + OpenPDF + ZXing + PDFBox (Render)
├── config/             # Canonical 2026 CBSE Class 12 Chemistry syllabus schema
└── data_ingestion/     # Optional Python batch PDF ingestion script
```

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`), React Router 7, KaTeX, `lucide-react`, `cmdk`, Axios (with Render cold-start retry & skeletons) |
| **Backend** | Java 21, Spring Boot 4 (`spring-boot-starter-parent` 4.0.6), Spring Data JPA, Hibernate, PostgreSQL, Apache PDFBox 3.0.3, OpenPDF 1.3.32, Google ZXing 3.5.3 |
| **AI Extraction** | Gemini API (`gemini-2.5-flash` configurable via `GEMINI_MODEL`) |
| **Hosting** | Vercel (`frontend-ui/`), Render Docker Web Service + PostgreSQL (`backend_api/`) |

---

## Syllabus Coverage (CBSE Class 12 — 2026)

Defined in [`config/cbse_class12_syllabus_2026.json`](config/cbse_class12_syllabus_2026.json):

- **Active Chapters (10):** `Solutions`, `Electrochemistry`, `Chemical Kinetics`, `d and f Block Elements`, `Coordination Compounds`, `Haloalkanes and Haloarenes`, `Alcohols, Phenols and Ethers`, `Aldehydes, Ketones and Carboxylic Acids`, `Amines`, `Biomolecules`
- **Automatically Filtered Out (6):** `Solid State`, `Surface Chemistry`, `Metallurgy`, `p-Block`, `Polymers`, `Chemistry in Everyday Life`

---

## API Reference

| Group | Method & Endpoint | Purpose |
| :--- | :--- | :--- |
| **Questions** | `GET /api/questions` | List all questions |
| | `GET /api/questions/{id}` | Fetch a single question by ID |
| | `POST /api/questions` | Create a question record |
| | `POST /api/questions/upload` | Upload `.pdf` / `.txt` (`files`) → returns `202 Accepted` + `jobId` |
| | `GET /api/questions/upload/status/{jobId}` | Poll async chunk extraction & tagging progress |
| **Videos** | `GET /api/videos` | List all video resources |
| | `GET /api/videos/chapter/{chapter}` | Filter videos by chapter |
| | `GET /api/videos/match` | Find best matching video (`chapter`, `topic`, `bloomLevel`) |
| | `POST /api/videos` / `PUT /api/videos/{id}` / `DELETE /api/videos/{id}` | Create, update, or remove a video resource |
| **PDF Export** | `GET /api/export/pdf` | Generate printable QR worksheet (`?chapter=...` or `?ids=1,2,3`) |
| **Diagnostics** | `GET /api/generate-bridge` | Generate a cross-topic bridge question (`?t1=...&t2=...`) |
| | `POST /api/generate-bridge/submit` | Submit answer metadata and receive next-step recommendation |
| | `POST /api/generate-bridge/progress/save` | Evaluate attempt batch via `RemediationService` |
| **Proficiency** | `GET /api/proficiency-map` | Retrieve chapter mastery depth map |

---

## Local Development Setup

### Prerequisites
- **Node.js 20+** and `npm`
- **Java 21 (JDK 21)**
- **PostgreSQL** (with a database named `chemistryqb`, or custom `DB_URL`)
- **Gemini API key** (for PDF/TXT question generation)

### 1. Run the Backend (`backend_api/`)

Create a PostgreSQL database `chemistryqb`, then configure environment variables (or use defaults in [`application.properties`](backend_api/src/main/resources/application.properties)):

```powershell
cd backend_api
$env:GEMINI_API_KEY = "your-gemini-api-key"
# Optional overrides (defaults: jdbc:postgresql://localhost:5432/chemistryqb, postgres/postgres)
# $env:DB_URL = "jdbc:postgresql://localhost:5432/chemistryqb"
# $env:DB_USERNAME = "postgres"
# $env:DB_PASSWORD = "your-password"

.\mvnw.cmd spring-boot:run
```

The backend runs on `http://localhost:8080` and idempotently seeds 8 sample CBSE Class 12 Chemistry questions and 4 matching `VideoResource` records via [`DataSeeder.java`](backend_api/src/main/java/com/chemistryqb/backend/config/DataSeeder.java).

### 2. Run the Frontend (`frontend-ui/`)

```powershell
cd frontend-ui
npm install
npm run dev
```

Open `http://localhost:5173`. Development mode reads [`frontend-ui/.env.development`](frontend-ui/.env.development) (`VITE_API_BASE_URL=http://localhost:8080`).

To preview the production build locally against Render:

```powershell
cd frontend-ui
npm run build
npm run preview -- --port 5173 --strictPort
```

### 3. (Optional) Batch Python Ingestion (`data_ingestion/`)

Place `.pdf` or `.txt` files in `data_ingestion/raw_pdfs/`, configure a root `.env` with `GEMINI_API_KEY` (and optional `BACKEND_URL`), and run:

```powershell
cd data_ingestion
pip install -r requirements.txt
python ingest_logic.py
```

---

## Deployment

### Frontend (Vercel)
- **Root Directory:** `frontend-ui`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variable:** `VITE_API_BASE_URL=https://chemistry-qb-backend.onrender.com`
- SPA routing fallback configured in [`frontend-ui/vercel.json`](frontend-ui/vercel.json).

### Backend (Render)
Configured via [`backend_api/render.yaml`](backend_api/render.yaml) and [`backend_api/Dockerfile`](backend_api/Dockerfile):
- **Root Directory:** `backend_api` (`env: docker`)
- **Required Environment Variables:**
  - `SPRING_PROFILES_ACTIVE=prod`
  - `DATABASE_URL` (JDBC PostgreSQL URL), `DB_USERNAME`, `DB_PASSWORD`
  - `GEMINI_API_KEY`
  - `APP_DOMAIN=https://chemistry-qb-engine.vercel.app` (controls CORS in `WebConfig.java` and QR target links in `PdfExportService.java`)

---

## Useful Commands

```powershell
# Frontend lint & production build
cd frontend-ui
npm run lint
npm run build

# Backend tests (Maven)
cd backend_api
.\mvnw.cmd test
```

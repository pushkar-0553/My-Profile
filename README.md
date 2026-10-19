# Personal Portfolio & Content Management System (CMS)

A modern, high-performance portfolio application and dynamic content management system designed for **Kagitha Pushkara Sai Vardhan**.

Built with a decoupled architecture:
- **Frontend**: React 18, Vite, Three.js, Marked, SimpleWebAuthn, Lucide Icons (hosted on [Vercel](https://vercel.com)).
- **Backend**: Node.js, Express, MySQL2 / TiDB Cloud Serverless, WebAuthn Passkeys, TOTP 2FA, Helmet, Rate Limiting (hosted on [Render](https://render.com)).

---

## Architecture Overview

```
My-Profile/
├── frontend/                # Client Single Page Application (React 18 + Vite)
│   ├── src/
│   │   ├── common/          # Shared hooks, context, and utilities
│   │   └── features/
│   │       ├── public/      # Public portfolio pages (Home, Projects, About, Contact)
│   │       └── admin/       # Authenticated CMS (Projects, Skills, Experience, Messages, Security)
│   ├── public/              # Static public assets (Favicon, icons)
│   ├── package.json
│   └── vite.config.js
│
├── backend/                 # REST API & CMS Service (Node.js + Express)
│   ├── server.js            # Express server entry point
│   ├── render.yaml          # Render service blueprint
│   ├── src/
│   │   ├── config/          # DB connection (TiDB Cloud Serverless / In-Memory fallback), CORS, Env
│   │   ├── modules/         # Auth, Projects, Profile, Contact, GitHub sync
│   │   ├── middleware/      # Rate limiting, auth verification
│   │   └── scripts/         # DB migrations and seeders
│   └── package.json
│
├── render.yaml              # Root Render blueprint specification
├── vercel.json              # Root Vercel deployment & SPA routing configuration
└── package.json             # Root monorepo build scripts
```

---

## Key Features

1. **Interactive Public Portfolio**:
   - Dynamic 3D interactive hero canvas using Three.js.
   - Comprehensive technical case study narrative viewer with YouTube-style theater video previews, GitHub README renderer, and dynamic architectural flow diagrams.
   - Live GitHub projects importer and synchronized repository showcases.
   - Responsive dark and light theme toggle with system preference detection.
   - Visitor contact form with instant persistence to database and admin notifications.

2. **Full-Featured Admin CMS**:
   - **Passwordless Passkey (WebAuthn / FIDO2)** authentication with biometric login.
   - **Time-based One-Time Password (TOTP 2FA)** backup security.
   - Granular section display controls for projects (toggle problem, solution, architecture, challenges, or markdown narrative visibility).
   - In-depth project editor with rich metadata, tags, and media management.
   - Skills manager, experience timeline manager, and visitor messages inbox.

---

## Local Development

### Prerequisites
- Node.js `22.x` (LTS)
- npm `10.x` or later

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/pushkar-0553/My-Profile.git
   cd My-Profile
   ```

2. **Install Frontend Dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Install Backend Dependencies:**
   ```bash
   cd ../backend
   npm install
   ```

4. **Environment Configuration:**
   - Copy `.env.example` in `backend/` to `.env` and configure your TiDB / MySQL credentials, JWT secret, and admin email.

5. **Run Development Servers:**
   - **Backend API** (Runs on `http://127.0.0.1:5000`):
     ```bash
     cd backend
     npm run dev
     ```
   - **Frontend App** (Runs on `http://localhost:5173`):
     ```bash
     cd frontend
     npm run dev
     ```

---

## Deployment

### Frontend (Vercel)
- Connect repository to Vercel.
- Vercel automatically detects [vercel.json](vercel.json).
- Set Environment Variable:
  - `VITE_API_BASE_URL`: `https://<your-render-backend-url>/api`

### Backend (Render)
- Connect repository to Render as a Web Service.
- Set Root Directory to `backend` (or deploy with the included [render.yaml](render.yaml) blueprint).
- Set Environment Variables:
  - `FRONTEND_URL`: `https://<your-vercel-domain>.vercel.app`
  - TiDB connection parameters (`TIDB_HOST`, `TIDB_USER`, `TIDB_PASSWORD`, `TIDB_DATABASE`).

# InspectAI - AI-Driven Institution Inspection Platform

InspectAI is a production-ready, AI-first web application designed to digitize and automate the inspection and accreditation process for schools, colleges, universities, and training institutes.

---

## 🛠️ Technology Stack

* **Frontend**: React, Vite, Lucide Icons, Custom Glassmorphic Stylesheet (pre-built in `dist/`).
* **Backend**: Node.js, Express, Sequelize, SQLite (for local zero-dependency testing, fully swappable with PostgreSQL via environment variables).
* **AI Features**: Mock computer vision scans, certificate OCR checkers, predictive risk heatmaps, and a regulatory chatbot advisor.
* **Authentication**: JWT (JSON Web Tokens) with role-based restrictions.

---

## 🚀 Quick Start Guide

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/AI-driven-inspection-of-institution.git
cd AI-driven-inspection-of-institution
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and set your JWT_SECRET (or leave blank for auto dev-secret)
```

> **Note**: In development, if `JWT_SECRET` is not set the server will use a default dev-only secret and show a warning. In production, `JWT_SECRET` **must** be set or the server will refuse to start.

### 3. Seed Database (First Run)

```bash
npm run seed
```

This creates demo users, institutions, inspections, findings, and action items.

### 4. Run the Platform

```bash
npm start
```

Open `http://localhost:5000` in your web browser. The Express server serves both the API and the pre-built frontend.

---

## 🔑 Test Credentials & Roles

Quick access profiles are embedded on the Login page. You can use these to test different dashboards and workflows:

| Role | Username | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `password123` | Full user administration and template configurations. |
| **Inspection Authority** | `authority` | `password123` | Inspection planning, calendars, and report validation. |
| **Inspector** | `inspector1` | `password123` | Runs audits, inputs metrics, logs GPS locations, and executes AI scans. |
| **Institution Rep** | `rep1` | `password123` | Handles campus details, uploads certification docs, and updates Kanban task items. |

---

## 🌐 Push to GitHub

If you haven't already initialized git:

```bash
# Initialize git (skip if already initialized)
git init
git branch -M main

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/AI-driven-inspection-of-institution.git

# Commit and push
git add .
git commit -m "Initial commit: InspectAI platform"
git push -u origin main
```

---

## 🚢 Deploy to Render (Free)

This project includes a `render.yaml` file for one-click deployment to [Render.com](https://render.com).

### Step-by-Step:

1. **Create a free Render account** at [render.com](https://render.com) (sign up with your GitHub account for easiest setup)

2. **Connect your GitHub repo**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **"New +"** → **"Blueprint"**
   - Select your GitHub repository
   - Render auto-detects the `render.yaml` and configures everything

3. **Deploy**:
   - Render automatically installs dependencies and starts the server
   - `JWT_SECRET` is auto-generated securely by Render
   - Your app will be live at `https://inspectai-server.onrender.com` (or your custom name)

4. **Seed the database** (first time):
   - Go to your service's **Shell** tab in Render dashboard
   - Run: `node src/seed.js`

### Manual Setup (without Blueprint):
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repo
3. Set:
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
   - **Environment**: `Node`
4. Add environment variables:
   - `JWT_SECRET` = *(generate a random 64-char hex string)*
   - `NODE_ENV` = `production`
   - `PORT` = `10000`

> **⚠️ Note**: Render free tier uses ephemeral storage — the SQLite database resets on redeploy. For production persistence, switch to PostgreSQL by setting `DB_DIALECT=postgres` and the related `DB_*` environment variables.

---

## ⚙️ Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `JWT_SECRET` | **Yes** (prod) | Dev fallback | Secret key for signing JWT tokens |
| `PORT` | No | `5000` | Server port |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `CORS_ORIGIN` | No | `*` | Allowed CORS origins |
| `DB_DIALECT` | No | `sqlite` | `sqlite` or `postgres` |
| `DB_STORAGE` | No | `./database.sqlite` | SQLite file path |
| `DB_HOST` | No | `localhost` | PostgreSQL host |
| `DB_PORT` | No | `5432` | PostgreSQL port |
| `DB_NAME` | No | `inspectai` | PostgreSQL database name |
| `DB_USER` | No | `postgres` | PostgreSQL username |
| `DB_PASSWORD` | No | *(empty)* | PostgreSQL password |
| `MAX_FILE_SIZE` | No | `10485760` | Max upload size in bytes (10MB) |

---

## 🌟 Highlight Features

1. **AI Digital Checklists**: Go to the Inspector portal, click "Conduct Audit", fill out the forms, and click **Scan Image** or **Capture GPS** to simulate real-time AI computer vision warnings and location logging.
2. **AI Document Checker**: Access the "AI Assistant" page. Upload a mock document and check its accreditation validity (e.g. upload a document representing an expired fire certificate to see OCR compliance flags).
3. **Accreditation Kanban Board**: Navigate to the "Corrective Actions" dashboard to view pending tasks categorized by priority. Click action items to advance their state from *Pending* → *In Progress* → *Under Review* → *Resolved*.
4. **Interactive Chat Assistant**: Open the floating chat widget on the bottom right. Ask queries like `"What are the safety requirements for Chemistry Labs?"` or `"NAAC accreditation rules"` to get intelligent, policy-guided recommendations.

---

## 📂 Project Structure

```
├── .github/workflows/ci.yml   # GitHub Actions CI pipeline
├── dist/                       # Pre-built React frontend
│   ├── index.html
│   └── assets/
├── src/
│   ├── index.js                # Express server entry point
│   ├── db.js                   # Sequelize models & database config
│   ├── seed.js                 # Database seeder with demo data
│   ├── middleware/
│   │   └── auth.js             # JWT authentication middleware
│   └── controllers/
│       ├── authController.js   # Login, register, profile
│       ├── institutionController.js
│       ├── inspectionController.js
│       ├── aiController.js     # AI vision, OCR, chatbot
│       └── correctiveController.js
├── uploads/                    # User-uploaded files (gitignored)
├── render.yaml                 # Render.com deployment blueprint
├── package.json
├── .env.example                # Environment variable template
└── .gitignore
```

---

## 📝 License

See [LICENSE](./LICENSE) for details.

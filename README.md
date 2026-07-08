# Weekly Report Generator & Team Dashboard

A full-stack web application for generating weekly reports and managing team dashboards. Built with **Next.js** (frontend), **Express.js + Socket.IO** (backend), and **MongoDB** (database).

---

## 📋 Prerequisites

Make sure the following are installed on your machine before proceeding:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18+ | [nodejs.org](https://nodejs.org) |
| npm | v9+ (comes with Node.js) | — |
| MongoDB | v6+ (local) **or** MongoDB Atlas account | [mongodb.com](https://www.mongodb.com) |

Verify your installations:

```bash
node --version
npm --version
```

---

## 📁 Project Structure

```
WeeklyReportGeneratorTeamDashboard/
├── frontend/          # Next.js 16 app (React 19, Tailwind CSS, Recharts)
└── backend/           # Express.js API server (Mongoose, Socket.IO, JWT)
```

---

## 1️⃣ Installing Dependencies

Install dependencies for **both** the frontend and backend.

### Frontend

```bash
cd frontend
npm install
```

### Backend

```bash
cd backend
npm install
```

---

## 2️⃣ Environment Configuration

### Backend — `.env`

The backend reads configuration from `backend/.env`. Create the file (or update the existing one) with the following variables:

```env
# Server
PORT=5000

# MongoDB — choose one of the options below
MONGO_URI=mongodb://localhost:27017/weekly-reports       # Local MongoDB
# MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/weekly-reports  # MongoDB Atlas

# JSON Web Token secret (change this to a long, random string in production)
JWT_SECRET=your_jwt_secret_here

# Google Gemini AI API key
GEMINI_API_KEY=your_gemini_api_key_here
```

> ⚠️ **Never commit `.env` to version control.** It is already listed in `.gitignore`.

### Frontend — Environment Variables (Optional)

If the backend URL ever differs from the default (`http://localhost:5000`), create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 3️⃣ Running the Database

### Option A — Local MongoDB

1. **Install MongoDB Community Edition** from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community).
2. **Start the MongoDB service:**

   ```bash
   # Windows (as Administrator)
   net start MongoDB

   # Or start mongod directly
   mongod --dbpath "C:\data\db"
   ```

3. The backend will automatically create the `weekly-reports` database and all required collections on first run.
4. Make sure `MONGO_URI` in `backend/.env` points to your local instance:

   ```env
   MONGO_URI=mongodb://localhost:27017/weekly-reports
   ```

### Option B — MongoDB Atlas (Cloud)

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. Create a **database user** with read/write permissions.
3. Whitelist your IP address (or use `0.0.0.0/0` for development).
4. Copy the **connection string** from the Atlas dashboard and paste it into `backend/.env`:

   ```env
   MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/weekly-reports
   ```

> 💡 No manual schema setup is required — Mongoose models (`User`, `Project`, `Report`) will create the collections automatically.

---

## 4️⃣ Running the Backend

From the project root:

```bash
cd backend
node server.js
```

**Or** use `nodemon` for hot-reloading during development:

```bash
cd backend
npx nodemon server.js
```

You should see:

```
Connected to MongoDB
Server running on port 5000
```

The API will be available at: **`http://localhost:5000`**

### Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT |
| `GET` | `/api/auth/me` | Get current user |
| `GET` | `/api/reports` | List reports |
| `POST` | `/api/reports` | Create a new report |
| `GET` | `/api/reports/:id` | Get a single report |
| `PUT` | `/api/reports/:id` | Update a report |
| `GET` | `/api/projects` | List projects |
| `GET` | `/api/dashboard/metrics` | Dashboard metrics (Manager only) |
| `POST` | `/api/ai/chat` | AI chat (Gemini) |

---

## 5️⃣ Running the Frontend

From the project root:

```bash
cd frontend
npm run dev
```

You should see:

```
▲ Next.js 16.2.10
- Local:        http://localhost:3000
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🚀 Running Everything Together

Open **two separate terminal windows** and run:

**Terminal 1 — Backend:**
```bash
cd backend
node server.js
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Then navigate to **[http://localhost:3000](http://localhost:3000)**.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| Charts | Recharts |
| Real-time | Socket.IO (client + server) |
| Backend | Express.js v5, Node.js |
| Auth | JWT + bcryptjs |
| Database | MongoDB + Mongoose |
| AI | Google Gemini (`@google/generative-ai`) |
| Dev tools | nodemon, ESLint |

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| `MongoServerError: bad auth` | Double-check your `MONGO_URI` credentials in `.env` |
| `ECONNREFUSED` on port 5000 | Make sure the backend server is running before opening the frontend |
| `ECONNREFUSED` on port 27017 | Start the local MongoDB service (`net start MongoDB`) |
| Port 3000 already in use | Run `npm run dev -- -p 3001` to use a different port |
| Missing `GEMINI_API_KEY` | Get a free key from [aistudio.google.com](https://aistudio.google.com) and add it to `backend/.env` |

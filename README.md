
# ExpiryWise — Document & Subscription Tracker

A full-stack web app to track official-document and subscription expiry dates from one clean dashboard.

## Features
- Dashboard with total items, expiring soon, expired, and active counts
- Add, edit, search, filter, and delete tracked items
- Track official documents and subscriptions
- Automatically calculates days remaining and status
- Responsive React interface
- FastAPI REST API with SQLite persistence
- Demo records loaded automatically on first run
- No document images or sensitive document numbers are required

## Tech stack
- Frontend: React, Vite, plain CSS
- Backend: Python, FastAPI, SQLAlchemy
- Database: SQLite (local development)

## Project structure
```text
expirywise/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── schemas.py
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       └── styles.css
├── .gitignore
└── README.md
```

## Run locally

### 1. Start the backend
Requires Python 3.10+.

```bash
cd backend
python -m venv .venv
```

Windows PowerShell:
```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

macOS/Linux:
```bash
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API docs: http://127.0.0.1:8000/docs

### 2. Start the frontend in a second terminal
Requires Node.js 18+.

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (usually http://localhost:5173).

The frontend proxies `/api` requests to the backend. Keep both terminals running.

## API endpoints
- `GET /api/items` — list items; optional `q`, `kind`, and `status` filters
- `POST /api/items` — create item
- `GET /api/items/{item_id}` — get one item
- `PUT /api/items/{item_id}` — update item
- `DELETE /api/items/{item_id}` — delete item
- `GET /api/stats` — dashboard statistics
- `GET /api/health` — health check

## Important security note
This is a portfolio-ready local MVP, not a production document vault. Do not upload scans, full document numbers, passwords, or payment details. Before public deployment, add authentication, per-user authorization, HTTPS, rate limiting, backups, and a proper secrets-management setup. ExpiryWise tracks dates; it does not verify the legal validity of a document or cancel subscriptions automatically.

## Suggested GitHub repository description
`A full-stack expiry tracker for official documents and subscriptions, built with React, FastAPI, and SQLite.`

## Roadmap
- [ ] User accounts and private per-user records
- [ ] Email reminders (7 days / 30 days before expiry)
- [ ] Calendar view and export
- [ ] Optional OCR-based date extraction, with user confirmation
- [ ] Deployment and automated tests
=======
# Expire-Wise


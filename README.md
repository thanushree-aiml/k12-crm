# K12 Hunar – EdTech CRM & Inquiry System

Public inquiry form + JWT-protected admin dashboard (filters, search, status updates).

**Stack:** React (Vite) · Node.js/Express · Supabase PostgreSQL (via `pg`) · custom JWT auth (bcrypt + jsonwebtoken, no Supabase Auth)

**Live demo:** <FRONTEND_URL>  |  **API:** <BACKEND_URL>/api/health
**Admin test login:** `<ADMIN_EMAIL>` / `<ADMIN_PASSWORD>`

## Structure
```
backend/    Express API (src/, scripts/seedAdmin.js)
frontend/   React app
schema.sql  Tables: admins, inquiries
```

## 1. Database (Supabase)
1. Create a Supabase project.
2. Open **SQL Editor** → paste and run `schema.sql`.
3. Copy the connection string from **Project Settings → Database → Connection string (URI)**.

## 2. Backend
```bash
cd backend
npm install
cp .env.example .env      # fill DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run seed:admin        # creates the admin (password stored as bcrypt hash)
npm run dev               # http://localhost:5000
```

## 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:5000/api
npm run dev               # http://localhost:5173
```
- Public form: `/`   |   Admin login: `/admin/login`   |   Dashboard: `/admin`

## 4. API
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/inquiries` | – | Submit inquiry |
| POST | `/api/auth/login` | – | Returns JWT |
| GET | `/api/auth/me` | Bearer | Verify token |
| GET | `/api/inquiries?category=&user_type=&search=&page=&limit=` | Bearer | List with filters/search |
| PATCH | `/api/inquiries/:id/status` | Bearer | New / In Progress / Resolved |

## 5. Testing the custom JWT auth
```bash
# 1) Protected route without token -> 401
curl -i http://localhost:5000/api/inquiries

# 2) Login -> returns { token }
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@k12hunar.com","password":"Admin@12345"}'

# 3) Use the token -> 200
curl http://localhost:5000/api/inquiries -H "Authorization: Bearer <TOKEN>"

# 4) Wrong password -> 401
```
In the UI: visiting `/admin` without logging in redirects to `/admin/login`; an expired/invalid token logs you out.

## 6. Deployment
- **Backend (Render):** Web Service, root `backend`, build `npm install`, start `npm start`. Env: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL` (your Vercel URL).
- **Frontend (Vercel):** root `frontend`, framework Vite, env `VITE_API_URL=https://<render-app>.onrender.com/api`.
- Run `npm run seed:admin` locally (pointing at the same Supabase DB) to create the admin.

## Security notes
bcrypt password hashing · JWT signed with secret and 8h expiry · auth middleware on all admin routes · parameterized SQL · server-side validation · login rate limiting · CORS restricted to `CLIENT_URL`.

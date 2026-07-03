# Deployment Guide — TuitionLedger

Deploy in this order: **Supabase → Vercel → Netlify**

## 1. Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to provision
3. Open **SQL Editor** → New query
4. Paste and run the entire contents of `backend/database/schema.sql`
5. Go to **Project Settings → Database** and copy the **Connection string (URI)**
  - Format: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
  - Or direct: `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`



### Seed Production Data

After deploying the backend (step 2), run seed locally pointing to production DB:

```bash
cd backend
# Set SUPABASE_DB_URL in .env to production connection string
python -m database.seed
```

Or run seed SchatQL manually via Supabase SQL editor after creating the tutor account.

---



## 2. Vercel Backend



### Option A: Vercel CLI

```bash
npm i -g vercel
cd backend
vercel
```



### Option B: GitHub Integration

1. Push repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Set **Root Directory** to `backend`
4. Framework: Other



### Environment Variables (Vercel Dashboard)


| Variable          | Value                                                  |
| ----------------- | ------------------------------------------------------ |
| `SUPABASE_DB_URL` | Your Supabase PostgreSQL connection string             |
| `JWT_SECRET`      | Strong random secret (32+ chars)                       |
| `FRONTEND_URL`    | `https://tuitionledger.netlify.app` (your Netlify URL) |
| `FLASK_ENV`       | `production`                                           |




### Verify

```bash
curl https://your-backend.vercel.app/api/health
```

Expected: `{"success": true, "message": "TuitionLedger API is running"}`

---



## 3. Netlify Frontend



### Option A: Netlify CLI

```bash
npm i -g netlify-cli
cd frontend
# Create .env.production
echo "VITE_API_BASE_URL=https://your-backend.vercel.app/api" > .env.production
npm run build
netlify deploy --prod
```



### Option B: GitHub Integration

1. Go to [netlify.com](https://netlify.com) → Import from Git
2. Set **Base directory** to `frontend`
3. Build command: `npm run build`
4. Publish directory: `frontend/dist`



### Environment Variables (Netlify Dashboard)


| Variable            | Value                                 |
| ------------------- | ------------------------------------- |
| `VITE_API_BASE_URL` | `https://your-backend.vercel.app/api` |




### Custom Domain (Optional)

- Netlify: Site settings → Domain management → Add `tuitionledger.netlify.app` or custom domain
- Update `FRONTEND_URL` in Vercel to match your Netlify URL
- Update CORS in `backend/app/config/settings.py` if using a custom domain

---



## 4. Post-Deployment Checklist

- [ ] `GET /api/health` returns success on Vercel
- [ ] Login works on Netlify frontend
- [ ] Tutor dashboard loads summary data
- [ ] QR generation creates valid link with Netlify URL
- [ ] Student can scan QR and mark attendance
- [ ] WhatsApp reminder opens wa.me link
- [ ] CORS allows only your Netlify URL



## 5. Update QR Links

The backend uses `FRONTEND_URL` to generate QR links:

```
https://tuitionledger.netlify.app/mark-attendance?session_token=...
```

Ensure `FRONTEND_URL` in Vercel matches your actual Netlify deployment URL.

## Troubleshooting


| Issue                      | Fix                                                                      |
| -------------------------- | ------------------------------------------------------------------------ |
| CORS error                 | Add Netlify URL to `ALLOWED_ORIGINS` in settings.py and redeploy backend |
| Database connection failed | Check SUPABASE_DB_URL, use pooler URL for serverless                     |
| 500 on login               | Verify schema.sql was run and seed data exists                           |
| QR link shows localhost    | Update FRONTEND_URL env var on Vercel                                    |



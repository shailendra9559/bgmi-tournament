# 🚀 BGMI Tournament — Deployment Guide

Deploy your app live with **Vercel** (frontend) + **Railway** (backend) + **MongoDB Atlas** (database).

**Total cost: ~₹400/month + ₹500/year domain**

---

## Step 1: MongoDB Atlas (Free Database)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → Create free account
2. Create a **free M0 cluster** (512MB, good for 5000+ users)
3. Choose region: **Mumbai (ap-south-1)** for lowest latency
4. Under **Database Access** → Add user with password
5. Under **Network Access** → Add `0.0.0.0/0` (allow all IPs — needed for Railway)
6. Click **Connect** → **Drivers** → Copy your connection string:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/bgmi_tournament
   ```

---

## Step 2: Push to GitHub

```bash
# From project root /home/kali/BGMI_TORNAMENT
git init
git add .
git commit -m "Initial commit - BGMI Tournament"

# Create repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/bgmi-tournament.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy Backend on Railway

1. Go to [railway.app](https://railway.app) → Sign in with GitHub
2. Click **New Project** → **Deploy from GitHub Repo**
3. Select your `bgmi-tournament` repo
4. Set **Root Directory** to `server`
5. Railway auto-detects Node.js. Go to **Settings** → **Environment Variables** and add:

| Variable | Value |
|----------|-------|
| `MONGO_URI` | Your Atlas connection string (Step 1) |
| `JWT_SECRET` | Random 32+ char string (run: `openssl rand -hex 32`) |
| `JWT_REFRESH_SECRET` | Another random 32+ char string |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | `https://yourdomain.in` (or Vercel URL for now) |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |

6. Click **Deploy** → Railway gives you a URL like:
   ```
   https://bgmi-tournament-production.up.railway.app
   ```
7. Test: visit `https://YOUR-RAILWAY-URL/api/health` — should return `{"status":"ok"}`

---

## Step 4: Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → Sign in with GitHub
2. Click **Add New Project** → Import your `bgmi-tournament` repo
3. Set **Root Directory** to `client`
4. Framework: **Next.js** (auto-detected)
5. Add **Environment Variable**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-RAILWAY-URL` (from Step 3) |

6. Click **Deploy** → Vercel gives you a URL like:
   ```
   https://bgmi-tournament.vercel.app
   ```

7. **Important:** Go back to Railway → Update `FRONTEND_URL` to your Vercel URL

---

## Step 5: Custom Domain (Optional but Recommended)

### Buy a Domain
- [Namecheap](https://namecheap.com) — `.in` domains ~₹500/year
- [Hostinger](https://hostinger.in) — sometimes cheaper

### Add Cloudflare (Free SSL + DDoS Protection)
1. Sign up at [cloudflare.com](https://cloudflare.com)
2. Add your domain → Cloudflare scans DNS
3. Update nameservers at your registrar to Cloudflare's

### Connect Domain to Vercel (Frontend)
1. Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Add `yourdomain.in`
3. In Cloudflare DNS, add:
   ```
   Type: CNAME
   Name: @
   Target: cname.vercel-dns.com
   Proxy: DNS only (gray cloud)
   ```

### Connect Subdomain to Railway (Backend)
1. Railway Dashboard → Your Service → **Settings** → **Networking** → **Custom Domain**
2. Add `api.yourdomain.in`
3. In Cloudflare DNS, add:
   ```
   Type: CNAME
   Name: api
   Target: YOUR-RAILWAY-URL (without https://)
   Proxy: DNS only (gray cloud)
   ```

### Update Environment Variables
- **Railway:** Set `FRONTEND_URL=https://yourdomain.in`
- **Vercel:** Set `NEXT_PUBLIC_API_URL=https://api.yourdomain.in`
- Redeploy both services

---

## Step 6: Verify Everything

```
✅ https://yourdomain.in              → Homepage loads
✅ https://yourdomain.in/login        → Login/Register works
✅ https://yourdomain.in/admin        → Admin panel works
✅ https://api.yourdomain.in/api/health → {"status":"ok","env":"production"}
```

---

## Quick Reference

| Service | URL | Dashboard |
|---------|-----|-----------|
| Frontend | `yourdomain.in` | [vercel.com/dashboard](https://vercel.com/dashboard) |
| Backend | `api.yourdomain.in` | [railway.app/dashboard](https://railway.app/dashboard) |
| Database | MongoDB Atlas | [cloud.mongodb.com](https://cloud.mongodb.com) |
| DNS/SSL | Cloudflare | [dash.cloudflare.com](https://dash.cloudflare.com) |

## Useful Commands

```bash
# Generate JWT secrets
openssl rand -hex 32

# Check if API is alive
curl https://api.yourdomain.in/api/health

# View Railway logs
# Railway Dashboard → Your Service → Logs tab
```

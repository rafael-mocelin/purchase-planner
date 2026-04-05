# Purchase Priority Planner

Real-time shared purchase list for Rafael & Seela, built with React + Supabase.

---

## Deploy to the web (one-time setup, ~15 min)

### 1. Get the code onto GitHub

1. Create a new repo on github.com (name: `purchase-planner`, Public)
2. On your machine, open Terminal and run:

```bash
cd purchase-planner
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/purchase-planner.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to vercel.com, sign in with GitHub
2. Click **Add New Project**
3. Import your `purchase-planner` repo
4. Vercel will auto-detect it as a React app — click **Deploy**
5. Done. You'll get a URL like `purchase-planner.vercel.app`

Every time you push to GitHub, Vercel redeploys automatically.

---

## Run locally

```bash
npm install
npm start
```

Opens at http://localhost:3000

---

## How real-time sync works

Both of you open the same URL. Any change (add item, score, mark purchased) syncs
to Supabase instantly and appears on the other person's screen without refreshing.

The Supabase project is: ajqoikmlozhqpznsrkkj

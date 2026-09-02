# 🚀 How to Publish Nexus (make it permanent & live on the internet)

You do **not** need to be a programmer. Just follow these steps. It takes about **10 minutes** and is **free**.

There are 3 things you need:
1. A **GitHub** account (to store the code) — free
2. A **Neon** account (a free database) — free
3. A **Vercel** account (to host the website) — free

---

## STEP 1 — Get a free database (Neon)

1. Go to **https://neon.tech** and sign up (you can use your Google account).
2. Click **Create Project** → give it any name → **Create**.
3. On the dashboard you'll see a **Connection string**. It looks like:
   ```
   postgresql://user:password@ep-xxxx.neon.tech/dbname?sslmode=require
   ```
4. **Click "Copy"** and keep it somewhere safe. You'll paste it in Step 3.

> ✅ You don't need to create any tables — Nexus builds them automatically the first time it runs.

---

## STEP 2 — Put the code on GitHub

**Option A – Easiest (no commands):**
1. Download this project as a ZIP (use the "Download" option in your editor).
2. Go to **https://github.com** → sign up / log in.
3. Click **New repository** → name it `nexus-agent` → **Create repository**.
4. On the new repo page, click **"uploading an existing file"** and drag in all the project files. Commit.

**Option B – If you know git:**
```bash
git init
git add .
git commit -m "Nexus agent"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nexus-agent.git
git push -u origin main
```

---

## STEP 3 — Deploy on Vercel (this makes it LIVE)

1. Go to **https://vercel.com** → **Sign up with GitHub**.
2. Click **Add New… → Project**.
3. Find your `nexus-agent` repository → click **Import**.
4. Before clicking Deploy, open **Environment Variables** and add:
   - **Name:** `DATABASE_URL`  **Value:** *(paste the Neon string from Step 1)*
   - *(Optional)* **Name:** `OPENAI_API_KEY`  **Value:** *(your OpenAI key — makes Nexus smarter)*
5. Click **Deploy**.
6. Wait about 1 minute. 🎉

Vercel gives you a **permanent link** like:
```
https://nexus-agent.vercel.app
```

**That link is your live app.** It never expires. Open it in Chrome, share it with anyone — it just works.

---

## Using a custom domain (optional)

Want `www.yourbrand.com` instead of `.vercel.app`?
- In your Vercel project → **Settings → Domains** → add your domain and follow the instructions.

---

## Troubleshooting

- **Page loads but tasks don't save?** → Double-check `DATABASE_URL` is spelled exactly right in Vercel → Settings → Environment Variables, then click **Redeploy**.
- **Want to update the app later?** → Just push changes to GitHub; Vercel redeploys automatically.

That's it — you're live! 🚀

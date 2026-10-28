# Love Universe (full-stack)

Node.js + Express. No database to install locally (content lives in `data/content.json`).

## Run
    npm install
    ADMIN_PASSWORD="your-secret" npm start     # Windows PowerShell: $env:ADMIN_PASSWORD="your-secret"; npm start

- Home (hub with all boxes): http://localhost:3000
- Admin: http://localhost:3000/admin   (default password `admin123` — CHANGE IT with ADMIN_PASSWORD)

## Pages
- `/`  Home hub: gift-box cards (Birthday website, Photo Letters, Birthday Wishes, Miss You, Open When…, Fantasy, How I Want You …)
- `/birthday.html`  The birthday website (envelope, letter, moments, reasons, promises, love meter, Love Gallery …)
- `/letter.html?p=<photo>`  A photo with its own letter (swipe / arrows for the next photo)
- `/box.html?id=<box>`  A letter box page (tap a letter to open, 🎲 Surprise me)

## In /admin (all live instantly after “Save & go live”)
- **Letter boxes**: unlimited boxes, each with unlimited letters (Bangla or English), color theme, emoji,
  optional **secret PIN** (letters are never sent to the browser until the PIN is right) and
  optional **opening date** (box stays locked until that day, Bangladesh time).
- **Photos**: unlimited uploads; each photo can have its own letter (shown under the Love Gallery frame).
- Birthday page texts, WhatsApp number, quick replies, love timer, generators for moments/reasons/photo lines.

## Back button
Back on the letter pages returns to the page you came from. The birthday page remembers
that the envelope was opened, the scroll position and the photo, so you don’t start over.

## Vercel (important)
Vercel has no permanent disk, so photos and admin edits need a small database. One-time setup:
1. Vercel dashboard -> project -> **Storage** -> add **Upstash Redis** (free plan is fine) and connect it to the project.
2. Settings -> Environment Variables -> add `ADMIN_PASSWORD`.
3. **Redeploy**. Open `/admin`, edit, upload, Save.
Without step 1 uploads/saves show “Storage not set up”.
On a VPS / your own PC no database is needed.

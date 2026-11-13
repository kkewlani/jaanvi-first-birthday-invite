# Bunny Birthday Invite

Free, mobile-friendly 1st-birthday invite: details, countdown, a tiny catch-the-carrots game, and an RSVP form.

```
docs/      static website  → GitHub Pages
backend/   Google Apps Script → collects RSVPs in a Google Sheet + sends reminder emails
```

## 1. Personalise
Edit `docs/config.js` (name, date, venue, host, WhatsApp number). Keep `backend/Code.gs` CONFIG in sync.

## 2. Try it locally
```bash
cd docs && python3 -m http.server 8080
```
Open http://localhost:8080 (the RSVP form runs in demo mode until `apiUrl` is set).

## 3. Backend
Follow `backend/README.md`, then paste the Web app URL into `apiUrl`.

## 4. Publish for free on GitHub Pages
1. Create a free account at github.com and a new **public** repo (e.g. `bunny-birthday`). Nothing secret is stored in it.
2. Push this folder (or upload files in the browser).
3. Repo **Settings → Pages → Build from branch → `main` → folder `/docs`** (if `/docs` isn't offered, move the site files to the repo root and choose `/ (root)`).
4. After a minute the site is live at `https://<your-username>.github.io/<repo>/`.
5. Put that URL in `SITE_URL` in `Code.gs` and redeploy the script.

## 5. Share
Send the link by WhatsApp/iMessage. For a nice link card, add a 1200x630 `og.png` and the `og:image` meta tag in `docs/index.html`.

## Before sharing
Do a test RSVP, then delete the test rows from the sheet.

# Backend setup (Google Sheet + Apps Script), ~10 minutes, free

1. Go to https://sheets.google.com and create a blank sheet named **Bunny Birthday RSVPs**.
2. Menu **Extensions → Apps Script**. Delete the sample code, paste the entire contents of `Code.gs`.
3. Edit the `CONFIG` block at the top: child's name, host name, event time, timezone, venue, and your site URL (fill after step in the main README).
4. Click **Save**, then choose function `setupTriggers` and **Run**. Google asks you to authorise the script (it needs Sheets + Gmail send access to *your own* account). Click Advanced → Go to project → Allow.
5. **Deploy → New deployment → type: Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click Deploy and copy the **Web app URL** (ends in `/exec`).
6. Paste that URL into `apiUrl` in `docs/config.js`.
7. If you edit `Code.gs` later: **Deploy → Manage deployments → edit → New version** (the URL stays the same).

## What it does
- Each RSVP becomes a row in the `RSVPs` tab (re-submitting with the same email/phone updates the row instead of duplicating).
- Guests with an email get a confirmation right away, plus reminders ~7 days and ~1 day before (checked daily at ~9am).
- Guests with only a phone number get a ready-made **whatsapp_link** in the sheet: click it on your phone and it opens WhatsApp with a pre-written reminder.
- Sheet menu **Party Tools** lets you send due reminders now or rebuild links.

## Limits (all comfortably above ~25 guests)
- Consumer Gmail: ~100 emails/day via Apps Script. Web-app calls: ~20,000/day.

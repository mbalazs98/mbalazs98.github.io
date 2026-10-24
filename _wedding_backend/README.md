# Wedding registration backend

The pages under `/wedding/` are static, so registrations are stored in a Google Sheet
via a small Google Apps Script. Folders starting with `_` are not published by Jekyll,
so this script stays private.

## Setup (≈5 minutes)

1. Create a new Google Sheet (e.g. "Wedding registrations").
2. In the sheet: **Extensions → Apps Script**. Replace the contents of `Code.gs`
   with `apps_script.gs` from this folder and save.
3. **Deploy → New deployment** → type **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Authorise when asked, then copy the web app URL (ends in `/exec`).
5. Paste it into `ENDPOINT` at the top of `wedding/wedding.js`, commit and push.

A "Registrations" tab is created automatically on the first submission. Each row has
`timestamp, group, family, first, email, accommodation, lang`; `group` links people who were
registered together in one form submission (useful for the future guest graph).

If you edit the script later, use **Deploy → Manage deployments → Edit → New version**
so the URL stays the same.

## Privacy

The Google Sheet itself stays private: only you and people you share it with can open it.
The script runs as you, and its public URL only returns what `doGet` sends: names and
group ids. Emails and accommodation requests are visible only in the sheet.
The pages are not linked from the main site and carry `noindex`, but anyone with the
URL can open them.

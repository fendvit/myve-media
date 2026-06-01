## Problem

Google's search results still show the old Lovable heart favicon because `public/favicon.ico` is still the original Lovable file. Browsers honor the `<link rel="icon" href="/favicon.png">` in `index.html` (so your tab shows the correct icon), but Google's crawler — and many other tools — request `/favicon.ico` at the site root by convention and cache whatever they find there for a long time.

Right now:
- `index.html` → points to `/favicon.png` ✅ (this is why the browser tab is correct)
- `public/favicon.ico` → still the default Lovable heart ❌ (this is what Google indexed)

## Fix

1. Replace `public/favicon.ico` with a real `.ico` generated from your MYVE icon (`public/favicon.png`), so any tool that requests `/favicon.ico` gets the correct brand icon.
2. Add an explicit `apple-touch-icon` link in `index.html` for iOS/Android home-screen and some search surfaces.
3. Keep the existing `<link rel="icon" href="/favicon.png">`.

## After deploying

- Click **Publish → Update** so the new `/favicon.ico` is live on `https://myve.media/`.
- Google re-crawls favicons on its own schedule (usually days to a few weeks). To nudge it: in Google Search Console, open **URL Inspection** for `https://myve.media/` and click **Request Indexing**. The search-result favicon will update on Google's next refresh — there's no way to force it instantly.

## Technical notes

- Generate the `.ico` from `public/favicon.png` using ImageMagick (multi-size: 16, 32, 48) so it renders crisply everywhere.
- No code logic changes; only `index.html` head and the binary `public/favicon.ico` are touched.

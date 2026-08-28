# $1 Store — Full version with server (Vercel + PayPal API)

English-only storefront. Verifies payment on the server and protects the
book file from direct download without payment.

## ⚠️ This version has NO nested subfolders — on purpose

Earlier versions had `api/_lib/` and `public/assets/`, `public/covers/`
subfolders. GitHub's drag-and-drop web uploader sometimes drops nested
subfolders silently, which crashed the API with 502 errors.

This version is flattened: everything lives directly inside `api/`,
`public/`, or `files/` — no folder inside a folder. There is nothing left
that can be silently skipped during upload.

## What's here

| Path | Purpose |
|---|---|
| `public/index.html` | The storefront |
| `public/logo.png` | Store logo |
| `public/cover-room-404.jpg` | Book cover image (public) |
| `files/` | **Real product files (private, no public URL)** |
| `api/config.js` | Gives the frontend the PayPal Client ID only (never the Secret) |
| `api/products.js` | Public product list (no raw price or file path exposed) |
| `api/create-order.js` | Creates a PayPal order **using the price from the server catalog only** |
| `api/capture-order.js` | Captures payment, **verifies the real amount paid**, issues a temporary download token |
| `api/download.js` | Serves the file only with a valid, unexpired token |
| `api/lib-products.js` | **Product catalog — edit here to add a new product** |
| `api/lib-paypal.js` | Internal helper — talks to PayPal's API |
| `api/lib-token.js` | Internal helper — signs/verifies download tokens |

## How to upload to GitHub correctly

1. Unzip this file. You get a folder with `api`, `public`, `files` inside it
   directly — no deeper subfolders.
2. Open that folder (go inside it).
3. Select everything inside it — all 3 folders and all loose files together
   (Ctrl+A / Cmd+A).
4. **Drag** those selected items (don't use a "choose files" picker dialog —
   folders can't be selected that way) onto GitHub's "uploading an existing
   file" page.
5. After uploading, your repo's file list should show `api`, `public`,
   `files`, `vercel.json`, `package.json` directly at the root.
6. Open the `api` folder on GitHub and confirm you see 8 files directly
   inside it (no subfolder) — `config.js`, `products.js`, `create-order.js`,
   `capture-order.js`, `download.js`, `lib-paypal.js`, `lib-products.js`,
   `lib-token.js`.

## Step 1: Create a PayPal app

1. Go to developer.paypal.com and log in.
2. Go to **Apps & Credentials**.
3. Start in **Sandbox** mode (test money only) until everything works.
4. Create an app, copy the **Client ID** and **Secret**.

## Step 2: Import into Vercel

1. In Vercel: **Add New Project** → select the repository.
2. **Before clicking Deploy**, open **Environment Variables** and add:

| Variable | Value |
|---|---|
| `PAYPAL_CLIENT_ID` | from Step 1 |
| `PAYPAL_CLIENT_SECRET` | from Step 1 |
| `PAYPAL_ENV` | `sandbox` (change to `live` later) |
| `DOWNLOAD_TOKEN_SECRET` | any long random string (e.g. `openssl rand -hex 32`) |

3. Click **Deploy**.

## Step 3: Verify it's actually working

Open these URLs directly in your browser (replace with your real domain):

- `https://your-site.vercel.app/api/config` → should show `{"clientId":"..."}`
- `https://your-site.vercel.app/api/products` → should show a list containing the book

If either shows 404, files weren't uploaded at the repo root. If either
shows `{"error": "..."}`, an environment variable is missing.

## Step 4: Test a purchase (Sandbox)

Since `PAYPAL_ENV=sandbox`, payments are fully simulated. PayPal gives you
test buyer accounts from the same Sandbox dashboard (developer.paypal.com →
Sandbox → Accounts) to try a full purchase with no real money.

## Step 5: Go live

1. Create a **Live** PayPal app (instead of Sandbox).
2. Replace `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` in Vercel with the Live values.
3. Set `PAYPAL_ENV` to `live`.
4. Redeploy.

## How to add a new product

1. Open `api/lib-products.js`.
2. Copy the example object at the bottom of the file and edit it (unique
   `id`, price in cents, title/description).
3. Put its cover image directly in `public/` (e.g. `public/my-cover.jpg`) —
   no subfolder.
4. Put the real file directly in `files/` — **never in `public/`**.
5. Commit + push to GitHub — Vercel deploys automatically.

## Important security notes (please read)

- **Price is actually protected**: even if someone edits the page in their
  browser and sends a fake price, `create-order.js` and `capture-order.js`
  always read the real price from `lib-products.js` on the server and
  ignore anything sent from the browser.
- **The file has no public URL**: `files/` is not inside `public/` and is
  never served as a webpage. The only way to reach it is `/api/download`
  with a valid token.
- **The download token is time-limited, not truly single-use**: it's valid
  for 15 minutes (`DOWNLOAD_TOKEN_TTL_MINUTES`) and checks its signature and
  expiry. But since Vercel functions are stateless, there's no database here
  remembering that a token was already used — if someone shares the link
  within those 15 minutes, anyone with it could use it. True single-use
  requires a small database (e.g. Vercel KV / Upstash Redis) — ask if you
  want this added later.
- **Never** put `PAYPAL_CLIENT_SECRET` or `DOWNLOAD_TOKEN_SECRET` inside any
  HTML/JS file in `public/` — they belong only in Vercel's environment
  variables.

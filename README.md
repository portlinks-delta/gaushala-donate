# Anand Gaushala UI

A static, interactive donation workspace built with Next.js 16 App Router, React 19, Tailwind CSS 4, and shadcn's Base UI components. All records are fictional and stored in this browser. There is no backend, authentication, real payment processing, or messaging integration.

## Run locally

```bash
npm install
npm run dev
```

Open the Local URL printed by Next.js. `/` opens the admin dashboard. A sample public page is `/donate/a-little-care-a-better-life`.

## Included screens

- Dashboard: successful donation totals, unique donors, active campaigns, donation bars, campaign cards, and recent contributions.
- Donation pages: search, draft/published filtering, create/edit forms, share-link copying, live card preview, and public preview.
- Masters: categories, subcategories linked to categories, bank accounts, occasions, receipt settings, and banner uploads (PNG/JPG/WebP, at most 1 MB).
- Reports: date/campaign/seva/status filters, pagination, campaign performance, and matching CSV export.
- Donor journey: campaign landing, seva/amount, donor details, optional PAN/occasion, review, simulated payment with failure/retry, confirmation, and downloadable/printable demo receipt.

Published campaigns need an active bank account and at least one active seva in an active category. Drafts can be previewed but cannot accept demo payments. Required donor fields and requested PAN details are validated before payment.

## Persistence and demo behaviour

`components/demo-provider.tsx` hydrates versioned local storage under `gaushala-demo-v1`. `lib/demo.ts` contains shared types and seed data. Campaign drafts, master changes, donation progress, and simulated payments survive reloads in the same browser. The reset action restores sample data after confirmation. Browser storage availability and quota can limit persistence.

Donation attempt IDs prevent duplicate successful payments; a failed payment can be retried using the same attempt. Issued receipt details are snapshots and remain unchanged when receipt settings are edited. Receipts are clearly marked as demo documents. No funds are collected or delivered. Use sample personal details only.

Admin pages share a route-group layout, while donor pages use a separate layout. Navigation uses Next.js links and client routing. Dynamic campaign routes allow pages created locally to be previewed immediately. The app uses the Next.js runtime; it is not configured as an exported HTML bundle.

## Validation

```bash
npx tsc --noEmit
npm run build
```

An optional browser smoke check uses a temporary Playwright installation without changing the app's dependencies:

```bash
npm install --prefix node_modules/.cache/gaushala-qa --no-save --package-lock=false playwright
npm run start -- --port 3002
```

In another PowerShell terminal:

```powershell
$env:DEMO_URL = 'http://localhost:3002'
node scripts/demo-smoke.mjs
```

The runner expects Google Chrome at its usual Windows path. Set `CHROME_PATH` to override it. The runner creates an isolated browser profile, checks the main admin/donor interactions, and writes screenshots and download samples to ignored `.next/qa/artifacts`. It does not change the data in your regular browser.

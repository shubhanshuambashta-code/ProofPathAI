# ProofPath AI

ProofPath AI organizes consumer-issue evidence into source-linked facts, a timeline, contradictions, evidence gaps, practical next steps, and an editable complaint draft. It is a single-user MVP; it does not provide legal advice, promise outcomes, or send complaints.

## Features

- Responsive case creation and case history.
- PDF (text-based), TXT, PNG, JPG, and WEBP evidence ingestion; pasted evidence text.
- Server-side OpenAI-compatible chat completions integration with JSON schema validation, one bounded retry, and excerpt grounding.
- Evidence status distinction for source-supported, user-reported, unverified, and contradicted claims.
- Timeline, contradiction, gap, action-plan, and editable complaint views.
- Copy/download complaint controls and case editing/deletion.
- Local JSON persistence for development; no cloud database or authentication required.

## Stack and architecture

- Next.js App Router, React, TypeScript strict mode, Tailwind CSS, Lucide, Zod.
- Route handlers under `src/app/api/cases` validate requests and use `src/lib/store.ts` for local persistence.
- `src/lib/documents.ts` validates uploads and extracts selectable PDF text. `src/lib/ai.ts` calls an OpenAI-compatible provider only on the server. `src/lib/grounding.ts` checks quoted source excerpts against saved extracted text.
- The `data/cases.json` file is created on first save and ignored by Git.

## Project structure

```text
src/app/                 Landing page, case workspace, styles, and API routes
src/app/api/cases/       Case CRUD and evidence analysis endpoints
src/lib/                 Schemas, local store, document parsing, AI, grounding
src/lib/*.test.ts        Mocked unit/integration fixtures
data/                    Local case data created at runtime (git-ignored)
```

## Prerequisites and install

- Node.js 20.9 or newer (Node 24 works).
- From the project directory:

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open <http://localhost:3000>.

## Environment and live AI

Set these in `.env.local`:

| Variable | Purpose |
| --- | --- |
| `AI_API_KEY` | Secret provider key. Server only; never use a `NEXT_PUBLIC_` name. |
| `AI_MODEL` | Provider model supporting chat completions and JSON mode (default `gpt-4o-mini`). |
| `AI_BASE_URL` | API base URL (default `https://api.openai.com/v1`). |
| `MAX_UPLOAD_MB` | Per-file size limit (default `10`). |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint for deployed case storage. |
| `UPSTASH_REDIS_REST_TOKEN` | Server-only Upstash Redis token. |

Obtain a key from your selected provider and place it only in `.env.local`. Without a key, case creation, editing, and deletion work, but analysis returns a clear configuration error; there are no fake/demo AI results. The app sends case details and extracted evidence text to the configured provider for analysis. Images are sent temporarily for text reading only when the key is configured and are not persisted. Do not upload information you do not want processed by that provider.

## Documents and persistence

- Up to five files, 10 MB each by default, with a 70 MB total request cap. Allowed types: PDF, TXT, PNG, JPEG, WEBP.
- Text-based PDFs and TXT files are extracted on the server. Scanned PDFs are not OCR processed; the app reports that no selectable text was found. Image text reading uses the configured vision-capable provider.
- In local development, extracted text and case analysis are stored in `data/cases.json`. In production, the app requires Upstash Redis and stores each case in the `proofpath:cases` hash. It will not try writing to Vercel's read-only deployment directory.
- There are no user accounts or per-user authorization. Anyone who can access the deployed app can see and manage the same cases, so keep the deployment private or add authentication before entering sensitive real-world information. Delete cases in the app when appropriate.

## Development checks

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Tests use deterministic local fixtures and do not call the AI service. Configure `.env.local` before running the app to test live analysis. No AI result is considered verified only because a model generated it.

## Deployment

The project can be built for a standard Node.js Next.js host:

```powershell
npm run build
npm run start
```

Set the AI environment values in the hosting provider's server-side environment settings. For Vercel, install/connect the Upstash Redis integration, connect a Redis database to this project, and redeploy so `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are available. Local development continues to use the JSON-file store. No deployment has been performed from this repository.

## Known limitations

- No user accounts, cloud persistence, team access, legal-rule lookup, company-policy verification, or automatic complaint sending.
- Local JSON writes are appropriate for a single local instance, not concurrent production traffic.
- Scanned PDF OCR, PDF page-level citations, and DOCX export are not included.
- AI quality depends on the configured provider/model. Source-excerpt checks are conservative string matches, not independent proof that a claim is objectively true.
- Rate limits are handled at the provider error boundary; application-wide per-user rate limiting is not implemented.


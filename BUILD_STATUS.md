# Build checklist

## Implemented

- [x] Responsive landing page and fictional example entry.
- [x] Case creation with supported categories, problem, desired outcome, transaction details, pasted evidence, and removable file uploads.
- [x] Server file type, file signature, per-file size, file count, and streamed request-size validation.
- [x] Text PDF and TXT extraction; configured vision-provider OCR-like text reading for image uploads.
- [x] OpenAI-compatible server-only structured analysis with Zod response validation and one bounded schema retry.
- [x] Source excerpt matching and numeric consistency downgrade for unsupported extracted facts.
- [x] Timeline, contradictions, evidence gaps, prioritized steps, and a complaint assembled from user report plus matched exact excerpts.
- [x] Complaint editing, local saving, clipboard copy, and plain-text download.
- [x] Local JSON persistence, case history, search, case edits, reanalysis, and deletion.
- [x] Provider configuration, upload/read failures, malformed AI response, and retry error messages.
- [x] README, environment example, privacy details, and deployment limitations.
- [x] Unit tests written for grounding, unsupported claims, and conflicts.

## Not verified in this environment

- [x] Dependencies installed. The user completed `npm install` successfully.
- [ ] Lint, TypeScript, unit tests, and production build.
- [ ] Browser-based visual/interaction QA.
- [ ] Live AI request with credentials.
- [ ] Cloud persistence, authentication, deployment.

No live or mock AI analysis is presented as a successful result until a provider response is received. Local case storage works once the dependencies are installed and the server can run.

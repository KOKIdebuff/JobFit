# Design QA

## 2026-06-18 Candidate Profile Evidence Sheet

- source visual truth path: `C:\Users\yuzupoon\AppData\Local\Temp\codex-clipboard-3570f93d-45db-415e-81e3-01639ff00c97.png`
- implementation URL: `http://127.0.0.1:5173/hr/jobs/job_ai_pm_campus_001/candidates/application_ai_pm_li_001`
- implementation screenshot path: unavailable
- viewport: desktop `1408x779` and mobile `<768px` planned
- state: candidate detail, career profile evidence drawer

### Verified

- `CandidateProfileSection` uses controlled state instead of inline `<details>` expansion.
- Career profile cards use `items-start`, selected blue border/background, and one-line evidence summary.
- Full evidence renders in `SheetContent` using existing `EvidenceItem.title`, `excerpt`, and `abilities`.
- Desktop Sheet is right-side overlay at approximately `440px`; mobile switches to bottom Sheet with `max-h-[85dvh]`.
- Public `SheetContent` keeps default behavior while adding optional `overlayClassName` and `showCloseButton`.
- Existing mobile sidebar Sheet usage remains source-compatible.
- Local HTTP checks returned 200 for `/`, `/hr/jobs/job_ai_pm_campus_001/candidates`, and the dynamic candidate detail route.

### Automated Validation

- `npx.cmd tsc --noEmit`: pass.
- `npm.cmd run lint`: pass with six pre-existing Fast Refresh warnings in shared UI files.
- `npm.cmd run build`: pass after rerunning outside the sandbox; the initial sandboxed run failed on Vite config access.

### Visual And Interaction QA

Blocked. The in-app browser process could not start because Windows denied creation of its isolated process
(`CreateProcessAsUserW failed: 5`). The project also does not have Playwright or Puppeteer installed locally.

The following checks still need a rendered browser pass before this can be marked visually approved:

- Compare desktop implementation against the reference image at `1408x779`.
- Click core skill, project highlight, role intent, and current selected card to verify open/switch/close behavior.
- Verify close button, light overlay click, `Esc`, and focus restoration.
- Verify mobile bottom Sheet, independent Sheet scrolling, text truncation, and no overlap.

### Result

Code, type, lint, build, and HTTP checks pass. Screenshot-level design QA remains blocked by local browser process
isolation, so this item is not claimed as visually passed yet.

---

- source visual truth path: `C:\Users\yuzupoon\Downloads\hirelink-ai (1).zip`
- implementation URL: `http://127.0.0.1:5173`
- implementation screenshot path: unavailable
- viewport: desktop and mobile checks planned
- state: JD parse idle/success/failure, profile review/confirmed, candidate list

## Full-view comparison evidence

Blocked. The local application is running and all expected routes return the correct HTTP status, but the
in-app browser process could not start because Windows denied creation of its isolated process. No visual
comparison is claimed.

## Focused region comparison evidence

Blocked for the same reason. Navigation responsiveness, sticky action bars, dialogs, and candidate cards
could not be inspected from rendered screenshots.

## Findings

- [P1] Rendered visual comparison is unavailable.
  - Location: all newly added routes.
  - Evidence: no browser screenshot could be captured.
  - Impact: layout, overflow, typography, and responsive behavior cannot be visually certified.
  - Fix: rerun browser QA when the in-app browser isolation process is available.

## Verified without visual comparison

- Production client and SSR builds complete successfully.
- ESLint completes with no errors; six pre-existing Fast Refresh warnings remain in shared UI components.
- `/`, `/match`, `/resume`, `/network`, `/interview`, `/flow`, `/jd-parse`, `/job-profile`,
  `/candidates`, and `/hr/jobs/demo-job/candidates` return HTTP 200.
- An unknown route returns HTTP 404.
- The security scan reports no matching security findings.
- New AI-related flows are labeled as frontend simulations using preset data.

## Patches made since the previous QA pass

- Added responsive navigation entries for JD parsing and job profiles.
- Added JD parsing, job profile, static candidate, and dynamic candidate routes.
- Added a reusable simulation notice to prevent mock capabilities being presented as real integrations.
- Regenerated the TanStack route tree through the build.

## Implementation checklist

- Capture desktop screenshots for `/jd-parse`, `/job-profile`, and the dynamic candidate route.
- Capture the mobile navigation and verify menu height/overflow.
- Exercise parse success, simulated failure, preset fallback, confirmation dialog, and dynamic navigation.
- Compare the implementation with the ZIP reference at matching viewports.

final result: blocked

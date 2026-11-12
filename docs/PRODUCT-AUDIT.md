# Tšepo product audit, before Phase 4

Date: 12 November 2026. Scope: the interface, the run API and the engine as
committed at `7ded956`, run locally against the XRP Ledger Testnet. No code
was changed for this audit.

## How this audit was done

- **Sources.** The judging categories and Ripple's criteria are taken from
  the audit brief: the W3Node rubric (Product design 33%, Technical 34%,
  Business and market fit 33%) and Ripple's track brief (viability,
  autonomy, enforcement, use of XRPL, originality, the MVP checklist, "a
  demo where the agent gets blocked beats the happy path", and the CFO's
  four questions). The full rubric and track brief documents are not in
  the repository or the project history, so this audit uses the summaries
  in the brief. Also re-read: the original project brief, README.md,
  AGENTS.md, and every status sentence in `src/views/status.ts`.
- **Live tests.** A Playwright script (kept outside the repository) drove
  the production build like a person would. Over the hour it ran the
  following on Testnet: Reset five times, each scenario once, one Change
  limits, one Revoke, two wrong-code runs and two runs refused because
  another run was going.
- **Failure tests.** A second server on port 3001 ran with an invalid
  Anthropic key. It was used to test a failed Claude call and to exhaust
  both rate limits without locking the main server.
- **Accessibility.** axe-core 4.10.2 on every page and dialog at 1280px and
  390px, a scripted keyboard walk (the first 30 Tab stops on each page),
  and every tooltip, copy button and link.
- **Performance.** Lighthouse 12.6.1, mobile and desktop presets, on every
  page.
- **Not tested live:** the Claude daily cap (it would take 32 more calls),
  RLUSD running low, and the XRPL node being unreachable. These were
  checked by reading the code and the unit tests, and are marked as such.

## Summary

The ledger design is strong and real. Credentials, credential-based
Deposit Authorization, a multisig quorum with the master key disabled,
RLUSD, SourceTag and InvoiceID all work on Testnet, and three of the four
scenarios end with the agent blocked. The operator screens look like a real
financial product.

The product is not ready for judges, for four reasons:

1. **Two features crash.** Every empty state crashes the page, which
   includes the compliance desk right after a Reset. Change limits always
   fails, with a misleading BAD_SIGNATURE message.
2. **The guided demo breaks if followed literally.** Run the scenarios in
   the order the runbook asks, without a Reset in between, and scenario 3
   stops with a developer error.
3. **No page tells a newcomer what Tšepo is.** Nothing explains the
   problem (FIC Directive 9, the R0 threshold, agents with no identity) or
   answers the CFO's four questions. A judge arriving cold lands on a
   dashboard of numbers.
4. **It is not deployed.** The README still says "There is no interface
   yet", and the storage, run lock and rate limits only work on one
   long-running server.

---

## Part 1: Information architecture

### The pages today

| Page | Audience it serves | Its job | Does it work for someone new to Tšepo? |
|---|---|---|---|
| Home (`/`) | A judge running the demo | Metrics, the four-scenario runbook, recent activity, a collapsed "How it works" | **No.** It opens on four metric cards ("Agent status Active", "Used today 4 RLUSD") with no sentence saying what Tšepo is. The only explanation is folded away at the bottom. The words "credential", "agent lane" and "policy service" appear before anything defines them. |
| Agent (`/agent`) | The business's finance lead | What the agent may do, who it may pay, how to stop it, what it did | **Partly.** "What may it do" and "how do I stop it" are answered well: large limit figures, the usage bar, a red Revoke button. "Who can it pay" is a read-only table. "Prove what it did and why" covers only the latest run, and Change limits is broken (see Part 3). |
| Compliance desk (`/compliance`) | The exchange's compliance officer | Find a payment, see who sent it, why it cleared or was stopped, and the evidence | **Mostly.** The tabs, compact table, exact status sentences and payment slideout do the job. Gaps: it crashes when a list is empty; it does not say where the refused attempts come from (see Part 2); and it gives no way to export evidence. |

### The proposal: an Overview landing page

**I agree, with one change: merge the Home dashboard into the Overview's
demo section instead of keeping a separate Dashboard page.**

Reasons:

- **The landing page decides the score.** Judges spend seconds on the first
  screen, and the rubric's "needs no explanation" is scored there. Today that
  first screen is a dashboard that only makes sense to someone who has
  already run the demo.
- **The CFO's four questions are the clearest story Tšepo has.** Each one
  maps to something the product already does:

  | Question | What already answers it |
  |---|---|
  | What may the agent do? | The mandate |
  | Who can it pay? | Approved recipients |
  | How do I stop it? | Revoke, which takes effect in the next ledger |
  | How do I prove what it did and why? | The policy log, the travel package and the ledger |

  Putting them on the landing page turns the rubric's Business criteria
  and Ripple's enforcement criterion into one readable section.
- **A separate Dashboard would duplicate the operator pages.** Its four
  metrics are agent status and usage, which the Agent page already shows,
  and cleared and refused counts, which the desk tabs already show. Its
  only unique parts are the runbook and the recent activity, and both
  belong to the demo.
- **Merging gives judges one path.** Read the story, press Reset, run 1 to
  4, and watch the live state change beside the runbook. That beats
  switching between two pages, and it keeps the sidebar to three items:
  Overview, Agent, Compliance desk.

The metrics should stay, as a small "Live state" strip inside the demo
section, so judges see "Used today" and "Refused" move as they run each
scenario.

### What each page must show, what it shows now, and the gaps

**Overview (new; replaces Home)**

| Must show | Shows now | Gap |
|---|---|---|
| What Tšepo is, in one sentence, above the fold | Only in the collapsed "How it works" and the page meta description | Missing from view |
| The problem: since 30 April 2025, FIC Directive 9 requires travel rule information for crypto transfers from R0; AI agents can pay but carry no identity; a business has no limit on an agent with a key; exchanges cannot tell who the agent works for | "Directive 9" appears only in a glossary tooltip and the package details. "R0" and "South Africa" do not appear in the interface at all. | Missing |
| The CFO's four questions, each with Tšepo's answer and a link to where it is proven | Not present anywhere | Missing |
| How it works (the flow diagram) | Present, collapsed at the bottom of Home | Should be open and placed after the problem |
| The guided demo: Reset, then scenarios 1 to 4, each saying what to watch for and where the evidence is | The runbook exists, but it does not say Reset is required before scenario 3, and its Run buttons cannot be reached with Tab | Fix the order problem (Part 3), make it a guided sequence with a "Next" step, and add "What to look for" lines |
| A live state strip | The four metric cards | Shrink them and move them into the demo section |
| "Proven on Testnet": stable explorer links for the credential acceptance, the DepositPreauth with credentials, the SignerListSet, a tecNO_PERMISSION rejection, a co-signed payment, a policy refusal and a revocation | Hashes appear only in run results, and they change every run | Missing. Record the evidence hashes at reset or read them from the ledger, and list them with one line each. |
| Who it is for and how it would be sold | Not present | Missing (see Part 7, Business) |

**Agent (operator page for the finance lead)**

| Must show | Shows now | Gap |
|---|---|---|
| What the agent may do | The mandate card: per payment, per day, expiry, fingerprint | Good. Expiry cannot be changed. |
| Usage today | Usage bar and "Daily limit: 5 RLUSD. 4 used, 1 left" | Good |
| Who it can pay, and a way to change that | A read-only recipients table | No add or remove. Even if adding stays out of scope, the page should say that recipients are part of the business-signed mandate. |
| How to stop it | Revoke with a confirmation dialog; it works | Good |
| Change limits | A dialog with validation | **Broken: always fails** (P0) |
| Proof of what the agent did and why | The latest run's instruction and its payouts only | No history across runs, no policy decision log with reasons, no export (CSV or JSON). This is the CFO's fourth question. |
| Signer setup and credential | Present and accurate, read from the ledger | Good |

**Compliance desk (operator page for the exchange's compliance officer)**

| Must show | Shows now | Gap |
|---|---|---|
| Every payment and stopped attempt, filterable | Tabs with counts and a compact table | **Crashes when a filter or the reset window is empty** (P0) |
| Why each one cleared or was stopped | Exact status sentence, "What happened" timeline, checks, reasons | Good |
| The evidence | Directive 9 package, fingerprints, explorer link | Good. No export or print. |
| Where each record came from | Not stated | Refused attempts come from the business's policy service log, which a real exchange would not see unless it were shared. Say so: "Reported by the agent's policy service". |
| Earlier runs | "Show earlier runs (42)" | Good |

---

## Part 2: User flows

### A judge arriving cold, aiming to understand Tšepo in 30 seconds: fails

1. The page title is "Home", and the first block is four grey cards: "Agent
   status: Active, Lesedi payout agent", "Used today 4 RLUSD". Nothing says
   what Tšepo is or why it matters.
2. The first explanatory sentence is inside the collapsed "How it works"
   at the bottom of the page.
3. The sidebar names "Agent" and "Compliance desk" without saying whose
   agent or whose desk. "Demo locked" and "Enter the access code" sit at
   the bottom left, away from where the judge's attention is.
4. A judge who has never heard of FIC Directive 9 gets no hint that the
   travel package exists for a South African legal reason.

### A judge running all four scenarios without help: fails at scenario 3

1. Run scenario asks for the access code, as intended. After a **wrong**
   code, the sidebar still says "Demo unlocked". The judge only learns the
   code was wrong after starting a run. The run then stops and the code is
   forgotten.
2. The runbook says "Run the scenarios in order. Reset first to start from
   a clean state."
   - Scenario 1 passes.
   - Scenario 2 passes, using 2 of the 5 RLUSD daily limit.
   - Scenario 3 then **stops**: its two 2 RLUSD payments meet only 1 RLUSD
     of room, so the second is refused as well. The runbook's last result
     shows only "Stopped", and the reason, "Expected paid, paid, refused;
     got paid, refused, refused", is a developer assertion.
   - The cleared payment from that stopped run never reaches the desk,
     because the run stopped before the exchange read the agent lane. The
     metrics then disagree: "Used today 4 RLUSD" but "Cleared since reset
     1".
3. Scenario 4 revokes the agent. Nothing then tells the judge to press Reset
   before running anything else. The runbook's Run buttons stay enabled,
   and scenarios 2 and 3 would fail against a revoked agent.
4. **The keyboard path is blocked.** The runbook table is a React Aria grid,
   so Tab lands on the row, and the Run buttons can be reached only with
   the arrow keys. Nothing tells keyboard users this.
5. After a Reset, the desk shows "This screen could not read the ledger or
   the service records". This is the empty state crash, not a ledger
   problem, and it is the first thing a judge sees on the desk after
   resetting.
6. **What works well:** the "What just happened" panel is first, plain and
   accurate, and each run takes 11 to 20 seconds with live steps and
   explorer links. Three of the four scenarios end with the agent blocked,
   which Ripple's brief asks for.

### A finance lead managing the agent: partly works

- **Changing limits: fails.** The dialog validates input well (per payment
  above the daily limit is refused with a clear sentence). A valid change
  then stops with "The policy service rejected the new limits:
  BAD_SIGNATURE Nothing further was submitted." Cause: `dispatch` passes the
  whole run request to `changeLimits`, which spreads its `kind:
  'change-limits'` field into the mandate. The strict mandate schema rejects
  the extra field, and the policy service reports any parse failure as
  BAD_SIGNATURE. Two problems follow: the feature is broken, and the
  reason given is wrong and unexplained.
- **Approved recipients:** can be reviewed (name, paid through, destination
  tag, account) but not added or removed. Nothing says why.
- **Revoking: works.** Confirmation dialog, 11 seconds, the "Agent revoked"
  toast, the header says "Revoked at ... SAST", and both actions are then
  disabled. The page does not say what to do next ("Reset the demo to
  register the agent again" is only in the dialog text).
- **Proving what the agent did: weak.** Only the latest instruction and its
  payouts are shown. Past runs, the policy decision log (every co-sign and
  refusal with reasons), and a downloadable record are all missing.
- **Agent activity is not reset-scoped.** After a Reset it still shows the
  previous run's instruction, while the metrics say 0 used.

### A compliance officer finding a refused payment: works, with gaps

- The Refused tab, the row and the slideout show the exact sentence ("Refused
  by the policy service: payments split to get around the daily limit"), the
  "What happened" timeline (co-signed: Stopped; settled: Not reached), the
  reasons, the package fingerprint and the Directive 9 package marked as
  demo data. Focus returns to the row when the slideout closes. This is
  the best flow in the product.
- **Gaps:**
  - It crashes whenever the chosen filter is empty.
  - It does not explain that refused attempts never reached the exchange
    and are reported by the agent's policy service.
  - "Decided by" disagrees across pages. The runbook and "What just
    happened" say scenario 2 was decided by "the policy service"; the desk
    says the same cleared payment was decided by "the exchange".
  - Scenario 1 shows as two rows (a policy refusal and a ledger rejection)
    for one agent, and "Refused since reset" counts it twice without saying
    so.

---

## Part 3: Functional QA

| Test | Result | What happened |
|---|---|---|
| Reset | Pass | 12 to 20 seconds; returns all RLUSD; "Demo reset" toast |
| Scenario 1 (unknown agent) | Pass | 13 s; policy refusal, then tecNO_PERMISSION on the ledger; explorer link correct |
| Scenario 2 (verified agent) | Pass | 12 s; paid, cleared, explorer link correct |
| Scenario 3 (split payments) after a Reset | Pass | Seen in the previous session's capture runs: paid, paid, refused |
| Scenario 3 straight after scenario 2 | **Fail** | Stops with "Expected paid, paid, refused; got paid, refused, refused"; the cleared deposit is not recorded on the desk |
| Scenario 4 (revoke) | Pass | 13 s; credential deleted; next payment refused |
| Change limits | **Fail** | Always BAD_SIGNATURE (cause in Part 2) |
| Revoke from the agent page | Pass | 11 s, toast, buttons disabled |
| Double click on Reset | Pass | One run only |
| Starting a run while one is running | Pass | 409, "Another run is in progress. Wait for it to finish, then try again." All controls are disabled while busy. |
| Reset during a run (from a refreshed page) | Pass, with a confusing state | The 409 message is shown. On the refreshed page the controls look enabled, because the browser no longer knows a run is going. |
| Navigating away mid-run | Pass | The panel keeps streaming on the next page |
| Refreshing mid-run | Partial | The run finishes on the server, which is right. The page loses all progress, shows no sign that a run is still going, and the next action gets a 409. |
| Unlock with a short code | Pass | "Enter the demo access code. It has at least 6 characters." |
| Unlock with a wrong code | **Fail (UX)** | The sidebar says "Demo unlocked" until the first run returns 401. The code is then forgotten, which is right. |
| Wrong-code limit | Pass | The 11th wrong code in 15 minutes gets 429 |
| Run rate limit | Pass, one flaw | The 20th request in an hour gets 429 ("Try again in 60 minutes"). Invalid and conflicting (409) requests also use up the allowance. |
| A failed Claude call | Pass (fails closed), **Fail (copy)** | Nothing is submitted. The user sees the raw API error: `401 {"type":"error","error":{"type":"authentication_error",...},"request_id":"req_..."} Nothing further was submitted.` |
| Claude daily cap | Not tested live; pass by code and unit tests | Counted before each call and kept across restarts. The message has no full stop between sentences: "...until tomorrow (UTC) Nothing further was submitted." The cap is shared by all visitors: at about one call per scenario 2, 3 or 4, 50 calls is about 16 full demos a day. |
| RLUSD running low | Not tested live; by code | No balance check before co-signing. A short balance would fail on the ledger (tecPATH_PARTIAL or tecUNFUNDED_PAYMENT) and the run stops. Check whether the co-signed amount still counts toward the daily total. Reset restores the 10 RLUSD pool. |
| XRPL node unreachable | Not tested live; pass by code | Pages fall to the error state, which makes no claims. Runs report the connection error and submit nothing. There is no fallback node (AGENTS.md fixes one URL). |
| Testnet reset by Ripple | Not handled | A Testnet reset deletes every account, and the demo would fail until the accounts are created again and the RLUSD is funded by hand. No runbook for this exists. |
| Loading states | Pass | Skeletons on all three pages, matching each layout |
| Error state | Pass | Plain, makes no claims, has "Try again" |
| Empty states | **Fail** | Server error: "Functions cannot be passed directly to Client Components ... {icon: function Inbox01}", then React error #130. Affects: the desk after a Reset, any empty tab (Held is usually empty), the recent activity on a fresh install, and agent activity with no runs. |
| Tooltips (8 terms over 3 pages) | Pass | All open, all have text, Escape closes |
| Copy buttons | Pass | The clipboard receives the full value (checked with the mandate fingerprint) |
| Internal links | Pass | 19 checked, all 200 |
| External links | Pass | GitHub and testnet.xrpl.org respond; all open in a new tab with a hidden "(opens in a new tab)" |
| Explorer links in run steps | Pass, minor | Scenario 1 lists the same hash twice ("Submitting" and "Rejected") |
| Favicon | Fail, minor | /favicon.ico returns 404, an error in the console on every page |

---

## Part 4: Content

- **Plain English, contractions, em dashes, hype words:** none found in
  `app/`, `components/`, `src/views`, README.md or ui/README.md.
- **Claims checked against what was proven:**
  - True: tecNO_PERMISSION for an unknown agent; the package reaches the
    exchange before the payment (the agent sends it first, and the
    verifier checks PackageAfterPayment); revocation takes effect from the
    next ledger; only the fingerprint goes on the ledger.
  - True but misleading: "Refused since reset: 3 by the policy service, 1
    by the ledger" counts scenario 1's single agent twice.
  - **False: README.md** says "Phase 2: the core engine runs end to end from
    scripts. There is no interface yet." It does not mention the web app,
    the access code, a live URL, or how to run `npm run build && npm start`.
- **Jargon:**
  - Explained by tooltips: credential, fingerprint, agent lane, Travel
    Rule, quorum, tecNO_PERMISSION, tecBAD_CREDENTIALS.
  - Not explained: "co-sign" and "policy service" (the most important
    idea), "mandate", "destination tag", "RLUSD", "SourceTag", "CIPC",
    "SAST", "Directive 9" (outside the tooltip), and "R0" (never mentioned).
  - BAD_SIGNATURE and other reason codes can reach the user raw.
- **Names are not consistent:**

  | Thing | Names used |
  |---|---|
  | The credential issuer | "Tšepo" (glossary), "the registry" (Change limits dialog), "the Tšepo issuer" (README) |
  | The exchange | "Demo Exchange" (desk title) and "the exchange" |
  | The business tool | "business console" (README and diagram), which no page is called |
  | The status categories | The desk tabs separate "Refused" from "Rejected by the ledger"; the Home metric calls both "Refused" |

- **Numbers:**
  - Limits (3 and 5) agree everywhere.
  - "Used today" comes from the policy service's co-signed total, while
    "Cleared since reset" counts deposits on the desk. They disagree after
    a stopped run (4 used, 1 cleared) because the deposit was never
    recorded.
  - The runbook's "Last result" survives a Reset, while every metric is
    reset-scoped. Label it "Last run, before or after the reset", or clear
    it on reset.
- **Small copy issues:**
  - "Claude read 1 payment(s) from the instruction".
  - "Decided by the XRP Ledger itself" in the runbook against "Decided by
    the ledger" on the desk.
  - The stopped-run reason is hidden, so a judge sees "Stopped" with no
    explanation.

---

## Part 5: Quality

### Accessibility

- **axe at 1280px:** no violations on Home, Agent, Compliance desk, the
  empty Held filter (which showed the error page), the payment slideout or
  the access code dialog.
- **axe at 390px:**
  - every page: moderate `landmark-no-duplicate-banner` and
    `landmark-unique` (the mobile header and the application header are
    both `<header>` banners);
  - Compliance desk: **critical `aria-valid-attr-value`**. Each tab's
    `aria-controls` points to a tab panel that does not exist, because the
    tabs are used as navigation links. Lighthouse flags the same at both
    widths (desk accessibility 94 and 95).
- **Keyboard walk:**
  - Pass: skip link first; then the sidebar, the header actions and the
    page content in visual order; visible focus rings throughout.
  - Pass: the desk table opens a payment with Enter, Escape closes it, and
    focus returns to the row.
  - Fail: the runbook's Run buttons cannot be reached with Tab (arrow keys
    only, with no hint), which blocks the main demo action for keyboard
    users.
  - The recipients table is also a grid, which is acceptable there because
    it has no actions.
- **Screen reader labels:**
  - Present: copy buttons ("Copy agent lane account"), terms ("agent lane,
    what this means"), Run buttons ("Run Scenario 1: Unknown agent"),
    explorer links ("opens in a new tab"), the progress bars, and the
    slideout ("Payment details").
  - Missing: the run panel announces its steps through a live region, but
    nothing announces "Finished" or "Stopped".
- **Reduced motion:** honoured globally. Every animation and transition is
  cut to 0.01ms.

### Performance (Lighthouse 12.6.1)

| Page | Mobile perf | Desktop perf | Accessibility | Best practices | SEO | Mobile LCP | Mobile TBT |
|---|---|---|---|---|---|---|---|
| Home | 48 | 94 | 100 | 96 | 100 | 5.0 s | 1,710 ms |
| Agent | 57 | 97 | 100 | 96 | 100 | 4.2 s | 2,340 ms |
| Compliance desk | 57 | 87 | 94 / 95 | 96 | 100 | 4.0 s | 1,950 ms |

What the numbers mean:

- Mobile is held back by JavaScript: about 423 KiB transferred, with
  89 KiB unused on first load, and 2.5 s of script start-up on a throttled
  phone.
- The likely causes:
  - every page loads the client code for React Aria tables, tabs,
    dropdowns, modals and popovers;
  - every glossary term is its own client popover;
  - the Untitled UI table is used for display-only tables.
- Desktop CLS is 0.11 on the desk, from the run panel and the table
  settling.
- Best practices loses points on the favicon 404 (a console error) and on
  the page not being restorable from the back-forward cache.
- Each page also waits on the Testnet for 1 to 3 seconds per load, which
  Lighthouse hides behind the streamed loading skeleton.

### Visual consistency

- **One component system:** yes. shadcn, Radix and Lucide are gone, and all
  surfaces use Untitled UI with the Tšepo tokens.
- **Badges:** one style, pill colour, the status pairs.
- **Type scale:**
  - page title display-xs, section titles text-lg, body text-sm;
  - the desk slideout amount and the metric figures use display-xs;
  - the Agent page's large figures match.
- **Spacing:**
  - mostly consistent (sections 40px apart, cards 20 to 24px padding);
  - Home's 2:1 split only applies from 1536px, so at 1280 the runbook and
    the activity stack; that is intentional and reads well.
- **Remaining AI design tells:**
  - four identical grey metric cards in a row, each with label, figure and
    note;
  - every section in the same rounded grey block;
  - a generic inbox icon on every empty state;
  - "What just happened" is a good, specific pattern; the metric row is
    the generic one.
  - A landing page with a real problem statement and real evidence links
    would remove most of the "template" feel.

---

## Part 6: Deployment readiness (plan only)

### Storage

The local file adapter (`.data/`) will not survive on Netlify: each function
instance has its own temporary disk.

**Recommendation: a hosted Postgres reached through the existing
`DocumentStore` interface.** Neon's free tier, which Netlify integrates
with, is one option. Postgres fits because:

- the daily total check and the co-signature must happen together;
- the policy log must be append-only;
- every collection is small;
- the services already talk only through `DocumentStore`, so this is one
  new adapter.

The alternative is Netlify Blobs: simpler, but without transactions. Use it
only if its conditional writes are confirmed to be enough.

How each piece of data stays consistent:

- **Daily totals.** Do not keep a running counter. Keep the `approvals`
  table (agent, SAST day, reference, amount), with a unique key on agent
  and reference so a retried payment is never counted twice. Compute
  today's total inside the same transaction that records a new approval.
  Take an advisory lock per agent (`pg_advisory_xact_lock`) so two reviews
  cannot both pass the limit. This replaces the in-memory run lock as the
  real protection.
- **Policy log.** An insert-only table. The application role gets INSERT
  and SELECT, never UPDATE or DELETE. Each entry carries the SHA-256 of
  the previous entry, so any edit breaks the chain. A daily anchor of the
  chain head on the ledger is a P2 option.
- **Desk history.** The ledger is the source of truth for deposits and
  rejections. The exchange store holds only the packages and its
  assessments, and it can be rebuilt by re-reading the agent lane's
  transactions. Refused attempts come from the policy log feed. Sync the
  deposits in a `finally` block after every run, so a stopped run still
  records what reached the ledger. This fixes the gap seen in Part 3.
- **Demo state, last runs, Claude call budget, rate limits, run lock.**
  Small tables:
  - the run lock becomes a row with an owner and an expiry, so a crashed
    run releases it;
  - rate limits become a table of counted events;
  - the in-memory versions do not work across Netlify instances.
- **Run duration.** Runs take 11 to 25 seconds. Check Netlify's current
  function time limits for streamed responses before relying on them.
  The robust design: run the engine as a Netlify Background Function,
  write each progress event to a `run_events` table, and have the page
  read them (polling every second is enough). This also fixes the
  refresh-mid-run gap, because progress survives a reload.

### The policy service as its own deployment

- **Its own Netlify site,** for example `policy.tsepo...`, holding only
  `POLICY_SEED` and its own database credentials, for its own database
  (or schema) with only `approvals`, `mandates` and `policy_log`.
- **The main app never holds `POLICY_SEED`.** It reaches the policy service
  only over HTTPS. Endpoints:

  | Endpoint | Purpose |
  |---|---|
  | `POST /review` | The unsigned payment, its purpose and the package fingerprint; returns the co-signature or the refusal reasons |
  | `POST /admin` | A business-signed admin action |
  | `GET /log` | Read-only, for the exchange's feed of refused attempts |

- **Requests are signed by the caller's ledger key.** The agent signs the
  review request with the agent key and the business signs admin actions
  (already done), so no shared secret is needed. The policy service
  checks the signer against the signer list on the ledger.
- **The policy service keeps reading the credential from the ledger itself**
  before every signature (already true).
- **What this proves:** a compromised agent app cannot co-sign, and a
  compromised policy site cannot pay alone. The agent key has weight 1 and
  the quorum is 2, which the ledger enforces.
- **Key custody stays in one place for the demo.** The business, issuer
  and agent keys stay in the main app. Say plainly in the README that in
  production the business key lives in the business's own wallet, for
  example Xaman.

### Environment, access and security

- **Main site variables:** the issuer, business, agent, agent signer,
  exchange, contractor and unknown-agent seeds, `ANTHROPIC_API_KEY`,
  `DEMO_ACCESS_CODE`, `AGENT_SOURCE_TAG`, `DATABASE_URL`, and
  `POLICY_SERVICE_URL`.
- **Policy site variables:** `POLICY_SEED` and `POLICY_DATABASE_URL`.
- **Exposure:** none are `NEXT_PUBLIC_`. Netlify environment variables are
  scoped to functions only.
- **Access code:** keep the server-side check and the separate wrong-code
  limit, but move the limits to the database. Add a small `POST
  /api/access` check so the dialog only says "Demo unlocked" for a right
  code. Rotate the code after judging.
- **Security headers:** none are set today. Add them in `next.config.ts`
  `headers()` or `netlify.toml`:
  - a Content-Security-Policy: `default-src 'self'`; scripts from self
    with a nonce; `img-src 'self' data:`; `connect-src 'self'`;
    `frame-ancestors 'none'`;
  - `X-Content-Type-Options: nosniff`;
  - `Referrer-Policy: strict-origin-when-cross-origin`;
  - a `Permissions-Policy` that denies camera, microphone and geolocation;
  - `Strict-Transport-Security`.
- **No secret reaches the browser:** confirmed today. Every value of 6 or
  more characters in `.env.local` was searched for in `.next/static`, with
  0 matches, and likewise in the last two commits. Make this a build step,
  a small script run in the Netlify build that fails the build on any
  match, so it stays true.

### How judges reach the demo

- **README top:** the live URL, the access code, and a "Judge's 3-minute
  path": Overview, then Reset, then scenarios 1 to 4, then open the
  refused payment on the desk, then revoke and reset.
- **Submission form:** the same URL and code.
- **Usage limits:** the run limit (20 an hour, shared) and the Claude cap
  (50 a day, shared) are enough for judging, but state them in the README.
  Raise the run limit during the judging window if several judges may try
  at once.
- **Contingency:** a written runbook in `docs/` for a Testnet reset:
  create the accounts again, fund RLUSD at tryrlusd.com, run Reset.

---

## Part 7: Scorecard

Scores are out of 10, for the product as it stands today.

### W3Node rubric

**Product design: 5/10.** The operator screens are clean and consistent,
and "What just happened" is excellent. But there is no landing page for a
cold visitor, the runbook breaks at scenario 3 if followed literally, empty
states crash, and the Run buttons cannot be reached with Tab. The top three
changes that would raise it:

1. Build the Overview landing page (problem, the CFO's four questions,
   guided demo, evidence).
2. Fix the empty states and make the scenarios independent of order.
3. Use a plain table for the runbook and fix the tabs' `aria-controls`.

**Technical: 6/10.** Strengths: clean modules, strict TypeScript, Zod at
every boundary, 179 tests, fail-closed runs, real ledger enforcement, and
no secret in the bundle. Against it: Change limits is broken, a stopped run
loses its deposit record, the policy service runs in the same process, it
is not deployed, and mobile Lighthouse performance is 48 to 57. The top
three changes:

1. Fix Change limits and add a test that runs the full run request.
2. Deploy with Postgres storage and the policy service as its own site.
3. Persist run progress and sync deposits in `finally`.

**Business and market fit: 4/10.** The South African fit is real: a
Directive 9 package, the CIPC registration number, SAST, and RLUSD as a
rand-neutral settlement asset. But the interface and README never state the
problem, the R0 threshold, the target customers (businesses running payout
agents; South African CASPs that must receive travel rule data), pricing,
or how it would reach the market. The top three changes:

1. A problem and audience section on the Overview, citing FIC Directive 9
   and the R0 threshold.
2. A short business model in the README, for example a per-agent
   registry fee for businesses and an agent lane integration fee for
   exchanges.
3. Name a first integration path with local infrastructure, for example a
   CASP's travel rule inbox and how it would read the Directive 9 package.

### Ripple's criteria

**Viability: 5/10.** The core works end to end on Testnet, but it is not
deployed, the storage is local, and the scenarios depend on their order.
The top three changes:

1. Deploy.
2. Fix the two P0 bugs.
3. A Testnet-reset runbook.

**Autonomy: 7/10.** Claude reads a plain-language instruction, the agent
sends the package and pays on its own, and the policy service co-signs
without a human. But every action starts from a person pressing Run, and
the model's part ends at reading the list. The top three changes:

1. Show the agent working through a queue of instructions, for example a
   payout inbox the agent picks up.
2. Show the agent handling a refusal by itself, for example holding the
   payment and asking the business for higher limits.
3. Say on the Overview exactly what the model decides and what it never
   decides.

**Enforcement: 8/10.** Enforcement happens at three layers:

- the ledger rejects senders with no credential (tecNO_PERMISSION);
- the ledger requires the policy co-signature (quorum 2, master key
  disabled);
- the policy service checks limits, recipients and split patterns, and
  revocation works from the next ledger.

It loses points because the policy service is only logically independent
and the policy log is not tamper-evident. The top three changes:

1. Separate the policy service deployment and key.
2. A hash-chained policy log.
3. Show the "agent alone cannot pay" proof (one signature rejected) as
   evidence on the Overview.

**Use of XRPL: 9/10.** It uses credentials (Create, Accept and Delete,
with a fingerprint URI), DepositPreauth with AuthorizeCredentials,
CredentialIDs on payments, a SignerListSet with the master key disabled,
RLUSD, SourceTag, InvoiceID as the package fingerprint, and validated
results only. The top three changes:

1. Link each feature to a stable explorer example on the Overview.
2. Show the credential expiry on the ledger next to the mandate expiry.
3. Read the desk history straight from `account_tx` filtered by SourceTag
   to show agent traffic apart from human traffic.

**Originality: 7/10.** Pairing an XRPL credential with credential-based
Deposit Authorization as an "agent lane", plus a policy co-signer and a
Directive 9 package, is a distinct idea. It is not yet told as one story.
The top three changes:

1. Name the idea in one sentence on the Overview.
2. Show the exchange side as clearly as the business side.
3. Add the fourth CFO question, "prove it", as a downloadable evidence
   pack per payment.

---

## Prioritised fix list

Effort is in minutes of focused work, including tests where code changes.

### P0: must fix before submission

| # | Fix | Effort |
|---|---|---|
| 1 | Empty states crash. Make `EmptyMessage` a client component, or render the Untitled `EmptyState` only from a client wrapper; then test each empty case (desk after reset, each empty tab, a fresh agent). | 30 |
| 2 | Change limits always fails. Pass only `{ perPaymentLimit, dailyLimit }` to `changeLimits`. Make the policy service report a schema failure as its own reason, not BAD_SIGNATURE. Add a test through `runDemo` with a real change-limits request. | 40 |
| 3 | Scenarios depend on their order. Either each scenario prepares its own starting state (clears the demo daily totals, which is logged, and registers the agent again if it is revoked), or the guided demo runs Reset itself before scenarios 3 and 4. Also sync deposits in a `finally` block so a stopped run still records what reached the ledger. | 90 |
| 4 | Stopped runs show developer text or raw provider errors. Map engine errors to plain sentences (Claude unavailable, daily cap reached, limits already used, network), keep the detail in the server log only, and show the plain reason in the runbook's last result. Fix the missing full stop in "Nothing further was submitted." | 60 |
| 5 | Overview landing page. One-sentence pitch; the problem (FIC Directive 9 from R0, agents with no identity); the CFO's four questions with answers and links; the open flow diagram; the guided demo with a live state strip; "Proven on Testnet" evidence links. Merge Home into it. | 240 |
| 6 | README rewrite. Live URL, access code, the judge's 3-minute path, current status, how to run the web app, the business case, limits (20 runs an hour, 50 Claude calls a day), and how keys would be held in production. | 45 |
| 7 | Deploy on Netlify with hosted storage (Part 6): the Postgres adapter, a database run lock with expiry, database rate limits, a check of the function time limit or a Background Function with stored progress, security headers, and the secret scan as a build step. | 360 |
| 8 | The access code dialog says "Demo unlocked" for a wrong code. Check the code against the server before saving it. | 30 |

### P1: should fix

| # | Fix | Effort |
|---|---|---|
| 9 | Runbook Run buttons cannot be reached with Tab. Use a plain HTML table for the runbook (and for the recipients and signer tables). | 30 |
| 10 | Desk tabs have a critical `aria-controls` error. Use links styled as tabs (a `nav` with `aria-current`), or render real tab panels. | 30 |
| 11 | Duplicate banner landmark at 390px. Make the mobile header a plain `div`, or give each header a distinct label. | 10 |
| 12 | The policy service as its own deployment with its own key, database and log (Part 6). | 240 |
| 13 | Hash-chained, insert-only policy log. | 60 |
| 14 | Prove what the agent did. An agent history across runs, the policy decision log with plain reasons, and an evidence export (JSON or CSV) per payment and per day. | 150 |
| 15 | "Decided by" in one place, and the same on every page. Name the actor that stopped or cleared each event; explain that a cleared payment needed the policy service and the exchange; count scenario 1 as one agent with two attempts. | 30 |
| 16 | Label the source of refused attempts on the desk ("Reported by the agent's policy service"). | 15 |
| 17 | Persist run progress, so a refresh shows the run still going, with controls disabled (comes with #7 if Background Functions are used). | 90 |
| 18 | Agent page: explain how recipients are set (in the business-signed mandate). Optionally add and remove recipients through the same signed action. | 20 (explain) or 120 (edit) |
| 19 | Consistent names: issuer, registry, Tšepo, Demo Exchange, business console. Pick one name for each and use it in the README, glossary and dialogs. | 30 |
| 20 | Explain the remaining jargon: policy service, co-sign, mandate, destination tag, RLUSD, CIPC, SAST, R0. | 30 |
| 21 | A Testnet-reset recovery runbook in `docs/`. | 30 |
| 22 | Announce run completion ("Finished" or "Stopped") to screen readers. | 15 |
| 23 | Reset-scope agent activity and the runbook's last results, or label them as possibly earlier than the reset. | 30 |

### P2: nice to have

| # | Fix | Effort |
|---|---|---|
| 24 | Mobile performance. Render display-only tables as plain HTML; lazy-load the run menu, dialogs and slideout; consider one shared glossary popover. Target mobile performance of 75 or more. | 120 |
| 25 | Add a favicon (the Tšepo mark) to remove the 404. | 10 |
| 26 | Do not count invalid or conflicting requests toward the run limit. | 15 |
| 27 | Remove the duplicate hash line in scenario 1's steps; change "payment(s)" to correct singular and plural. | 15 |
| 28 | Reduce desk CLS (reserve the run panel's space, fix table row heights). | 30 |
| 29 | Make the metric strip less generic: fewer cards, inline figures, links to the evidence. | 45 |
| 30 | Show the credential's own ledger expiry next to the mandate expiry. | 30 |
| 31 | Optional: anchor the daily policy log hash on the ledger from the policy account. | 90 |

**Total effort:**

| Priority | Minutes | About |
|---|---|---|
| P0 | 895 | 15 hours |
| P1 | 810 to 910 | 14 to 15 hours |
| P2 | 355 | 6 hours |

## State left behind

- **Demo state:** the last action was a Reset that finished. The agent is
  active with the 3 and 5 RLUSD limits, and the desk window starts at that
  reset.
- **Usage today:** about 11 runs counted against the main server's limit
  this hour, and 19 Claude calls of the daily 50 (the stored count),
  including one deliberately failed call.
- **Second server:** the port 3001 test server is stopped. Its rate limits
  were exhausted on purpose and died with it.
- **Test scripts:** kept in the session scratchpad, not in the repository.

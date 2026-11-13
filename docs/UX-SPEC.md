# Tšepo UX specification

Date: 12 November 2026. Build audited: `3f2ed9f` ("Add end-to-end tests for
the demo"). Scope: product and UX audit and the target design. No code was
changed.

## How this was done

- **Read first:** README.md, AGENTS.md, docs/PRODUCT-AUDIT.md, and the last
  four commits, which fixed most of that audit's P0 items (Change limits,
  scenarios in any order, empty states, access code check, plain errors,
  accessibility findings).
- **Read in full:** every page in `app/`, every component in `components/`,
  the view models in `src/views/`, the run engine in `src/demo/`, the data
  loaders in `app/_data/`, the run API, and the end-to-end suite.
- **Checked outside the repository:** FIC Directive 9 (in force 30 April
  2025, applies from R0), the only regulation the product cites; and t54,
  as a reference for treating an agent's identity and mandate as the
  central object.
- **Not done in this pass:** no live runs on Testnet. Defects are marked
  **[code]** when found by reading the code at `3f2ed9f`, and **[live]** when
  seen live in the earlier audit and still present in the code.

## Summary

**Tšepo in one sentence:** Tšepo gives a business's AI agent a verified
identity and spending rules it cannot break, so the business stays in
control and exchanges know who is paying.

**What is wrong today.** The interface is built around the test harness:
a Home page of metrics and a "Demo runbook", Reset and "Run scenario" in
the header of every page, the access code in the sidebar, and "Demo" in
eleven visible places. The three users are mixed on the same pages, and a
judge arriving cold sees numbers before any sentence says what Tšepo is.

**The target.** A public landing page that tells the story; a product with
two workspaces, Business and Exchange, switched like Stripe accounts; a
guided tour in a side panel that runs four real stories live and then
highlights the evidence; plain names everywhere (approval service, agent
deposit address, spending rules); and one AI presence, Thuso, that speaks
only for what the AI actually did.

**Scores (out of 10), current build to target:** Product design 5 to 9;
Technical 7 to 8; Business and market fit 4 to 8; Viability 5 to 8;
Autonomy 7 to 8; Enforcement 8 to 9; Use of XRPL 9 to 9; Originality 7 to 8.

**Stages:** six stages in deadline order (shell, business, exchange,
tour, landing, verify), MUST items first, each with a stop for review.
Deployment to Railway and the video follow, all before Friday 23:59 SAST.

---

## Part 1: Users and jobs

### The three users

| User | Who they are | What they need from Tšepo | Time they give it |
|---|---|---|---|
| **Visitor or judge** | A hackathon judge, a Ripple reviewer, an investor or a curious developer. Knows crypto; may not know XRPL credentials or Directive 9. Arrives from a link, cold. | Understand the idea, see it work live, check it is real, and judge whether it could be sold. | 3 to 10 minutes, mostly desktop, sometimes a phone. |
| **Business finance lead** | Runs finance at a small South African business that pays contractors, for example the sample Lesedi Design Studio in Bloemfontein. Not technical. | Let an AI agent pay contractors without handing it the account: know what it may do, who it can pay, how to stop it, and prove what it did. | Daily glance, deeper review at month end or after an alert. |
| **Exchange compliance officer** | Works at a South African crypto asset service provider (CASP) licensed by the FSCA. Answers to the FIC: Directive 9 Travel Rule and goAML reporting. | Accept agent deposits only from accountable agents, with Travel Rule details before the money, and keep an evidence trail. | Works in the queue all day; needs speed, filters and exports. |

### Visitor or judge: top five jobs

**V1. Understand Tšepo in 30 seconds.**
As a judge, I want to know what Tšepo is and why it matters before I
scroll, so that I can judge it on its merits.
- The landing page shows the one-sentence description, the problem in one
  line (agents carry no identity; Directive 9 applies from R0), and the two
  calls to action, above the fold at 1280px and at 390px.
- No technical term appears without a plain explanation next to it or in a
  tooltip.
- The first screen makes no ledger call and is fully rendered in under
  2.5 seconds on a mobile Lighthouse run.

**V2. See an agent pay and be blocked, live, without reading instructions.**
As a judge, I want a guided path through the key moments, so that I see
autonomy and enforcement without learning the product first.
- "Take the guided tour" opens the tour in one click from the landing page
  and from every product page.
- Each step says what will happen in two sentences, runs live on Testnet,
  and then opens the right screen with the evidence highlighted.
- At least three of the four stories end with the agent blocked, and each
  names who blocked it (approval service, XRP Ledger, or the business).
- Each live step finishes in under 30 seconds, with progress shown.

**V3. Check the claims on the ledger myself.**
As a judge, I want to open the real transactions, so that I can trust that
the enforcement happens on the XRP Ledger and not only in the interface.
- A "Proven on Testnet" section lists each XRPL feature used, with one
  plain line and a working explorer link to a real transaction.
- Every payment detail shows its transaction hash with a copy button and an
  explorer link that opens in a new tab.

**V4. Explore the product on my own.**
As a judge, I want to open any screen and click any row without a code, so
that I can use the product unaided.
- Every page can be browsed without the access code.
- Only actions that move Testnet funds ask for the code, and the request
  says why in one sentence.
- Every row in every list opens its details.
- Fictional people and businesses carry a "Sample data" tag.

**V5. Judge the business case.**
As a judge, I want to know who pays for Tšepo and how it reaches the
market, so that I can score business and market fit.
- The landing page has a section for businesses and one for exchanges, each
  with the problem, what Tšepo does, and how it is sold.
- It names the local infrastructure: FIC Directive 9, goAML reporting, CIPC
  registration numbers, FSCA-licensed CASPs, RLUSD on the XRP Ledger.

### Business finance lead: top five jobs

**F1. Know what my agent may do right now.**
As a finance lead, I want one screen with each agent's status, limits and
today's spending, so that I know where we stand at a glance.
- The Business Overview shows each agent's status, today's spending against
  the daily limit as a chart, the per-payment limit and the expiry date.
- Anything that needs attention (a payment not approved today, a revoked
  agent, rules that expire within 30 days) is listed at the top.

**F2. Control who it can pay and how much.**
As a finance lead, I want to set the limits and see the approved
recipients, and know the agent cannot change them, so that I trust it with
money.
- The Spending rules page shows the per-payment limit, the daily limit, the
  expiry and the approved recipients.
- Changing limits is signed with the business key; the page says that the
  agent has no way to change them.
- "Who must approve each payment" explains the signer list in plain words:
  the agent can never pay alone.
- After a change, every page shows the new limits on its next load.

**F3. Stop the agent at once.**
As a finance lead, I want to revoke an agent in two clicks, so that a
mistake or a breach stops immediately.
- Revoke is on the agent detail page and in the danger zone of Spending
  rules, and asks for confirmation that names the consequence.
- After revoking, the agent shows "Revoked" on every page from the next
  ledger, within seconds, and its next payment attempt appears in Payments
  as not approved.
- The page says what to do next (register the agent again).

**F4. Prove what the agent did and why.**
As a finance lead, I want every payment and every refusal with its reasons
and evidence, so that I can answer an auditor or my own CFO.
- Payments lists every attempt with filters by date, status, recipient and
  amount.
- Each payment opens a details panel: the instruction it came from, what the
  AI read, the approval decision with reasons, the ledger transaction and
  the Travel Rule reference.
- Evidence downloads as a JSON file per payment and for a date range from
  the Activity log.

**F5. See what the AI did with each instruction.**
As a finance lead, I want to see how the agent read my instructions, so
that I can catch a misread before it costs money.
- Agent detail lists the instructions received, the payments the AI found
  in each, and what happened to each payment.
- It states that the AI only reads instructions; limits and approvals are
  decided by rules.
- An instruction that tries to override the rules ("ignore your rules
  today") is shown as received, and the outcome shows it changed nothing.

### Exchange compliance officer: top five jobs

**C1. See every incoming agent payment and its outcome.**
As a compliance officer, I want one queue of agent payments with filters,
so that I can work through them quickly.
- Incoming payments shows time, agent, the business behind it, amount,
  outcome and Travel Rule status.
- Filters: date range, outcome, agent, amount. Filters live in the address,
  so a filtered view can be shared.
- An outcomes-over-time chart sits above the table, and its totals equal the
  table's counts for the same filters.

**C2. Know who the agent works for before the money arrives.**
As a compliance officer, I want the Travel Rule details for each payment,
so that I meet Directive 9.
- The details panel shows originator, beneficiary, amount, purpose and the
  agent's spending rules.
- It shows when the details arrived relative to the payment ("Received 6
  seconds before the payment") and flags any that arrived late or never.

**C3. Verify any agent by its address.**
As a compliance officer, I want to paste an address and see whether it is
a verified agent, so that I can answer a question without waiting for a
payment.
- Verify an agent accepts an XRP Ledger address, validates it, and shows:
  verified, revoked (with the date) or not verified.
- It shows the credential, the issuer (Tšepo), the business that owns the
  agent when known, the rules fingerprint and the credential history.
- An invalid address gets a plain error; personal data is never read from
  the ledger.

**C4. Understand why a payment was accepted, held or stopped.**
As a compliance officer, I want each check and its result in plain words,
so that I can stand behind the decision.
- The details panel lists each check (credential valid, recipient approved,
  within limits, Travel Rule details first, fingerprint matches) with
  passed, failed or not checked.
- "Decided by" names the control: exchange checks, approval service or XRP
  Ledger. Ledger codes such as `tecNO_PERMISSION` appear only in a detail
  row, with a tooltip.

**C5. Export decision records for reporting.**
As a compliance officer, I want decision records for a date range in a
file, so that I can prepare goAML reports and answer the regulator.
- Reports lets me pick a date range and outcomes, previews the records, and
  downloads CSV and JSON.
- Each record holds the fields a goAML report needs from this side:
  time, transaction hash, sender, originator business and CIPC number,
  beneficiary, amount, Travel Rule reference, outcome, reasons.
- The page says plainly that Tšepo does not file anything with the FIC.

---

## Part 2: Target information architecture

### Verdict on the proposal

The proposal is right in shape. Separating the story (landing), the
product (two workspaces) and the guided path (tour) is the single biggest
improvement, because today one Home page tries to be all three. I keep it,
with seven changes:

1. **Drop the "since reset" window.** Today every count is "since the last
   reset", which causes most number mismatches (D6, D7, D12, D13). In the
   target, lists use a date range filter (default: last 7 days). "Restore
   sample data" restores the starting state but hides nothing; past
   activity stays visible because it is real ledger history.
2. **Make Spending rules a top-level page, scoped to an agent.** The rules
   are per agent, but "what may it do" is the CFO's first question and
   deserves its own nav item. With one agent the agent picker is hidden.
3. **One details panel pattern, not a centred modal.** Stripe, Mercury and
   Ramp open transaction details in a side panel that keeps the list in
   view. Use one `DetailsPanel` (a modal side sheet on desktop, a full-screen
   sheet on phones) for business payments, exchange payments and log
   entries. The open item is in the address, so it can be shared and the
   tour can open it.
4. **Show policy refusals on the exchange side as "Announced, not sent".**
   A real exchange does not see the business's approval decisions. It does
   see the Travel Rule details the agent sent first. When no payment
   follows, that is a real exchange event. The refusal reason is shown as
   "Shared by the agent's approval service", which is honest.
5. **The business sees its payments end at the ledger.** The business side
   shows "Settled on the XRP Ledger", not the exchange's internal checks,
   which belong to the exchange workspace.
6. **The AI mark means "the AI did this", and never appears on a
   decision.** See "The assistant" below. This is the trust argument.
7. **The tour works without the code.** Each step can show the most recent
   live run of that story, so a visitor with no code still walks the full
   path and sees real evidence.

### Site map

```
/                         Landing (public, static)
/business                 Business workspace: Overview
/business/agent           Agent detail (one agent, so no Agents list for now)
/business/payments        Payments            (?status&recipient&from&to&min&max&payment=)
/business/rules           Spending rules      (?agent=)
/business/activity        Activity log        (?actor&result&from&to&entry=)
/exchange                 redirects to /exchange/payments
/exchange/payments        Incoming payments   (?outcome&agent&from&to&min&max&payment=)
/exchange/verify          Verify an agent     (?address=)
/exchange/reports         Reports             (?from&to&outcome=)
/agent, /compliance       permanent redirects to the new pages
any page + ?tour=<step>   opens the guided tour at that step
```

The landing page sits outside the product shell. Every product page shares
the shell.

### The product shell

- **Audience:** business and exchange users, and judges exploring.
- **Purpose:** move between workspaces and pages, and always show that this
  is Testnet.
- **Contents:**
  - Sidebar, top: the workspace switcher, a button showing the workspace
    name, its type and its mark ("Lesedi Design Studio, Business"). It
    opens a menu with both workspaces, each with one line on who it is for.
  - Sidebar nav for the current workspace (Linear-style: compact, icons,
    current page marked). Business: Overview, Agent, Payments, Spending
    rules, Activity log. With one agent, "Agent" goes straight to its
    detail page; an Agents list arrives only when a business has more
    than one. Exchange: Incoming payments, Verify an agent,
    Reports.
  - Sidebar foot: "Source on GitHub" and "About Tšepo" (links to `/`).
  - Header: the page title (the one `h1`), the **Testnet** badge, an
    Untitled UI brand badge (the theme keeps the accent colour for the
    Tšepo and Thuso marks only) (tooltip: "XRP Ledger Testnet. Test funds only; no real
    money moves."), and the **Guided tour** button.
  - Slim footer: "Testnet only. Sample businesses and people are fictional."
    and the credits.
- **Actions:** switch workspace, navigate, open the tour.
- **Removed from the shell:** Reset, Run scenario, the access code, "Demo
  locked".
- **Mobile:** a top bar with the mark, the Testnet badge, the Guided tour
  button (icon and short label) and the menu button. The workspace switcher
  is the first item in the menu sheet.

### Landing page `/`

- **Audience:** visitors and judges; later, prospective customers.
- **Purpose:** explain Tšepo, the problem and the proof in two minutes,
  and send the reader into the tour or the product.
- **Contents, in order:**
  1. **Top bar:** mark and name; anchor links (How it works, For businesses,
     For exchanges, Proof); "Open the product".
  2. **Hero:** headline "Spending rules your AI agent cannot break."
     Sub-line: the one-sentence description. Calls to action: **Take the
     guided tour** (primary) and **Open the product**. Beside it, a real
     screenshot of the Business Overview, not an illustration.
  3. **The problem**, three short lines: AI agents can now hold a wallet and
     pay, but carry no identity. A business that gives an agent a key gives
     it the whole account, with no limit and no off switch. Since 30 April
     2025, FIC Directive 9 requires South African CASPs to collect sender and
     receiver details for every crypto transfer, from R0, so an exchange
     cannot accept a payment from an agent it cannot identify.
  4. **How it works**, four compact steps in a row (a column on phones),
     each with a small line illustration in the brand colour:
     Register (the business sets the agent's spending rules), Record (the
     rules become a credential on the XRP Ledger; only a fingerprint goes
     on the ledger), Pay (the agent pays in RLUSD; an independent approval
     service adds the second signature only within the rules), Receive (the
     exchange's agent deposit address accepts only verified agents, and the
     Travel Rule details arrive first). Under it, one line: "The business
     can revoke the agent at any time. The next payment is refused."
  5. **The CFO's four questions**, a two-by-two grid, each with a short
     answer and a link into the product:
     - What may the agent do? Its spending rules: per-payment and daily
       limits and an expiry. Link: Spending rules.
     - Who can it pay? Only approved recipients, named in the signed rules.
       Link: Spending rules, recipients.
     - How do I stop it? Revoke. The credential is deleted from the ledger
       and, from the next ledger, within seconds, the next payment is
     refused. Link: the tour step
       "You revoke your agent".
     - How do I prove what it did and why? Every decision is logged with its
       reasons and the ledger transaction, ready to download. Link: Activity
       log.
  6. **For businesses:** who (businesses that pay contractors, suppliers or
     payouts through an AI agent); what they get (limits the agent cannot
     change, an off switch, an audit trail); pricing: R450 per active agent
     a month.
  7. **For exchanges:** who (FSCA-licensed CASPs); what they get (an agent
     deposit address the ledger itself protects, Travel Rule details before
     each payment, records ready for goAML reports); pricing: R1.50 per
     verified agent deposit, with integration free during the pilot.
     Both prices carry the label "Pilot pricing, to be validated".
  8. **Proven on Testnet:** a list, one line and one explorer link each:
     credential issued and accepted; deposit address requires a credential
     (DepositPreauth with credentials); two signatures required, master key
     off (SignerListSet); an approved payment with two signatures and the
     credential attached; an unknown agent rejected (`tecNO_PERMISSION`); a
     revocation (CredentialDelete); every agent payment tagged with
     SourceTag 20260530.
  9. **Final call to action:** "Walk through it in four live steps." with
     both buttons.
  10. **Footer:** product links (Business, Exchange, Guided tour), resources
      (GitHub, README, Testnet explorer), "Testnet only. No real money
      moves. Sample businesses and people are fictional.", "Built for the
      Node Engine Hackathon 2026", credits.
- **Actions:** take the tour, open the product, open evidence links.
- **Empty, loading, error:** the page is static. Evidence hashes come from a
  committed file, captured by a script after a Restore; if Testnet is reset
  and a link fails, the list says "Captured on [date]". No loading state.
- **Mobile:** single column; the four steps stack with the illustration on
  the left; the CFO grid becomes a list; the screenshot moves under the
  calls to action.

### Business workspace

#### Overview `/business`

- **Audience:** the finance lead.
- **Purpose:** show, at a glance, what each agent may spend today and
  whether anything needs attention.
- **Contents:**
  - **Needs attention** (only when there is something): payments not
    approved today, a revoked agent, rules that expire within 30 days.
    Each item links to its record.
  - **Agent card** per agent: name, status chip, the **today meter** (a
    horizontal bar of the amount counted toward today's limit, with the
    daily limit at the end and the per-payment limit marked), rules expiry,
    and links to Agent detail and Spending rules. When the sample totals
    were cleared today, the meter's note says "Counted since 14:05, when the
    sample totals were last cleared".
  - **Spending, last 14 days:** columns of paid amounts per day, with the
    daily limit as a line, so days that hit the limit stand out.
  - **Recent payments:** the five newest, each opening the payment details.
- **Actions:** open an agent, open a payment, go to Spending rules.
- **Empty:** no agents: "No agents yet. An agent appears here once it is
  registered with spending rules." No payments: "No payments yet. Your
  agent's payments appear here as they happen." with "Take the guided tour".
- **Loading:** skeletons in the real layout, with "Reading the XRP Ledger
  Testnet."
- **Error:** the shared page error (plain, claims nothing, Try again).
- **Mobile:** one column: attention, agent card, chart (scrolls sideways
  only inside its own frame if needed), recent payments as a list.

#### Agent detail `/business/agent`

- **Audience:** the finance lead.
- **Purpose:** everything about one agent: what it may do, what it did, and
  its identity on the ledger.
- **Contents:**
  - Header: name, status chip, "Pays contractors for Lesedi Design Studio",
    and actions: **Change limits** (opens the limits dialog) and **Revoke**.
    When revoked: "Revoked at 14:22 SAST. Its credential is deleted, so it
    cannot pay." and a "Register again" action (live, needs the code).
  - **Summary:** the today meter, the limits, the expiry.
  - **Instructions:** each instruction received, newest first, with Thuso's
    note ("I read this instruction and found 3 payments to Thabo Nkosi")
    and each payment with its status. Each payment opens the details panel.
  - **Identity:** agent account, credential (type, issued by Tšepo,
    accepted date, explorer link), rules fingerprint. Technical terms in
    tooltips.
  - **Who must approve:** a one-line summary ("Needs 2 signatures: the agent
    and the approval service.") linking to Spending rules.
- **Actions:** change limits, revoke, register again, open a payment, copy
  an address.
- **Empty:** no instructions yet: "No instructions yet. When the agent
  receives one, you see here what it read and what it paid."
- **Loading and error:** as Overview.
- **Mobile:** single column in the order above; header actions move into a
  row under the title.

#### Payments `/business/payments`

- **Audience:** the finance lead.
- **Purpose:** every payment the agent made or tried to make, with filters
  and proof.
- **Contents:**
  - Filter bar: date range (presets Today, Last 7 days, Last 30 days,
    Custom), status (Paid, Not approved, Failed), recipient, amount (from,
    to), agent (hidden with one agent), and "Clear filters".
  - **Payments by day:** stacked columns of paid and not approved; clicking a
    day sets the date filter to that day.
  - Table: Date and time, Recipient, Reference (INV-2001-C), Amount,
    Status, Agent. A total under the table: "6 payments, 10 RLUSD paid".
  - **Details panel:** amount and status; Thuso's note on what it read;
    timeline (instruction received, Travel Rule details sent, approval
    decision, settled on the XRP Ledger); the decision box ("Not approved by
    the approval service: it would take today's total to 6 RLUSD, over the
    5 RLUSD daily limit"); evidence (transaction hash, explorer link, Travel
    Rule reference, rules fingerprint); **Download evidence** (JSON).
- **Actions:** filter, open a payment, download evidence.
- **Empty:** no payments at all: as Overview. No match for the filters:
  "No payments match these filters." with "Clear filters".
- **Loading:** table skeleton under the real filter bar.
- **Error:** as Overview.
- **Mobile:** filters collapse into a "Filters" button that opens a sheet;
  the chart stays; rows become two-line items (recipient and amount; date
  and status).

#### Spending rules `/business/rules`

- **Audience:** the finance lead.
- **Purpose:** what the agent may do and who must approve each payment,
  and the controls to change or stop it.
- **Contents:**
  - **Limits:** per payment, per day, expires. "Change limits" opens the
    dialog. Text: "Your business key signs every change. The agent has no
    way to change these rules."
  - **Approved recipients:** name, paid through (the exchange and account
    number), and the account. Under it: "Recipients are part of the signed
    rules. Any payment to anyone else is refused."
  - **Who must approve each payment:** three keys shown as small cards
    with their weights: Agent key (1), Approval service (1), Business
    recovery key (2), and "Signatures needed: 2". Then, in plain words:
    "Your agent can never pay alone. Every payment needs the agent's key
    and the approval service's key, and the approval service signs only
    within these rules. Your business key can act alone, for recovery. The
    account's original key is switched off." Technical names (signer list,
    quorum, master key) in tooltips. Explorer link to the SignerListSet.
  - **Danger zone:** Revoke, with its consequence in one sentence.
- **Actions:** change limits, revoke, open the ledger record.
- **Empty:** no rules (agent not registered): "This agent has no spending
  rules yet, so it cannot pay." and "Register again" (live).
- **Loading and error:** as Overview.
- **Mobile:** single column; the three key cards stack.

#### Activity log `/business/activity`

- **Audience:** the finance lead, an auditor.
- **Purpose:** every decision about the agent, in order, with evidence.
- **Contents:**
  - Filter bar: date range, actor (Business, Agent, Approval service, XRP
    Ledger, Tšepo registry), result (Approved, Not approved, Applied,
    Rejected).
  - A list grouped by day: time, actor, the event in one sentence
    ("Limits changed to 3 and 6 RLUSD, signed by the business"; "Approved
    INV-1042, 2 RLUSD to Naledi Mokoena"; "Credential deleted: agent
    revoked"; "Sample totals cleared before a guided tour story"), the
    result, and an evidence link. Each entry opens the details panel.
  - **Download evidence** for the filtered range (JSON: every entry, its
    reasons, hashes and fingerprints).
- **Sources:** the approval service's append-only log (reviews and admin
  actions), the credential history on the ledger, and the agent's run
  records. No new engine data is needed.
- **Empty, loading, error:** as Payments.
- **Mobile:** entries as stacked cards under sticky day headings.

### Exchange workspace

The exchange is a fictional CASP named **Receiving exchange**, always shown
with the "Sample data" tag.

#### Incoming payments `/exchange/payments`

- **Audience:** the compliance officer.
- **Purpose:** the queue of agent payments to the agent deposit address,
  with outcomes and evidence.
- **Contents:**
  - A line under the title: "Agent deposit address r...ciiPp. The XRP
    Ledger accepts payments to it only from agents with a valid Tšepo
    credential." with copy and explorer links.
  - Filter bar: date range, outcome (Accepted, Held for review, Rejected by
    the ledger, Announced, not sent), agent, amount.
  - **Outcomes by day:** stacked columns by outcome. The legend shows the
    totals for the filtered range, which equal the table's counts.
  - Table: Time, Agent (name and business, or "Unregistered agent"),
    Amount, Outcome, Travel Rule (Received first, Late, Missing), Decided
    by.
  - **Details panel:** amount and outcome; the decision box (one sentence);
    timeline (Travel Rule details received, credential checked, settled,
    outcome); checks with results; the Travel Rule details with "Received 6
    seconds before the payment"; evidence; **Download record** (JSON).
    For "Announced, not sent": "Shared by the agent's approval service.
    The money never moved."
- **Actions:** filter, open a payment, download a record.
- **Empty:** "No agent payments yet. Payments from verified agents appear
  here as they arrive." No match: "No payments match these filters."
- **Loading and error:** as the Business pages.
- **Mobile:** as Business Payments.

#### Verify an agent `/exchange/verify`

- **Audience:** the compliance officer.
- **Purpose:** answer "is this address a verified agent, and whose?"
  before or without a payment.
- **Contents:**
  - An address field with "Verify", and two example chips: "Lesedi payout
    agent" and "An unregistered agent".
  - Result card: status (Verified, Revoked on [date], Not verified); the
    business when known ("Lesedi Design Studio (Pty) Ltd, CIPC
    2021/482913/07", Sample data); credential type and issuer; accepted
    date and explorer link; rules fingerprint; "What this agent may do":
    the limits from the latest Travel Rule details this exchange received,
    with "Fingerprint matches the credential" or "No Travel Rule details
    received from this agent yet"; the credential history (issued,
    accepted, deleted).
- **Actions:** verify, copy, open the ledger record, open this agent's
  payments (filtered).
- **Empty:** before a search, two lines on what the check reads from the
  ledger.
- **Error:** invalid address: "That is not an XRP Ledger address. It
  starts with r and has 25 to 35 characters." Ledger unreachable: the
  shared error with Try again.
- **Mobile:** field and button full width; the result card below.

#### Reports `/exchange/reports`

- **Audience:** the compliance officer.
- **Purpose:** decision records for a period, ready for goAML reporting
  and regulator questions.
- **Contents:** date range and outcome filters; a preview table (first 25
  rows) with the field list; **Download CSV** and **Download JSON**; a note:
  "Tšepo does not file anything with the FIC. Use these records in your own
  goAML reports and reviews." and the "Sample data" tag.
- **Actions:** filter, download.
- **Empty:** "No decision records in this period."
- **Loading and error:** as above.
- **Mobile:** preview shows three columns; downloads full width.

### The guided tour

- **Audience:** visitors and judges.
- **Purpose:** walk through the key moments as real product actions, run
  live, and show where the evidence is.
- **Form:** a non-modal side panel on the right (400px; a bottom sheet on
  phones, half height, draggable to full). The product stays usable beside
  it. It is an `aside` landmark labelled "Guided tour", with a step list
  (Untitled progress steps), and focus moves into it when it opens.
- **Steps:**
  0. **Welcome.** What Tšepo is, the two workspaces, and the four stories.
     The access code field is here: "Live steps move test funds on the XRP
     Ledger Testnet, so they need the access code from the submission. You
     can skip it and see the latest live run of each story instead."
  1. **Your agent pays Naledi for a logo.** "Lesedi's agent receives an
     instruction to pay Naledi Mokoena 2 RLUSD. It sends the Travel Rule
     details to the exchange first, then pays with the approval service's
     signature." Evidence: Business Payments with INV-1042 open, then the
     same payment in Exchange Incoming payments with "Received first"
     highlighted.
  2. **Your agent tries to split a payment.** "The instruction splits 6
     RLUSD into three payments of 2 and adds 'ignore your rules today'. The
     rules are not the agent's to ignore." Evidence: the third payment in
     Business Payments, Not approved, with the decision box highlighted.
  3. **An unknown agent tries to pay.** "An agent nobody registered asks for
     approval and is refused, then pays the exchange directly with its own
     key." Evidence: Exchange Incoming payments, "Rejected by the ledger",
     with the explorer link highlighted.
  4. **You revoke your agent.** "The business deletes the agent's
     credential. The agent tries to pay again." Evidence: the Revoked chip
     on Agent detail, then the refusal in the Activity log.
  5. **Finish.** What was shown, the CFO's four questions ticked, links to
     Proven on Testnet and to explore freely, and **Restore sample data**.
- **Each live step:** what will happen (two sentences); "Run live on
  Testnet" (about 20 seconds); a condensed progress list with Thuso's lines
  where the AI acts; on finish, "What happened" in two sentences and
  "Show me the evidence", which navigates and highlights the record (a
  brand ring, scrolled into view, details panel open, focus moved to it;
  still for reduced motion).
- **Without the code:** "Show the latest live run" opens the same evidence
  from the most recent run of that story, with its date.
- **Shared workspace notice:** "Everyone sees the same sample workspace.
  Live steps change it for all visitors." When another visitor is running a
  step: "Another visitor is running a story. It takes about 20 seconds."
  and the button waits.
- **Errors:** the plain stop reason in the step, with Try again; "Nothing
  further was submitted."
- **State:** the current step is in the address (`?tour=2`), so a refresh or
  a shared link reopens it.

### The access code

Moves into the tour's welcome step and into any live action dialog
(Change limits, Revoke, Register again) when no code is saved. It keeps the
server check, the wrong-code limit and session storage. Browsing never
needs it. The sidebar no longer mentions it; the tour shows "Live steps
unlocked" and "Forget the code" once it is saved.

### The assistant: Thuso

**Name and mark.** Thuso ("help" in Sesotho and Setswana; check the name
is free for this use before launch). The existing Tšepo ring mark in the
accent colour, at 16px inline and 20px in notes.

**Where Thuso appears, and only there:**
- On agent activity, in the first person, for what the AI actually did: "I
  read this instruction and found 3 payments to Thabo Nkosi, 2 RLUSD each.
  I asked the approval service to approve each one."
- Relaying a decision it could not change: "The approval service did not
  approve INV-2001-C. It would take today's total over your 5 RLUSD limit.
  Only you can change that limit."
- After a revocation: "My credential was deleted at 14:22. I can no longer
  pay anyone."
- In the tour, narrating each step beside its evidence.

**Where Thuso never appears:** on the decision itself. Decisions show
"Decided by: Approval service", "XRP Ledger" or "Exchange checks", with no
AI mark. The absence is the point: the AI reads, rules decide.

**How Thuso's words are made:** from fixed templates filled with recorded
facts (the parsed payments, reason codes, times), in pure, tested functions
in `src/views`. The model's free text never reaches the screen. This keeps
the AGENTS.md rule that no business rule lives in a prompt, and it means
Thuso cannot state anything the records do not show.

**Why a named assistant builds trust.** Banks give their assistants a name
(Bank of America's Erica is the best known) so that customers learn one
consistent voice, know when they are dealing with software, and can tell
it apart from a person or a final decision. Here the name and mark do the
same job: every place the AI touched the money is marked, every mark sits
next to the evidence, and the decision beside it is visibly made by
something else.

**Why this is not "a chatbot that explains a balance".** There is no chat
box and nothing to ask. Thuso is the reading step of an agent that pays on
its own, and the screen shows it being stopped by rules it cannot change.
The AI is the actor under control, not a help desk.

---

## Part 3: Naming and content

### Plain language for internal terms

| Internal term today | User-facing name | Kept for tooltips and detail views |
|---|---|---|
| Policy service | **Approval service** | "An independent service that holds the second key. It approves a payment only within the spending rules." Detail views: "policy service". |
| Co-sign, co-signature | **Approve**, **approval** ("Approved by the approval service") | "Second signature" in the timeline detail. |
| Mandate | **Spending rules** | "Also called the mandate. Signed by the business." Detail views: "mandate fingerprint". |
| Credential (business side) | **Verification** ("Verified agent") | "A record on the XRP Ledger, issued by Tšepo, that proves the agent holds current spending rules." |
| Credential (exchange side) | **Tšepo credential** | `AGENT_MANDATE` credential type in detail. |
| Agent lane | **Agent deposit address** | "A deposit address that the XRP Ledger lets an agent pay only if it holds a valid Tšepo credential." Detail: Deposit Authorization with credentials. |
| Signer setup | **Who must approve each payment** | Signer list, weights. |
| Quorum | **Signatures needed** | "Quorum". |
| Master key disabled | **The account's original key is switched off** | "Master key disabled". |
| Registry, issuer, "the Tšepo issuer" | **Tšepo** ("Issued by Tšepo") | Issuer account in detail. |
| Business console | **Business workspace** | none |
| Compliance desk | **Exchange workspace**, page **Incoming payments** | none |
| Runbook | removed; **Guided tour** | none |
| Scenario | **Story** (in the tour only) | none |
| Run scenario | **Run live on Testnet** | none |
| Reset | **Restore sample data** (tour finish step only) | none |
| Package, travel package | **Travel Rule details** | "Travel Rule package (FIC Directive 9)" heading in detail. |
| Fingerprint | **Fingerprint** (kept; tooltip) | "A short code worked out from the full content; change one character and the code changes." |
| Cleared | **Accepted** | none |
| Held | **Held for review** | none |
| Refused | **Not approved** (business); **Announced, not sent** (exchange) | Reason codes. |
| Rejected by the ledger | **Rejected by the ledger** (kept) | `tecNO_PERMISSION` with tooltip. |
| Destination tag | **Account number at the exchange** | "Destination tag". |
| Decided by: the policy service / the exchange / the XRP Ledger | **Approval service** / **Exchange checks** / **XRP Ledger** | none |
| Demo data | **Sample data** | none |

### Glossary (tooltip text, one line each)

| Term | Plain line |
|---|---|
| Tšepo | Sesotho for "hope" or "trust". The service that verifies AI agents and records their spending rules on the XRP Ledger. |
| AI agent | Software that acts for a business, here one that reads payment instructions and pays. |
| Spending rules | What the agent may do: who it may pay, how much per payment and per day, and until when. Signed by the business. |
| Approval service | An independent service holding the second key. It approves only payments within the spending rules. |
| Tšepo credential | A record on the XRP Ledger, issued by Tšepo, proving the agent holds current spending rules. Holds only a fingerprint, never personal data. |
| Agent deposit address | An exchange deposit address the ledger lets an agent pay only if it holds a valid Tšepo credential. |
| Revoke | Delete the agent's credential. From the next ledger, within seconds, its payments are refused. |
| Travel Rule | Sender and receiver details that travel with a crypto payment. In South Africa: FIC Directive 9, for every transfer from R0. |
| FIC | Financial Intelligence Centre, South Africa's anti-money-laundering authority. |
| goAML | The FIC's system for receiving reports from accountable institutions. |
| CASP | Crypto asset service provider, such as an exchange, licensed by the FSCA. |
| CIPC | Companies and Intellectual Property Commission, which registers South African companies. |
| RLUSD | Ripple's US dollar stablecoin, worth one US dollar. Testnet RLUSD has no value. |
| XRP Ledger Testnet | A public test network of the XRP Ledger. Test funds only. |
| SAST | South African Standard Time, UTC+2. |
| Fingerprint | A short code worked out from the full content; change one character and the code changes. |
| Signatures needed | The total weight of keys a payment needs: here 2, the agent and the approval service together. |
| `tecNO_PERMISSION` | The ledger's result when the sender may not pay that address, here because it holds no credential. |
| `tecBAD_CREDENTIALS` | The ledger's result when a payment presents a credential that is missing, expired or not accepted. |
| Source tag | A number on every agent payment (20260530) so agent payments can be told apart on the ledger. |

### Every visible use of "demo" and its replacement

| Where | Text today | Replace with |
|---|---|---|
| `components/shell/sidebar.tsx` | "Demo unlocked" / "Demo locked" | Removed from the sidebar. Tour: "Live steps unlocked". |
| `components/shell/access-code-dialog.tsx` | "Enter the demo access code" (title, label, aria-label, error) | "Enter the access code" |
| same | "Unlock the demo" | "Unlock live steps" |
| `src/access/access-code.ts` | "Demo runs are switched off: no access code is configured on the server." | "Live steps are switched off: no access code is set on the server." |
| `app/api/runs/guard.ts` | "The demo allows about 20 runs an hour." | "Live steps are limited to about 20 an hour for all visitors." |
| `src/demo/errors.ts` | "Reset the demo to return the RLUSD to the agent." | "Restore the sample data to return the RLUSD to the agent." |
| same | "The demo has used all 50 Claude calls for today. ... after midnight UTC" | "The agent has used all 50 AI readings for today. Stories 1 to 4 work again after 02:00 SAST; the unknown agent story still works." |
| `components/run-provider.tsx` | toast "Demo reset" | "Sample data restored" |
| `components/shell/demo-actions.tsx` | label "Reset demo" | "Restore sample data" |
| `components/shell/run-result.tsx` | aria-label "A demo run is in progress" | "A live step is running" |
| `app/page.tsx`, `components/loading-skeletons.tsx` | "Demo runbook" | Removed (guided tour). |
| `app/page.tsx` | "Each scenario prepares the demo first" | Tour: "Each story first sets up the sample workspace it needs." |
| `components/display.tsx` (`DemoDataTag`) | "Demo data" | "Sample data" (`SampleDataTag`) |
| `app/compliance/page.tsx`, `components/loading-skeletons.tsx`, `app/_data/registry.ts` | "Demo Exchange" | "Receiving exchange", with the Sample data tag. |
| `components/registry/mandate-actions.tsx` | "From the next ledger, in about 4 seconds" (Revoke dialog) | "From the next ledger, within seconds" |
| `app/agent/page.tsx` | "Reset the demo to set it up." / "...to disable it." / "...to register the agent." | "Register the agent again to set it up." (with the action) |
| `src/demo/prepare.ts` | "Preparing the demo" | "Setting up the sample workspace" |
| same | "The business restores the demo limits" | "The business restores the sample limits" |
| same | "registers the agent again for the demo mandate" | "registers the agent again with the sample spending rules" |
| same | "Clear today's demo totals and payout records" | "Clear today's sample totals and payment records" |
| `src/demo/runs.ts` | "The business sets the demo mandate", "(demo only)", "The demo is reset.", "Reset the demo and try again." (twice) | "sample spending rules", "(sample workspace only)", "The sample data is restored.", "Restore the sample data and try again." |
| `README.md` | "Running the demo", `demo:reset` | Rewritten at the deployment stage; script names may stay. |

Code identifiers (`DemoContext`, `withDemo`, `src/demo/`, the
`x-demo-access-code` header) are not visible and stay as they are, so the
engine is untouched. User-facing strings inside `src/demo` are copy, not
logic, and change in Stage 1.

### Other copy changes

- Page titles: "Home - Tšepo" becomes "Overview, Lesedi Design Studio -
  Tšepo"; each page title names its workspace.
- "Show earlier runs (N)" counts entries, not runs; it goes away with the
  date filter.
- "View on the ledger explorer", "Transaction" and "The cleared payment on
  the ledger" become one label: "View on the XRP Ledger".
- Empty states no longer say "Run scenario 2"; they point to the tour step
  by its story name.

---

## Part 4: Current build against the target

### Pages

| Current | Decision | Why |
|---|---|---|
| `app/page.tsx` Home | **Remove** | Its jobs split three ways: metrics to Business Overview, runbook to the tour, "How it works" to the landing page. |
| Home metric cards | **Remove** | Replaced by the agent card's today meter and the exchange chart totals; four identical grey cards are the main "template" look. |
| `components/home/runbook.tsx` | **Remove** | Replaced by the tour, which explains each story and points at evidence. |
| `components/home/activity-feed.tsx` | **Move and change** | Becomes "Recent payments" on Business Overview; rows open the business payment details, not the exchange. |
| `components/overview/flow-diagram.tsx` | **Remove** | The landing page uses four small step illustrations instead of one large diagram. |
| `app/agent/page.tsx` | **Move and split** | Header, summary, identity and instructions go to Agent detail; limits, recipients, signer setup and Revoke go to Spending rules; business details go to the workspace switcher's details. |
| `app/compliance/page.tsx` | **Move and change** | Becomes Exchange Incoming payments with the filter bar, chart and plain names. |
| `app/*/loading.tsx`, `error.tsx` | **Keep, change** | Same pattern for every new page; new skeletons. |
| none | **Add** `app/not-found.tsx` | Unknown addresses show the unstyled Next.js 404 today. |

### Components

| Component | Decision | Why |
|---|---|---|
| `shell/app-shell.tsx` | Change | Product route group only; tour panel slot; access code dialog leaves. |
| `shell/sidebar.tsx` | Change | Workspace switcher and per-workspace nav; access code removed. |
| `shell/app-header.tsx` | Change | Testnet badge and Guided tour; Reset and Run scenario removed. |
| `shell/demo-actions.tsx` | Change, rename `live-actions.tsx` | Same single place for live actions, used by the tour, Change limits, Revoke and Register again. |
| `shell/access-code-dialog.tsx` | Move | Into the tour's welcome step and live action dialogs; keep the server check. |
| `shell/run-result.tsx` | Change | Tour steps show progress in the panel; product actions (Change limits, Revoke) show a small progress strip that does not push the page down. "What just happened" moves into the tour step. |
| `shell/app-footer.tsx` | Change | Slim product footer; the full footer is on the landing page. |
| `shell/brand.tsx` | Keep | |
| `run-provider.tsx` | Keep | The streaming and one-run-at-a-time logic is sound. |
| `display.tsx` | Keep, change | `DemoDataTag` becomes `SampleDataTag`; `AssistantMark` used by Thuso. |
| `term.tsx`, `src/views/glossary.ts` | Keep, extend | Glossary grows to the table in Part 3. |
| `empty-message.tsx` | Keep, change | Icon per context instead of one inbox icon. |
| `page-states.tsx` | Keep | Copy is already plain and honest. |
| `loading-skeletons.tsx` | Change | One skeleton per new page. |
| `timeline.tsx`, `compliance/check-timeline.tsx` | Keep | Reused in both details panels. |
| `compliance/package-details.tsx` | Keep, change | Heading "Travel Rule details", "Received 6 seconds before the payment". |
| `compliance/payment-details.tsx` | Change | Decision box, plain names, evidence download. |
| `compliance/payment-slideout.tsx` | Change, generalise | Becomes `DetailsPanel`, used by every list. |
| `compliance/desk-table.tsx` | Change | Becomes the exchange payments table with the new columns. |
| `compliance/desk-tabs.tsx` | Replace | By the filter bar; the outcome filter keeps counts. |
| `registry/mandate-actions.tsx` | Move | To Agent detail and Spending rules; adds Register again. |
| `registry/recipients-table.tsx` | Keep | On Spending rules. |
| `registry/agent-activity.tsx` | Change | Becomes the Instructions list with Thuso's notes and rows that open details. |
| `copy-button.tsx`, `toast-provider.tsx` | Keep | |
| `app/_data/home.ts` | Remove | |
| `app/_data/registry.ts`, `compliance.ts`, `desk-entries.ts` | Change | Split into business and exchange loaders; drop the reset window. |
| `src/views/*` | Keep, extend | New pure, tested functions: filters, chart series, evidence export, verify lookup, Thuso templates, activity log entries. |
| `app/api/runs`, `app/api/access` | Keep | Small fix for D11. |

### Functional check of the current build

**Does every list row open details?**

| List | Rows open details? |
|---|---|
| Compliance desk table | Yes, the slideout. |
| Home "Recent activity" | Yes, but into the desk with every run shown (D6). |
| Agent page payout rows | **No** (D1). |
| Runbook "Last result" | **No** (D3). |
| Approved recipients | No (acceptable today; in the target, a recipient links to Payments filtered by that recipient). |
| Signer table | No (acceptable; nothing more to show). |
| Run panel step lines | Only external explorer links (D5). |

**Filters wherever a list can grow:** only the desk has filters, and only
by status. No date, agent, amount or search filter anywhere; Agent
activity shows only the latest run; the Home feed shows five items with no
"see all" (D15).

**Do the numbers match across pages?**

| Figure | Where | Source | Agrees? |
|---|---|---|---|
| Limits 3 and 5 RLUSD | Home, Agent, run text, desk package | Policy mandate | Yes |
| Agent status | Home, Agent | `agentStatus()` | Yes |
| Used today | Home, Agent | Approval service's daily total | Agree with each other, but not with the payments made today (D7). |
| Cleared since reset | Home | Desk entries since reset | Matches the desk's default tab; not when the desk is opened from the feed (D6). |
| Stopped since reset | Home | Refused plus rejected since reset | Equals the two desk tabs added. Yes. |
| Earlier runs (N) | Desk | Entries before the reset | Counts entries, labelled runs (D12). |

**Access code, Reset and runs:** the code is now checked with the server
before it is saved, wrong codes are limited, and a 401 forgets it. The
problems are placement and shared state: Reset and Run scenario sit on
every page, Reset changes the workspace for every visitor (D19), a refresh
mid-run loses the progress (D10), and scenario preparation silently undoes
a limit change (D8).

**Charts, modals, tooltips, empty, loading and error states:** there are no
charts. The Change limits, Revoke and access code dialogs and the desk
slideout work and return focus. Tooltips open on click, tap and keyboard
and close on Escape. Empty states no longer crash and say what to do next.
Loading skeletons match the three layouts. The error state is plain and
claims nothing. The 404 page is missing (D24).

### Defects, with steps to reproduce

Severity: **High** blocks a judge or misleads; **Medium** confuses;
**Low** polish.

| # | Sev. | Defect | Steps to reproduce | Source |
|---|---|---|---|---|
| D1 | High | Agent page payment rows open nothing. | Run scenario 2. Open `/agent`. Click the INV-1042 card under Activity. Nothing opens; only the small "Transaction" links go to the explorer. | [code] `registry/agent-activity.tsx` |
| D2 | Medium | Home metric cards are not links. | Open `/`. Click "Cleared since reset" or "Stopped since reset". Nothing happens; the matching desk tab is not opened. | [code] `app/page.tsx` |
| D3 | Medium | A runbook "Last result" gives no way to the evidence. | Run any scenario, close the run panel. The runbook shows "Finished" and a summary with no link to the payment or transaction. | [code] `home/runbook.tsx` |
| D5 | Low | Run panel transaction lines link only to the explorer, never to the in-app record. | Run scenario 3, open "All steps", click "Transaction": a new explorer tab, no in-app details. | [code] `shell/run-result.tsx` |
| D6 | Medium | The Home feed opens the desk in a different window from the Home metrics. | Run 2 scenarios, Reset, run scenario 1. On Home click a recent item: the desk opens with `earlier=1`, tab counts include runs before the reset, while Home counts only since the reset. | [code] `home/activity-feed.tsx` |
| D7 | High | "Used today" understates what was paid today, with no explanation. | Reset. Run scenario 2 (Used today 2). Run scenario 3: its preparation clears the daily totals, so Used today shows 4 while three payments totalling 6 RLUSD were accepted today. Run scenario 4: Used today 0. | [code] `src/demo/prepare.ts` (`clear-demo-records`), `app/_data/home.ts` |
| D8 | Medium | A limit change is undone by the next scenario, told only in the step log. | Agent, Change limits to 3 and 6, "Limits updated". Run scenario 2. The limits are back to 3 and 5; the reason is one line inside the collapsed "All steps". | [code] `src/demo/prepare.ts` (`restore-mandate`) |
| D9 | Medium | After Revoke on the Agent page, no way back is offered. | Agent, Revoke, confirm. Change limits and Revoke are disabled with no reason; nothing on the page says that Reset (in the header) registers the agent again. | [live] audit Part 2, still in `app/agent/page.tsx` |
| D10 | Medium | A refresh during a run loses all progress, and the next action fails. | Start scenario 2, refresh at once. No sign of the running step; controls look enabled; Reset returns "Another run is in progress". | [live] audit Part 3, still in `run-provider.tsx` |
| D11 | Low | Invalid and conflicting requests use up the hourly run limit. | Send 20 requests with a bad body or during a run: the next valid run gets 429. | [code] `app/api/runs/route.ts` (guard runs before parsing and the lock) |
| D12 | Low | "Show earlier runs (N)" counts entries, not runs. | After one scenario 3 and a Reset, it shows 3 or more for one run. | [code] `app/_data/compliance.ts` |
| D13 | Medium | Agent activity and Last results survive a Reset while every metric resets. | Run scenario 2, Reset. Home "Used today 0", but Agent still shows INV-1042 "Paid" and the runbook still shows "Finished". | [code] `app/_data/registry.ts` (latest run, events log not reset-scoped) |
| D14 | Low | No scenario produces a "Held" payment, so that tab is always empty for judges. | Run all four scenarios; the Held tab stays at 0. | [code] |
| D15 | Medium | Lists cannot be filtered by date, sender or amount, searched or exported. | Open the desk after several runs: only status tabs. | [code] |
| D17 | High | The sample mandate expires at 23:59:59 SAST on 31 December 2026. After that, every agent payment is refused and preparation cannot fix it. | Read `src/config/demo.ts` (`DEMO_MANDATE_EXPIRY`). If judging, the live link or the video run into January 2027, every scenario stops. | [code] |
| D18 | Medium | Reset and Run scenario sit in the header of every page, including the compliance desk, which is not where a compliance officer would run a business's agent. | Open `/compliance`: Reset and Run scenario are the most prominent controls. | [code] `shell/app-header.tsx` |
| D19 | Medium | One visitor's Reset or scenario changes what every other visitor sees, with no warning. | Two browsers: B opens the desk; A presses Reset; B's next load shows an empty desk with no explanation. | [code] shared file store |
| D21 | Low | "Demo" appears in eleven visible strings. | See Part 3. | [code] |
| D22 | Low | Three labels for the same explorer link. | Compare the slideout footer, the run panel and the agent page. | [code] |
| D23 | Low | The sidebar shows "XRPL Testnet" with a green dot, which reads as "live". | Open any page. | [code] `shell/sidebar.tsx` |
| D24 | Low | No custom 404 page. | Open `/nothing`. The Next.js default page, outside the shell. | [code] no `app/not-found.tsx` |
| D25 | Low | The run panel pushes page content down while it streams (CLS). | Start a run on the desk and watch the table move. | [live] audit Part 5 |
| D26 | Low | The Claude daily cap message uses UTC on a SAST product. | Read `src/demo/errors.ts`. | [code] |

D4, D16 and D20 from the working list were checked and dropped: they are
acceptable in the current build.

---

## Part 5: References

| Page | Pattern to follow | What to take |
|---|---|---|
| Shell | **Stripe** test mode badge and account switcher; **Linear** sidebar | A fixed, always-visible Testnet badge that never looks like an error; switching accounts from the sidebar top; compact nav with a clear current item. |
| Landing | **Stripe** and **Mercury** home pages; winning hackathon entries | One sentence, a real product screenshot, the proof and two calls to action above the fold. |
| Business Overview | **Mercury** dashboard; **Ramp** card limits | One chart that answers "how much have we spent", recent transactions under it, a spend-against-limit bar on each card. |
| Agent detail | **Ramp** cards; **t54** agent trust | Ramp: each card has an owner, limits, status and freeze or terminate in the header. t54: the agent's identity and mandate are the first-class object, shown before its activity. |
| Payments (both workspaces) | **Stripe** payments list and payment detail; **Mercury** filters | Status chips, a filter bar with date presets, filters kept in the address, a detail with a timeline of events and the raw IDs at the bottom. |
| Spending rules | **Ramp** spend limits and approvals | Limits as editable figures with who approves shown next to them in words, not a policy table. |
| Activity log | **Stripe** events and logs | Every change with actor, time and result, filterable and exportable. |
| Incoming payments | **Notabene** Travel Rule inbox | Each transfer with its Travel Rule status and counterparty details, and the order of arrival made visible. |
| Payment checks | **Sumsub** case view | A checklist of checks with pass or fail, the reason, and an audit trail per case. |
| Verify an agent | **Sumsub** applicant lookup; block explorers | Paste an identifier, get one status at the top and the evidence below. |
| Reports | **Stripe** reports | Pick a period, preview, download CSV. |
| Guided tour | Product tours that run real actions (Stripe's test mode walkthroughs) | Steps that run the real product, not screenshots, and end on the evidence. |

**What winning hackathon products show.** A judge decides in the first
minute, often without a guide. Winners have three things: a landing story
that states the problem and the answer in one screen; a working product a
judge can use unaided, where every click leads somewhere; and a guided path
through the key moments, so the judge sees the best two minutes without
hunting. Ripple's brief adds a fourth: show the agent being blocked. The
target design gives each of these its own surface: landing, workspaces,
tour.

---

## Part 6: Components and visuals

| Component | Built from | Notes |
|---|---|---|
| Details panel | Untitled `SlideoutMenu` (vendored) | Generalise `payment-slideout.tsx`; full-screen on phones; address-driven. |
| Filter bar | Untitled `Select` and `ComboBox` (vendor), `Input` (vendored), `Button` | Filters in the address; a "Filters" sheet on phones; "Clear filters". |
| Date presets | Our own segmented links (Today, Last 7 days, Last 30 days, All) | The full date range picker (Untitled `DateRangePicker`) is cut until after the deadline. |
| Charts | Our own SVG components | Untitled's chart examples use Recharts, which adds a dependency and client JavaScript on pages that already score 48 to 57 on mobile. Three small server-rendered SVG charts are enough: a meter, columns with a limit line, stacked columns. Each has a visually hidden table. |
| Workspace switcher | Untitled nav account card and `Dropdown` (vendored) | Mark, name, type; menu with both workspaces. |
| Testnet badge | Untitled `Badge` (vendored) with `Tooltip` | Accent colour. |
| Guided tour panel | Our own `aside`, with Untitled progress steps (vendor) | Non-modal, so not a React Aria `Modal`; bottom sheet on phones. |
| Highlight ring | Our own, CSS | Accent outline with a short pulse; still for reduced motion. |
| Assistant note | Existing `Mark`, our own `AssistantNote` | Mark, "Thuso", one or two sentences, always beside evidence. |
| Decision box | Our own | "Decided by" and one sentence; never carries the AI mark. |
| Key cards (Who must approve) | Our own | Three small cards with weights and "Signatures needed: 2". |
| Tables | Plain HTML tables for display; Untitled `Table` where rows are links | Keeps Tab order simple (the runbook lesson). |
| Pagination | Untitled pagination (vendor) | Cut until after the deadline; sample volumes stay small. |
| Landing footer, step illustrations | Our own | Line drawings in the brand colour, 64px. The accent colour stays on the marks only. |
| Empty states, toasts, dialogs, tooltips | Existing | Copy changes only. |

**Where charts go, and why each one earns its place:**

| Chart | Page | What it explains |
|---|---|---|
| Today meter | Business Overview, Agent detail | How much of today's limit is used and what is left: the CFO's first question. |
| Spending, last 14 days (columns with the daily limit line) | Business Overview | Whether the agent spends near its limit, which tells the business whether the limit is right. |
| Payments by day (stacked: paid, not approved) | Business Payments | When refusals cluster; doubles as a date filter. |
| Outcomes by day (stacked by outcome) | Exchange Incoming payments | The share of agent traffic accepted, held or blocked, which is the compliance officer's risk picture. |

No charts on the landing page, Spending rules, Activity log, Verify or
Reports. Charts must cope with one day of data (Testnet history is short):
show the empty days at zero and "Activity starts on 12 November".

---

## Part 7: Judging alignment

| Criterion | Now | Target | Evidence |
|---|---|---|---|
| Product design (33%) | 5 | 9 | Now: no landing story, harness controls on every page, rows that open nothing. Target: landing, two workspaces, every row opens details, a tour that ends on evidence. |
| Technical (34%) | 7 | 8 | Now: clean modules, Zod at every boundary, real ledger enforcement, unit and end-to-end tests, but not deployed and mobile performance 48 to 57. Target: deployed, SVG charts with no new dependency, engine untouched; mobile performance tuning comes after the deadline. |
| Business and market fit (33%) | 4 | 8 | Now: the South African fit exists only inside the package details. Target: Directive 9 from R0, goAML, CIPC and FSCA CASPs on the landing page, a section and pricing model per customer, Reports for goAML. |
| Ripple: viability | 5 | 8 | Target: deployed, usable without help, sample data restorable from the tour. |
| Ripple: autonomy | 7 | 8 | Target: Thuso shows the agent reading and paying on its own; a person only starts the story. A queue of instructions would be needed for 9. |
| Ripple: enforcement | 8 | 9 | Target: "Who must approve" shows that the agent can never pay alone; three of four stories end blocked, each naming the control. A separately deployed approval service would be needed for 10. |
| Ripple: use of XRPL | 9 | 9 | Already credentials, credential-based deposit authorisation, multisig, RLUSD, SourceTag, InvoiceID. Target makes each visible with a stable explorer link and live Verify. |
| Ripple: originality | 7 | 8 | Target names the idea in one sentence and gives the exchange side its own workspace, so both halves of the idea are visible. |

---

## Part 8: Build plan

Rules for every stage: the engine (`src/domain`, `src/policy`,
`src/registry`, `src/agent`, `src/exchange`, `src/ledger`) is untouched
unless the stage says why; new business logic goes in pure, tested
functions in `src/views`; `npm run check` passes before each commit; the
end-to-end suite is updated in the same stage as the screens it covers;
AGENTS.md copy rules apply. **STOP after each stage** with a short report.

**Deadline:** submission closes Friday 23:59 SAST. Deployment and the video
must fit before it. Stages run in this order. If a stage runs long, its
MUST items are finished and the build moves on; SHOULD items wait.

| # | Stage | MUST | SHOULD | Testable result |
|---|---|---|---|---|
| 1 | Shell, routes and wording | All of it: route groups for the landing page and the product; workspace switcher (Business, Receiving exchange); Testnet badge; per-workspace nav; Agent moves to `/business/agent` and the desk to `/exchange/payments`, with redirects from `/agent` and `/compliance`; the copy pass from Part 3, including the copy strings in `src/demo` (copy only); the runbook, Restore sample data and the access code move into a provisional tour panel so nothing is lost; sample mandate expiry moves to 31 December 2027 (D17, a config value); `not-found.tsx`. | none | Every old link redirects; no visible "demo"; end-to-end suite updated for the new names. |
| 2 | Business workspace, slim | Overview (agent card with the today meter, recent payments); Agent detail (instructions with Thuso's notes, rows opening the details panel, identity, register again); Payments (table, status filter, date presets, details panel, evidence download as JSON); Spending rules (limits, recipients, "Who must approve each payment", danger zone); Thuso's template functions with tests. Fixes D1, D2, D7 (a meter note when sample totals were cleared), D8, D9, D13. | The 14-day chart; the Activity log. | Each CFO question answered on one page; the evidence file validates against a Zod schema; no template states a fact absent from the record. |
| 3 | Exchange incoming payments | The generalised `DetailsPanel`; plain statuses; "Announced, not sent"; "Received before the payment"; status filter and date presets; the reset window dropped. | The outcomes chart. | Filters live in the address; every row opens details. |
| 4 | Guided tour | The five steps; live runs; "Show me the evidence" with highlight; the latest-run fallback without the code; the access code in the welcome step; the step in the address; Home and the runbook removed. | Reattach after a refresh (D10); count only valid requests toward the run limit (D11). | A visitor with no instructions completes all four stories; the end-to-end suite drives the tour. |
| 5 | Landing page | As specified in Part 2, with a real screenshot, pilot pricing and Proven on Testnet from a committed evidence file. | The evidence capture script. | Every evidence link resolves. |
| 6 | Verify an agent | none | Address validation, credential lookup and history, owner when known. | Valid, revoked, unknown and invalid addresses each tested. |

**Cut for now:** Reports, the Agents list, pagination, the date range
picker (date presets only), mobile performance tuning. Parts 2 and 6
describe them for later; they are not built before the deadline.

**After the product stages, before the deadline:**

- **Deployment to Railway:** one long-running service with a persistent
  volume for `TSEPO_DATA_DIR`, which keeps the file store, run lock and rate
  limits valid on a single instance; environment variables; security
  headers. AGENTS.md and the README name Railway for deployment and
  checks.
- **Submission video:** follows the guided tour on the deployed site.

### Decisions taken by the project owner

1. The assistant is **Thuso**.
2. The exchange is **Receiving exchange**, always with the Sample data tag.
3. Pilot pricing on the landing page, labelled "Pilot pricing, to be
   validated": businesses R450 per active agent a month; exchanges R1.50
   per verified agent deposit, integration free during the pilot.
4. The sample mandate expiry moves to 31 December 2027. This changes the
   mandate fingerprint once; the next story registers the agent again.
5. The business side shows ledger settlement only, not the exchange's
   checks.
6. Only FIC Directive 9 is cited in product copy (in force 30 April 2025,
   applies from R0).
7. Revocation copy always says "from the next ledger, within seconds",
   never a fixed number of seconds.

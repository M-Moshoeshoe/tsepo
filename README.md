# Tšepo

Identity and authority for AI agents that pay, recorded on the XRP Ledger.

Built for the Node Engine Hackathon 2026, Agentic Finance track.

## The problem

AI agents can now hold a wallet and send money. The party that receives
the money cannot tell who the agent works for, what it is allowed to pay,
or whether that permission still stands. A business that gives an agent a
key gives it full control of the account, with no limit and no way to
withdraw the authority short of moving the funds. Exchanges and other
receivers either accept every agent payment or refuse them all.

## How it works

1. **Register.** A business registers its agent in the business console
   with a mandate: who the agent works for, the approved recipients, a
   limit per payment, a daily limit, and an expiry date.
2. **Record.** The Tšepo issuer records the mandate on the XRP Ledger as
   an `AGENT_MANDATE` credential held by the agent account. The credential
   carries only a fingerprint of the mandate. Personal data never goes on
   the ledger.
3. **Pay.** The agent pays in RLUSD on its own. Its account requires two
   signatures: the agent key and the key of an independent policy service.
   The policy service checks each payment against the mandate and signs
   only when the payment is within it.
4. **Receive.** An exchange runs an agent lane deposit account. Through
   credential-based Deposit Authorization, the ledger itself rejects any
   payment to that account from a sender without a valid
   `AGENT_MANDATE` credential.
5. **Revoke.** The business can revoke the agent at once. The issuer
   deletes the credential, and the agent lane rejects the next payment.
6. **Review.** A compliance desk reads the credential, the mandate
   fingerprint and the tagged payment history to see which agent paid,
   for whom, and under which mandate.

Every agent payment carries a `SourceTag` (default `20260530`) so that
agent activity can be told apart from human activity on the ledger.

## Architecture

```mermaid
flowchart LR
    Business["Business console<br/>registers and revokes agents"]
    Agent["AI agent<br/>proposes and signs payments"]
    Policy["Policy service<br/>co-signs within the mandate"]
    Credential[("XRP Ledger credential<br/>AGENT_MANDATE")]
    Lane["Exchange agent lane<br/>Deposit Authorization"]
    Compliance["Compliance desk<br/>reviews agents and payments"]

    Business -- "mandate" --> Policy
    Business -- "issue or revoke" --> Credential
    Agent -- "payment request" --> Policy
    Policy -- "second signature" --> Agent
    Credential -. "held by" .-> Agent
    Agent -- "RLUSD payment with CredentialIDs" --> Lane
    Lane -- "accepts only valid credentials" --> Credential
    Compliance -- "reads" --> Credential
    Compliance -- "reads payments" --> Lane
```

## Status

Phase 0: project setup. No application code yet.

## Development

Requirements: Node 24 and npm.

```sh
npm install
npm run typecheck
npm test
```

Copy `.env.example` to `.env.local` and fill in the values there.
`.env.local` is gitignored and is the only place seeds are kept. This
project runs on the XRP Ledger Testnet only.

See [AGENTS.md](AGENTS.md) for the rules every contributor follows.

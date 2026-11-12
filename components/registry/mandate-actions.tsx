'use client';

import { useState, type SyntheticEvent } from 'react';
import { RunRequestSchema } from '../../src/demo/events.ts';
import { useRun } from '../run-provider.tsx';
import { Button } from '../ui/button.tsx';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '../ui/dialog.tsx';
import { Input, Label } from '../ui/input.tsx';

interface MandateActionsProps {
  perPaymentLimit: string;
  dailyLimit: string;
  /** Actions need an active agent: a revoked agent is registered again only by a reset. */
  agentActive: boolean;
}

function ChangeLimitsDialog({ perPaymentLimit, dailyLimit, disabled }: { perPaymentLimit: string; dailyLimit: string; disabled: boolean }) {
  const { start } = useRun();
  const [open, setOpen] = useState(false);
  const [perPayment, setPerPayment] = useState(perPaymentLimit);
  const [daily, setDaily] = useState(dailyLimit);
  const [error, setError] = useState<string | undefined>(undefined);

  function submit(event: SyntheticEvent<HTMLFormElement>): void {
    event.preventDefault();
    const request = RunRequestSchema.safeParse({ kind: 'change-limits', perPaymentLimit: perPayment.trim(), dailyLimit: daily.trim() });
    if (!request.success) {
      setError('Enter amounts above zero with at most six decimal places. The per-payment limit cannot be more than the daily limit.');
      return;
    }
    setError(undefined);
    setOpen(false);
    start(request.data, 'Change limits');
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setPerPayment(perPaymentLimit);
          setDaily(dailyLimit);
          setError(undefined);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary" disabled={disabled}>
          Change limits
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Change the agent limits</DialogTitle>
        <DialogDescription>
          The business key signs the new limits. The registry then issues a new credential that proves the new mandate. The
          policy service refuses payments until the new credential is accepted, in about 10 seconds.
        </DialogDescription>
        <form onSubmit={submit} className="grid gap-4" noValidate>
          <div className="grid gap-1.5">
            <Label htmlFor="per-payment">Per-payment limit (RLUSD)</Label>
            <Input
              id="per-payment"
              inputMode="decimal"
              value={perPayment}
              onChange={(event) => { setPerPayment(event.target.value); }}
              aria-invalid={error !== undefined}
              aria-describedby={error === undefined ? undefined : 'limits-error'}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="daily">Daily limit (RLUSD)</Label>
            <Input
              id="daily"
              inputMode="decimal"
              value={daily}
              onChange={(event) => { setDaily(event.target.value); }}
              aria-invalid={error !== undefined}
              aria-describedby={error === undefined ? undefined : 'limits-error'}
            />
          </div>
          {error !== undefined && (
            <p id="limits-error" role="alert" className="rounded-md bg-refused-bg px-3 py-2 text-sm text-refused">
              {error}
            </p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Sign and apply limits</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RevokeDialog({ disabled }: { disabled: boolean }) {
  const { start } = useRun();
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="danger-outline" disabled={disabled}>
          Revoke agent
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Revoke this agent?</DialogTitle>
        <DialogDescription>
          The business key deletes the agent credential from the ledger. From the next ledger, in about 4 seconds, the agent
          lane rejects the agent and the policy service refuses every payment it asks to co-sign. Only a reset registers the
          agent again.
        </DialogDescription>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button
            variant="danger"
            onClick={() => {
              setOpen(false);
              start({ kind: 'revoke' }, 'Revoke agent');
            }}
          >
            Revoke agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MandateActions({ perPaymentLimit, dailyLimit, agentActive }: MandateActionsProps) {
  const { state } = useRun();
  const disabled = !agentActive || state.status === 'running';
  return (
    <div className="flex flex-wrap gap-2">
      <ChangeLimitsDialog perPaymentLimit={perPaymentLimit} dailyLimit={dailyLimit} disabled={disabled} />
      <RevokeDialog disabled={disabled} />
    </div>
  );
}

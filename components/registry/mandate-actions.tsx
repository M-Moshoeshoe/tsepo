'use client';

import { useState, type ReactNode, type SyntheticEvent } from 'react';
import { Dialog, Modal, ModalOverlay } from '@/components/application/modals/modal';
import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { RunRequestSchema } from '../../src/demo/events.ts';
import { useDemoActions } from '../shell/demo-actions.tsx';

function ActionDialog({
  isOpen,
  onOpenChange,
  title,
  children,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable>
      <Modal className="max-w-md">
        <Dialog aria-label={title}>
          <div className="grid w-full gap-5 p-6">{children}</div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

function DialogText({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid gap-1">
      <h2 className="text-lg font-semibold text-primary">{title}</h2>
      <p className="text-sm text-tertiary">{children}</p>
    </div>
  );
}

function ChangeLimitsForm({
  perPaymentLimit,
  dailyLimit,
  onDone,
}: {
  perPaymentLimit: string;
  dailyLimit: string;
  onDone: () => void;
}) {
  const { run } = useDemoActions();
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
    onDone();
    run(request.data, 'Change limits');
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <DialogText title="Change the agent limits">
        The business key signs the new limits. The registry then issues a new credential that proves the new mandate. The policy
        service refuses payments until the new credential is accepted, in about 10 seconds.
      </DialogText>
      <Input label="Per-payment limit (RLUSD)" inputMode="decimal" autoFocus value={perPayment} onChange={setPerPayment} isInvalid={error !== undefined} />
      <Input label="Daily limit (RLUSD)" inputMode="decimal" value={daily} onChange={setDaily} isInvalid={error !== undefined} />
      {error !== undefined && (
        <p role="alert" className="rounded-lg bg-error-primary px-3 py-2 text-sm text-error-primary">
          {error}
        </p>
      )}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button color="secondary" size="md" onClick={onDone}>
          Cancel
        </Button>
        <Button color="primary" size="md" type="submit">
          Sign and apply limits
        </Button>
      </div>
    </form>
  );
}

/** Change limits and Revoke, in the agent page header. Both need an active agent: only a reset registers a revoked agent again. */
export function MandateActions({
  perPaymentLimit,
  dailyLimit,
  agentActive,
}: {
  perPaymentLimit: string | undefined;
  dailyLimit: string | undefined;
  agentActive: boolean;
}) {
  const { busy, locked, run, unlock } = useDemoActions();
  const [dialog, setDialog] = useState<'limits' | 'revoke' | undefined>(undefined);
  const disabled = !agentActive || busy || perPaymentLimit === undefined || dailyLimit === undefined;
  const open = (which: 'limits' | 'revoke') => () => {
    if (locked) unlock();
    else setDialog(which);
  };
  const close = (): void => {
    setDialog(undefined);
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button color="secondary" size="md" isDisabled={disabled} onClick={open('limits')}>
        Change limits
      </Button>
      <Button color="primary-destructive" size="md" isDisabled={disabled} onClick={open('revoke')}>
        Revoke
      </Button>

      <ActionDialog
        isOpen={dialog === 'limits'}
        onOpenChange={(next) => {
          if (!next) close();
        }}
        title="Change the agent limits"
      >
        {perPaymentLimit !== undefined && dailyLimit !== undefined && (
          <ChangeLimitsForm perPaymentLimit={perPaymentLimit} dailyLimit={dailyLimit} onDone={close} />
        )}
      </ActionDialog>

      <ActionDialog
        isOpen={dialog === 'revoke'}
        onOpenChange={(next) => {
          if (!next) close();
        }}
        title="Revoke this agent?"
      >
        <DialogText title="Revoke this agent?">
          The business key deletes the agent credential from the ledger. From the next ledger, in about 4 seconds, the agent lane
          rejects the agent and the policy service refuses every payment it asks to co-sign. Only a reset registers the agent
          again.
        </DialogText>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button color="secondary" size="md" onClick={close}>
            Cancel
          </Button>
          <Button
            color="primary-destructive"
            size="md"
            onClick={() => {
              close();
              run({ kind: 'revoke' }, 'Revoke agent');
            }}
          >
            Revoke agent
          </Button>
        </div>
      </ActionDialog>
    </div>
  );
}

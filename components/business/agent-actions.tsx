'use client';

import { useState, type ReactNode, type SyntheticEvent } from 'react';
import { Dialog, Modal, ModalOverlay } from '@/components/application/modals/modal';
import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { RunRequestSchema } from '../../src/demo/events.ts';
import { MoreMenu } from '../more-menu.tsx';
import { useLiveActions } from '../shell/live-actions.tsx';

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
  const { run } = useLiveActions();
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
        The business key signs the new limits; the agent has no way to change them. Tšepo then issues a new credential that
        proves the new spending rules. The approval service refuses payments until the new credential is accepted, within
        seconds.
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


/** Opens a dialog, or asks for the access code first when none is saved. */
function useActionDialog(): { isOpen: boolean; open: () => void; close: () => void; busy: boolean } {
  const { busy, locked, unlock } = useLiveActions();
  const [isOpen, setOpen] = useState(false);
  return {
    isOpen,
    busy,
    open: () => {
      if (locked) unlock();
      else setOpen(true);
    },
    close: () => {
      setOpen(false);
    },
  };
}

/** Change limits, signed with the business key. Needs an active agent with spending rules. */
export function ChangeLimitsButton({
  perPaymentLimit,
  dailyLimit,
  agentActive,
}: {
  perPaymentLimit: string | undefined;
  dailyLimit: string | undefined;
  agentActive: boolean;
}) {
  const dialog = useActionDialog();
  return (
    <>
      <Button
        color="secondary"
        size="md"
        isDisabled={!agentActive || dialog.busy || perPaymentLimit === undefined || dailyLimit === undefined}
        onClick={dialog.open}
      >
        Change limits
      </Button>
      <ActionDialog
        isOpen={dialog.isOpen}
        onOpenChange={(next) => {
          if (!next) dialog.close();
        }}
        title="Change the agent limits"
      >
        {perPaymentLimit !== undefined && dailyLimit !== undefined && (
          <ChangeLimitsForm perPaymentLimit={perPaymentLimit} dailyLimit={dailyLimit} onDone={dialog.close} />
        )}
      </ActionDialog>
    </>
  );
}

/** Revoke the agent: the business key deletes its credential. Needs an active agent. */
export function RevokeButton({ agentActive }: { agentActive: boolean }) {
  const dialog = useActionDialog();
  const { run } = useLiveActions();
  return (
    <>
      <Button color="primary-destructive" size="md" isDisabled={!agentActive || dialog.busy} onClick={dialog.open}>
        Revoke
      </Button>
      <ActionDialog
        isOpen={dialog.isOpen}
        onOpenChange={(next) => {
          if (!next) dialog.close();
        }}
        title="Revoke this agent?"
      >
        <DialogText title="Revoke this agent?">
          The business key deletes the agent credential from the ledger. From the next ledger, within seconds, the agent deposit
          address rejects the agent and the approval service refuses every payment it asks to approve. You can register it again
          afterwards.
        </DialogText>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button color="secondary" size="md" onClick={dialog.close}>
            Cancel
          </Button>
          <Button
            color="primary-destructive"
            size="md"
            onClick={() => {
              dialog.close();
              run({ kind: 'revoke' }, 'Revoke agent');
            }}
          >
            Revoke agent
          </Button>
        </div>
      </ActionDialog>
    </>
  );
}

/** The confirmation for registering a revoked agent again, which restores the sample workspace. */
function RegisterAgainDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { run } = useLiveActions();
  return (
    <ActionDialog
      isOpen={isOpen}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Register the agent again?"
    >
      <DialogText title="Register the agent again?">
        This restores the sample workspace: the business signs the sample spending rules, Tšepo issues a new credential, and the
        agent gets its RLUSD back. Everyone sees the same sample workspace, so this changes it for all visitors.
      </DialogText>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button color="secondary" size="md" onClick={onClose}>
          Cancel
        </Button>
        <Button
          color="primary"
          size="md"
          onClick={() => {
            onClose();
            run({ kind: 'reset' }, 'Register the agent again');
          }}
        >
          Register again
        </Button>
      </div>
    </ActionDialog>
  );
}

/**
 * The agent's secondary actions behind "More". Register again is the way back
 * after a revocation, so it is enabled only for an agent that is not active.
 */
export function AgentMoreMenu({ agentActive }: { agentActive: boolean }) {
  const dialog = useActionDialog();
  return (
    <>
      <MoreMenu
        label="More agent actions"
        items={[{ id: 'register', label: 'Register the agent again', onAction: dialog.open, disabled: agentActive || dialog.busy }]}
      />
      <RegisterAgainDialog isOpen={dialog.isOpen} onClose={dialog.close} />
    </>
  );
}

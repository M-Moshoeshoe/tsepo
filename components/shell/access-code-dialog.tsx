'use client';

import { useState, type SyntheticEvent } from 'react';
import { z } from 'zod';
import { Dialog, Modal, ModalOverlay } from '@/components/application/modals/modal';
import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { ACCESS_CODE_HEADER } from '../../src/demo/events.ts';

const ErrorBodySchema = z.object({ error: z.string() });

/** Why live steps need the code, said the same way wherever the code is asked for. */
export const ACCESS_CODE_REASON =
  'Live steps move test funds on the XRP Ledger Testnet, so they need the access code from the submission. It is kept for this browser session only.';

/** Asks the server whether the code is right. Nothing runs; a wrong code counts against the wrong-code limit. */
async function checkCode(code: string): Promise<string | undefined> {
  try {
    const response = await fetch('/api/access', { method: 'POST', headers: { [ACCESS_CODE_HEADER]: code } });
    if (response.ok) return undefined;
    const body = ErrorBodySchema.safeParse(await response.json().catch(() => undefined));
    return body.success ? body.data.error : 'That access code was not accepted. Check it and try again.';
  } catch {
    return 'The server could not be reached, so the code was not checked. Try again.';
  }
}

/**
 * The access code form. It checks the code with the server before saving it,
 * so "unlocked" only ever follows a code the server accepts. The code lives in
 * session storage, never in the page address or a cookie.
 */
export function AccessCodeForm({ onSave, onCancel, autoFocus = false }: { onSave: (code: string) => void; onCancel?: () => void; autoFocus?: boolean }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [checking, setChecking] = useState(false);

  async function submit(event: SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmed = code.trim();
    if (trimmed.length < 6) {
      setError('Enter the access code. It has at least 6 characters.');
      return;
    }
    setChecking(true);
    const refused = await checkCode(trimmed);
    setChecking(false);
    if (refused !== undefined) {
      setError(refused);
      return;
    }
    setError(undefined);
    setCode('');
    onSave(trimmed);
  }

  return (
    <form
      onSubmit={(event) => {
        void submit(event);
      }}
      className="grid w-full gap-4"
      noValidate
    >
      <Input
        label="Access code"
        type="password"
        autoComplete="off"
        autoFocus={autoFocus}
        value={code}
        onChange={setCode}
        isInvalid={error !== undefined}
        hint={error}
      />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel !== undefined && (
          <Button color="secondary" size="md" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button color="primary" size="md" type="submit" isLoading={checking} showTextWhileLoading>
          Unlock live steps
        </Button>
      </div>
    </form>
  );
}

/** The access code in a dialog, for live actions started outside the guided tour, such as Revoke. */
export function AccessCodeDialog({
  isOpen,
  onOpenChange,
  onSave,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (code: string) => void;
}) {
  const close = (): void => {
    onOpenChange(false);
  };
  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable>
      <Modal className="max-w-md">
        <Dialog aria-label="Enter the access code">
          <div className="grid w-full gap-5 p-6">
            <div className="grid gap-1">
              <h2 className="text-lg font-semibold text-primary">Enter the access code</h2>
              <p className="text-sm text-tertiary">{ACCESS_CODE_REASON}</p>
            </div>
            <AccessCodeForm
              autoFocus
              onCancel={close}
              onSave={(code) => {
                onSave(code);
                close();
              }}
            />
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

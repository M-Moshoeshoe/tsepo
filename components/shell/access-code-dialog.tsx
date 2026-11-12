'use client';

import { useState, type SyntheticEvent } from 'react';
import { Dialog, Modal, ModalOverlay } from '@/components/application/modals/modal';
import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';

/**
 * Asks once for the demo access code. The code is kept in session storage for
 * this browser session only, never in the page address or a cookie.
 */
export function AccessCodeDialog({
  isOpen,
  onOpenChange,
  onSave,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (code: string) => void;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);

  function submit(event: SyntheticEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmed = code.trim();
    if (trimmed.length < 6) {
      setError('Enter the demo access code. It has at least 6 characters.');
      return;
    }
    setError(undefined);
    setCode('');
    onSave(trimmed);
    onOpenChange(false);
  }

  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable>
      <Modal className="max-w-md">
        <Dialog aria-label="Enter the demo access code">
          <form onSubmit={submit} className="grid w-full gap-5 p-6" noValidate>
            <div className="grid gap-1">
              <h2 className="text-lg font-semibold text-primary">Enter the demo access code</h2>
              <p className="text-sm text-tertiary">
                Runs move test funds on the XRP Ledger Testnet, so they need the code. It is kept for this browser session only.
              </p>
            </div>
            <Input
              label="Demo access code"
              type="password"
              autoComplete="off"
              autoFocus
              value={code}
              onChange={setCode}
              isInvalid={error !== undefined}
              hint={error}
            />
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                color="secondary"
                size="md"
                onClick={() => {
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button color="primary" size="md" type="submit">
                Unlock the demo
              </Button>
            </div>
          </form>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

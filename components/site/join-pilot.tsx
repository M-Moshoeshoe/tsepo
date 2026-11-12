'use client';

import { useState, type SyntheticEvent } from 'react';
import { z } from 'zod';
import { Dialog, Modal, ModalOverlay } from '@/components/application/modals/modal';
import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { RadioButton, RadioGroup } from '@/components/base/radio-buttons/radio-buttons';
import { PilotRequestSchema } from '../../src/pilot/pilot.ts';

const ErrorSchema = z.object({ error: z.string() });

type Kind = 'business' | 'exchange';

/** "Join the pilot": a short form in a dialog. It stores the details for follow-up; nothing is signed up or charged. */
export function JoinPilot() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [kind, setKind] = useState<Kind>('business');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const request = PilotRequestSchema.safeParse({ name, organisation, kind, email });
    if (!request.success) {
      setError(request.error.issues[0]?.message ?? 'Check the form and try again.');
      return;
    }
    setSending(true);
    try {
      const response = await fetch('/api/pilot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request.data) });
      if (response.ok) {
        setError(undefined);
        setDone(true);
      } else {
        const body = ErrorSchema.safeParse(await response.json().catch(() => undefined));
        setError(body.success ? body.data.error : 'Your details could not be saved. Try again in a minute.');
      }
    } catch {
      setError('The server could not be reached. Try again in a minute.');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Button color="secondary" size="xl" onClick={() => { setOpen(true); }}>
        Join the pilot
      </Button>
      <ModalOverlay isOpen={open} onOpenChange={setOpen} isDismissable>
        <Modal className="max-w-md">
          <Dialog aria-label="Join the pilot">
            <div className="grid w-full gap-5 p-6">
              <div className="grid gap-1">
                <h2 className="text-lg font-semibold text-primary">Join the pilot</h2>
                <p className="text-sm text-tertiary">
                  For South African businesses that pay through AI agents, and for exchanges that receive their payments. We will contact
                  you about the pilot. Nothing is signed up or charged.
                </p>
              </div>
              {done ? (
                <div className="grid gap-4" role="status">
                  <p className="text-md text-primary">Thank you. We have your details and will contact you about the pilot.</p>
                  <Button color="primary" size="md" onClick={() => { setOpen(false); }} className="justify-self-end">
                    Close
                  </Button>
                </div>
              ) : (
                <form onSubmit={(event) => void submit(event)} className="grid gap-4" noValidate>
                  <Input label="Your name" autoComplete="name" value={name} onChange={setName} isRequired />
                  <Input label="Organisation" autoComplete="organization" value={organisation} onChange={setOrganisation} isRequired />
                  <RadioGroup aria-label="Which describes you?" value={kind} onChange={(value) => { setKind(value === 'exchange' ? 'exchange' : 'business'); }}>
                    <RadioButton value="business" label="A business that pays through an agent" />
                    <RadioButton value="exchange" label="An exchange that receives agent payments" />
                  </RadioGroup>
                  <Input label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} isRequired />
                  {error !== undefined && (
                    <p role="alert" className="text-sm text-error-primary">
                      {error}
                    </p>
                  )}
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button color="secondary" size="md" onClick={() => { setOpen(false); }}>
                      Cancel
                    </Button>
                    <Button color="primary" size="md" type="submit" isLoading={sending} showTextWhileLoading>
                      Send
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </>
  );
}

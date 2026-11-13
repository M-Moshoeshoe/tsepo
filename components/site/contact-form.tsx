'use client';

import { useState, type SyntheticEvent } from 'react';
import { z } from 'zod';
import { Input } from '@/components/base/input/input';
import { ContactMessageSchema } from '../../src/pilot/contact.ts';
import { PrivacyNotice, SAVED_MESSAGE } from './privacy-notice.tsx';
import { SiteButton } from './site-button.tsx';

const ErrorSchema = z.object({ error: z.string() });

/** The Contact form: checked in the browser and again on the server, and stored for a reply. */
export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const request = ContactMessageSchema.safeParse({ name, email, message });
    if (!request.success) {
      setError(request.error.issues[0]?.message ?? 'Check the form and try again.');
      return;
    }
    setSending(true);
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request.data) });
      if (response.ok) {
        setError(undefined);
        setDone(true);
      } else {
        const body = ErrorSchema.safeParse(await response.json().catch(() => undefined));
        setError(body.success ? body.data.error : 'Your message could not be saved. Try again in a minute.');
      }
    } catch {
      setError('The server could not be reached. Try again in a minute.');
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <p role="status" className="rounded-2xl bg-secondary p-6 text-md text-primary">
        {SAVED_MESSAGE}
      </p>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        void submit(event);
      }}
      className="grid gap-5 rounded-2xl bg-secondary p-6 md:p-8"
      noValidate
    >
      <Input label="Your name" autoComplete="name" value={name} onChange={setName} isRequired />
      <Input label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} isRequired />
      <div className="grid gap-1.5">
        <label htmlFor="contact-message" className="text-sm font-medium text-secondary">
          Message
        </label>
        <textarea
          id="contact-message"
          value={message}
          rows={5}
          maxLength={1000}
          onChange={(event) => {
            setMessage(event.target.value);
          }}
          className="w-full resize-y rounded-lg bg-primary px-3.5 py-3 text-md text-primary shadow-xs ring-1 ring-primary outline-hidden ring-inset focus:ring-2 focus:ring-brand"
        />
      </div>
      {error !== undefined && (
        <p role="alert" className="text-sm text-error-primary">
          {error}
        </p>
      )}
      <PrivacyNotice asksForOrganisation={false} />
      <SiteButton type="submit" variant="primary" size="lg" arrow={false} busy={sending} className="justify-self-start">
        {sending ? 'Sending…' : 'Send the message'}
      </SiteButton>
    </form>
  );
}

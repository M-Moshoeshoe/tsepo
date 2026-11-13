/** What a visitor sees once a form is saved. Nothing is sent by email automatically, so it promises only that we will be in touch. */
export const SAVED_MESSAGE = 'Thank you. Your details are saved, and we will be in touch.';

/** The POPIA notice for a form. It names only the fields that form asks for. */
export function privacyNotice(asksForOrganisation: boolean): string {
  const fields = asksForOrganisation ? 'name, organisation and email' : 'name and email';
  return `We use your ${fields} only to reply to you about Tšepo. We store them securely, never share them, and delete them on request.`;
}

/** The POPIA notice shown on every form that collects personal information. */
export function PrivacyNotice({ asksForOrganisation }: { asksForOrganisation: boolean }) {
  return <p className="text-sm text-tertiary">{privacyNotice(asksForOrganisation)}</p>;
}

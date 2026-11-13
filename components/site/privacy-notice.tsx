/** What a visitor sees once a form is saved. Nothing is sent by email automatically, so it promises only that we will be in touch. */
export const SAVED_MESSAGE = 'Thank you. Your details are saved, and we will be in touch.';

/** The POPIA notice shown on every form that collects personal information. */
export const PRIVACY_NOTICE = 'We use your name, organisation and email only to reply to you about Tšepo. We store them securely, never share them, and delete them on request.';

export function PrivacyNotice() {
  return <p className="text-sm text-tertiary">{PRIVACY_NOTICE}</p>;
}

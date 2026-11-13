import { ASSISTANT_NAME } from '../src/views/assistant.ts';
import { ThusoAvatar } from './thuso-avatar.tsx';

/**
 * Something Thuso, the agent's AI reading step, says about what it read or
 * what happened. The avatar never sits beside a decision: rules decide.
 */
export function AssistantNote({ children }: { children: string }) {
  return (
    <p className="flex items-start gap-2.5 rounded-lg bg-secondary px-3 py-2.5 text-sm text-secondary">
      <ThusoAvatar className="mt-px" />
      <span>
        <span className="font-semibold text-primary">{ASSISTANT_NAME}</span>
        <span className="sr-only">, the agent&apos;s AI assistant, says:</span> {children}
      </span>
    </p>
  );
}

/** Who decided, in plain words. Deliberately without the AI mark: rules decide, never the model. */
export function DecisionBox({ decidedBy, children }: { decidedBy: string; children: string }) {
  return (
    <div data-tour-target="decision" className="grid gap-1 rounded-lg px-3 py-2.5 text-sm ring-1 ring-secondary ring-inset">
      <p className="text-primary">{children}</p>
      <p className="text-tertiary">Decided by {decidedBy}</p>
    </div>
  );
}

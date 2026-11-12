import type { AgentStatus } from '../../app/_data/registry.ts';
import { StatusBadge } from '../display.tsx';

const STATUS: Record<AgentStatus['state'], { tone: 'cleared' | 'held' | 'refused' | 'neutral'; text: string }> = {
  active: { tone: 'cleared', text: 'Active' },
  revoked: { tone: 'refused', text: 'Revoked' },
  mismatch: { tone: 'held', text: 'Credential does not match the spending rules' },
  'not-registered': { tone: 'neutral', text: 'Not registered' },
};

/** The agent's status chip, the same on every page. */
export function AgentStatusBadge({ status, size = 'sm' }: { status: AgentStatus; size?: 'sm' | 'md' }) {
  const { tone, text } = STATUS[status.state];
  return (
    <StatusBadge tone={tone} size={size}>
      {text}
    </StatusBadge>
  );
}

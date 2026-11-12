import { describe, expect, it } from 'vitest';
import { AdminReason, AgentReason } from '../domain/reasons.ts';
import { reasonText } from './status.ts';

describe('reason text', () => {
  it('explains admin rejections in plain words', () => {
    expect(reasonText(AdminReason.MalformedAction)).toBe('the change was not well formed');
    expect(reasonText(AdminReason.BadSignature)).toBe('the business signature did not verify');
  });

  it('explains why the agent itself stopped', () => {
    expect(reasonText(AgentReason.AlreadyPaid)).toBe('it was already paid');
  });

  it('names a ledger result code instead of showing raw text', () => {
    expect(reasonText('tecPATH_PARTIAL')).toBe('the XRP Ledger returned tecPATH_PARTIAL');
  });

  it('never shows the details of an error, which belong in the server log', () => {
    const text = reasonText(`${AgentReason.Error}: 401 {"type":"error","request_id":"req_011"}`);
    expect(text).toBe('an error stopped it; the details are in the server log');
    expect(text).not.toContain('req_');
  });
});

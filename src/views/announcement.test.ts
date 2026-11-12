import { describe, expect, it } from 'vitest';
import { runEndAnnouncement } from './announcement.ts';

describe('run end announcement', () => {
  it('says nothing while a run is going, because the steps stream into their own list', () => {
    expect(runEndAnnouncement('Reset demo', 'running')).toBe('');
  });

  it('says finished or stopped, with the plain reason', () => {
    expect(runEndAnnouncement('Reset demo', 'done')).toBe('Reset demo finished.');
    expect(runEndAnnouncement('Scenario 3: Split payments', 'failed', 'The XRP Ledger Testnet could not be reached.')).toBe(
      'Scenario 3: Split payments stopped. The XRP Ledger Testnet could not be reached.',
    );
    expect(runEndAnnouncement('Revoke agent', 'failed')).toBe('Revoke agent stopped.');
  });
});

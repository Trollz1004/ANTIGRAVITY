import { describe, expect, it } from 'vitest';
import { redactSupportText, deriveServiceTransitions } from './control-center.js';

describe('control-center safety', () => {
  it('redacts email, phone, and credential-looking text from local support metadata', () => {
    const value = redactSupportText('Contact lina@example.com at 555-123-4567. token=super-secret-value');
    expect(value).not.toContain('lina@example.com');
    expect(value).not.toContain('555-123-4567');
    expect(value).not.toContain('super-secret-value');
    expect(value).toContain('[redacted email]');
  });

  it('emits an outage alert only after an observed health state changes', () => {
    const first = deriveServiceTransitions({}, [{ name: 'Hermes', status: 'UP', detail: 'identity verified' }], '2026-08-20T00:00:00.000Z');
    expect(first.alerts).toEqual([]);

    const second = deriveServiceTransitions(first.next, [{ name: 'Hermes', status: 'DOWN', detail: 'connection refused' }], '2026-08-20T00:01:00.000Z');
    expect(second.alerts).toHaveLength(1);
    expect(second.alerts[0]).toMatchObject({ subject: 'Hermes', previousState: 'UP', state: 'DOWN', kind: 'service-down' });
  });

  it('emits a recovery alert after a failed service becomes identity-verified again', () => {
    const result = deriveServiceTransitions({ Hermes: 'DOWN' }, [{ name: 'Hermes', status: 'UP', detail: 'identity verified' }], '2026-08-20T00:02:00.000Z');
    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0]).toMatchObject({ subject: 'Hermes', previousState: 'DOWN', state: 'UP', kind: 'service-recovered' });
  });
});

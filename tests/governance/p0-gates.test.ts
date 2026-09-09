import { describe, expect, it } from 'vitest';
import { evaluateP0Gate, isAcceptedEvidenceComplete } from '../../scripts/workflow-gates.mjs';

function item(overrides = {}) {
  return {
    id: 'WI-001',
    status: 'ACCEPTED',
    priority: 'P0',
    review: { verdict: 'PASS', executionRef: 'verifier-1' },
    execution: { executionRef: 'worker-1' },
    evidence: ['docs/evidence/WI-001.md'],
    realTestRequirements: ['RT-01'],
    gates: { automatedTests: 'PASS', realTest: 'PASS', independentVerifier: 'PASS' },
    dependencies: [],
    ...overrides,
  };
}

describe('P0 acceptance gates', () => {
  it('requires implementation evidence, automated tests, real tests, and an independent verifier', () => {
    expect(isAcceptedEvidenceComplete(item())).toBe(true);
    expect(isAcceptedEvidenceComplete(item({ gates: { automatedTests: 'PASS', realTest: 'READY', independentVerifier: 'PASS' } }))).toBe(false);
    expect(isAcceptedEvidenceComplete(item({ review: { verdict: 'PASS', executionRef: 'worker-1' } }))).toBe(false);
  });

  it('keeps the parent gate open while any P0 descendant is incomplete', () => {
    expect(evaluateP0Gate([item(), item({ id: 'WI-002', status: 'TODO' })])).toMatchObject({ status: 'IN_PROGRESS', remaining: ['WI-002'] });
    expect(evaluateP0Gate([item(), item({ id: 'WI-002', status: 'VERIFIED', gates: undefined })])).toMatchObject({ status: 'IN_PROGRESS' });
  });
});

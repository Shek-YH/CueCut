const completedStatuses = new Set(['VERIFIED', 'ACCEPTED']);

export function isAcceptedEvidenceComplete(item) {
  return Boolean(
    item.status === 'ACCEPTED'
      && item.evidence?.length
      && item.review?.verdict === 'PASS'
      && item.execution?.executionRef
      && item.review?.executionRef
      && item.review.executionRef !== item.execution.executionRef
      && item.gates?.automatedTests === 'PASS'
      && item.gates?.realTest === 'PASS'
      && item.gates?.independentVerifier === 'PASS',
  );
}

export function evaluateP0Gate(items) {
  const p0Items = items.filter((item) => item.priority === 'P0');
  const remaining = p0Items.filter((item) => !completedStatuses.has(item.status) || item.status === 'VERIFIED').map((item) => item.id);
  const invalidAccepted = p0Items.filter((item) => item.status === 'ACCEPTED' && !isAcceptedEvidenceComplete(item)).map((item) => item.id);
  return {
    status: remaining.length || invalidAccepted.length ? 'IN_PROGRESS' : 'PASS',
    remaining,
    invalidAccepted,
  };
}

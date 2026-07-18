export function approvalPollDelay(elapsedMilliseconds) {
  if (elapsedMilliseconds < 60_000) return 5_000;
  if (elapsedMilliseconds < 300_000) return 15_000;
  return 30_000;
}

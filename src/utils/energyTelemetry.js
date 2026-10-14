// Freshness refers to the stored reading, never the time a poll happened.
export function readingStatus(updatedAt, now = Date.now()) {
  const timestamp = updatedAt ? Date.parse(updatedAt) : NaN;
  if (!Number.isFinite(timestamp)) return 'offline';
  return now - timestamp > 60_000 ? 'stale' : 'live';
}

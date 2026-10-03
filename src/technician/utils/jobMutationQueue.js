// Keep writes to one job in order, while allowing unrelated jobs to save independently.
export function createJobMutationQueue(onPendingChange = () => {}) {
  const tails = new Map();
  return {
    enqueue(jobId, task) {
      const previous = tails.get(jobId) ?? Promise.resolve();
      const result = previous.catch(() => {}).then(task);
      tails.set(jobId, result);
      onPendingChange(jobId, 1);
      return result.finally(() => {
        onPendingChange(jobId, -1);
        if (tails.get(jobId) === result) tails.delete(jobId);
      });
    },
  };
}

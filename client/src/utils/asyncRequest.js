// Only the latest live request may publish a result. Cancel also protects
// unmounted screens and Strict Mode's effect cleanup/replay.
export function createAsyncRequestController({ onSuccess, onError }) {
  let generation = 0;
  return {
    async run(load) {
      const request = ++generation;
      let value;
      try { value = await load(); }
      catch (error) {
        if (request === generation) onError(error);
        return undefined;
      }
      if (request !== generation) return undefined;
      onSuccess(value);
      return value;
    },
    cancel() { generation++; },
  };
}

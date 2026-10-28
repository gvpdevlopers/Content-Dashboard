import { useCallback, useEffect, useMemo, useState } from "react";
import { createAsyncRequestController } from "../utils/asyncRequest";

export default function useAsyncResource(load, { initialData = null, errorMessage = "Unable to load data.", onSuccess, onError } = {}) {
  const [initial] = useState(() => initialData);
  const [state, setState] = useState(() => ({ source: load, data: initial, loading: true, refreshing: false, error: "" }));
  const controller = useMemo(() => createAsyncRequestController({
    onSuccess(data) {
      setState({ source: load, data, loading: false, refreshing: false, error: "" });
      onSuccess?.(data);
    },
    onError(error) {
      setState((current) => ({ source: load, data: current.source === load ? current.data : initial,
        loading: false, refreshing: false, error: error?.response?.data?.message || errorMessage }));
      onError?.(error);
    },
  }), [load, initial, errorMessage, onSuccess, onError]);

  useEffect(() => {
    controller.run(load);
    return () => controller.cancel();
  }, [controller, load]);

  const reload = useCallback((refresh = false) => {
    const refreshing = refresh === true;
    setState((current) => ({ source: load, data: current.source === load ? current.data : initial,
      loading: !refreshing, refreshing, error: "" }));
    return controller.run(load);
  }, [controller, load, initial]);
  const setData = useCallback((update) => {
    // A saved mutation is newer than any refresh already in flight.
    controller.cancel();
    setState((current) => ({ ...current, source: load, loading: false, refreshing: false, error: "",
      data: typeof update === "function" ? update(current.source === load ? current.data : initial) : update }));
  }, [controller, load, initial]);
  const setError = useCallback((error) => setState((current) => ({ ...current, error })), []);
  const sameSource = state.source === load;
  return { data: sameSource ? state.data : initial, setData, reload,
    loading: !sameSource || state.loading, refreshing: sameSource && state.refreshing,
    error: sameSource ? state.error : "", setError };
}

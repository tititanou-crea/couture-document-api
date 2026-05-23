import { useCallback, useState } from "react";

export function useAsyncState<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (task: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await task();
      setData(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, setData, loading, error, setError, run };
}

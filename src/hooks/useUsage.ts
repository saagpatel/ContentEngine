import { useEffect, useCallback, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { api } from '../lib/tauriApi';

export function useUsage() {
  const { usage, setUsage } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const info = await api.getUsageInfo();
      setUsage(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [setUsage]);

  useEffect(() => {
    refresh();
    // Auto-refresh every 30 seconds
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { usage, refresh, isLoading, error };
}

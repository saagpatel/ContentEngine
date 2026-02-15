import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUsage } from '../../hooks/useUsage';
import { api } from '../../lib/tauriApi';
import { mockTauriResponses } from '../mocks/tauriApi.mock';

vi.mock('../../lib/tauriApi');

describe('useUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadUsage', () => {
    it('loads usage info on mount', async () => {
      const mockUsage = mockTauriResponses.usageInfo({
        used: 30,
        limit: 50,
      });

      vi.mocked(api.getUsageInfo).mockResolvedValue(mockUsage);

      const { result } = renderHook(() => useUsage());

      await waitFor(() => {
        expect(result.current.usage).toBeDefined();
      });

      expect(result.current.usage?.used).toBe(30);
      expect(result.current.usage?.limit).toBe(50);
      expect(result.current.usage?.resets_at).toBe('2025-02-01T00:00:00Z');
    });

    it('handles usage at zero', async () => {
      const mockUsage = mockTauriResponses.usageInfo({
        used: 0,
        limit: 50,
      });

      vi.mocked(api.getUsageInfo).mockResolvedValue(mockUsage);

      const { result } = renderHook(() => useUsage());

      await waitFor(() => {
        expect(result.current.usage?.used).toBe(0);
      });

      expect(result.current.usage?.limit).toBe(50);
    });

    it('handles usage at limit', async () => {
      const mockUsage = mockTauriResponses.usageInfo({
        used: 50,
        limit: 50,
      });

      vi.mocked(api.getUsageInfo).mockResolvedValue(mockUsage);

      const { result } = renderHook(() => useUsage());

      await waitFor(() => {
        expect(result.current.usage?.used).toBe(50);
      });

      expect(result.current.usage?.limit).toBe(50);
    });

    it('handles usage exceeded', async () => {
      const mockUsage = mockTauriResponses.usageInfo({
        used: 55,
        limit: 50,
      });

      vi.mocked(api.getUsageInfo).mockResolvedValue(mockUsage);

      const { result } = renderHook(() => useUsage());

      await waitFor(() => {
        expect(result.current.usage).toBeDefined();
      });

      expect(result.current.usage?.used).toBe(55);
      expect((result.current.usage?.used ?? 0) > (result.current.usage?.limit ?? 0)).toBe(true);
    });

    it('handles API errors', async () => {
      vi.mocked(api.getUsageInfo).mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useUsage());

      await waitFor(() => {
        expect(result.current.error).toBe('Database error');
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('auto-refresh', () => {
    it.skip('refreshes usage every 30 seconds', async () => {
      vi.useFakeTimers();

      const initialUsage = mockTauriResponses.usageInfo({
        used: 10,
      });
      const updatedUsage = mockTauriResponses.usageInfo({
        used: 15,
      });

      vi.mocked(api.getUsageInfo)
        .mockResolvedValueOnce(initialUsage)
        .mockResolvedValueOnce(updatedUsage);

      const { result } = renderHook(() => useUsage());

      await vi.runOnlyPendingTimersAsync();

      await waitFor(() => {
        expect(result.current.usage?.used).toBe(10);
      });

      await vi.advanceTimersByTimeAsync(30000);

      await waitFor(() => {
        expect(result.current.usage?.used).toBe(15);
      });

      expect(api.getUsageInfo).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    }, 10000);

    it('cleans up interval on unmount', () => {
      vi.useFakeTimers();
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

      vi.mocked(api.getUsageInfo).mockResolvedValue(mockTauriResponses.usageInfo());

      const { unmount } = renderHook(() => useUsage());

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('reset date', () => {
    it('includes reset date in usage info', async () => {
      const resetDate = '2025-02-01T00:00:00Z';
      const mockUsage = mockTauriResponses.usageInfo({
        resets_at: resetDate,
      });

      vi.mocked(api.getUsageInfo).mockResolvedValue(mockUsage);

      const { result } = renderHook(() => useUsage());

      await waitFor(() => {
        expect(result.current.usage?.resets_at).toBe(resetDate);
      });
    });
  });

  describe('loading states', () => {
    it('sets isLoading during fetch', async () => {
      vi.mocked(api.getUsageInfo).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockTauriResponses.usageInfo()), 100)
          )
      );

      const { result } = renderHook(() => useUsage());

      expect(result.current.isLoading).toBe(true);

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 200 }
      );
    });

    it('sets isLoading false even on error', async () => {
      vi.mocked(api.getUsageInfo).mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useUsage());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('data integrity', () => {
    it('preserves all usage info fields', async () => {
      const mockUsage = mockTauriResponses.usageInfo({
        used: 42,
        limit: 50,
        resets_at: '2025-02-01T00:00:00Z',
      });

      vi.mocked(api.getUsageInfo).mockResolvedValue(mockUsage);

      const { result } = renderHook(() => useUsage());

      await waitFor(() => {
        expect(result.current.usage).toBeDefined();
      });

      expect(result.current.usage).toEqual({
        used: 42,
        limit: 50,
        resets_at: '2025-02-01T00:00:00Z',
      });
    });
  });
});

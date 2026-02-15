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
        formats_used_this_month: 30,
        monthly_limit: 50,
        percent_used: 60,
      });

      vi.mocked(api.getUsageInfo).mockResolvedValue(mockUsage);

      const { result } = renderHook(() => useUsage());

      await waitFor(() => {
        expect(result.current.usage).toBeDefined();
      });

      expect(result.current.usage?.formats_used_this_month).toBe(30);
      expect(result.current.usage?.monthly_limit).toBe(50);
      expect(result.current.usage?.percent_used).toBe(60);
    });

    it('handles usage at zero', async () => {
      const mockUsage = mockTauriResponses.usageInfo({
        formats_used_this_month: 0,
        monthly_limit: 50,
        percent_used: 0,
        is_exceeded: false,
      });

      vi.mocked(api.getUsageInfo).mockResolvedValue(mockUsage);

      const { result } = renderHook(() => useUsage());

      await waitFor(() => {
        expect(result.current.usage?.formats_used_this_month).toBe(0);
      });

      expect(result.current.usage?.percent_used).toBe(0);
      expect(result.current.usage?.is_exceeded).toBe(false);
    });

    it('handles usage at limit', async () => {
      const mockUsage = mockTauriResponses.usageInfo({
        formats_used_this_month: 50,
        monthly_limit: 50,
        percent_used: 100,
        is_exceeded: false,
      });

      vi.mocked(api.getUsageInfo).mockResolvedValue(mockUsage);

      const { result } = renderHook(() => useUsage());

      await waitFor(() => {
        expect(result.current.usage?.formats_used_this_month).toBe(50);
      });

      expect(result.current.usage?.percent_used).toBe(100);
    });

    it('handles usage exceeded', async () => {
      const mockUsage = mockTauriResponses.usageInfo({
        formats_used_this_month: 55,
        monthly_limit: 50,
        percent_used: 110,
        is_exceeded: true,
      });

      vi.mocked(api.getUsageInfo).mockResolvedValue(mockUsage);

      const { result } = renderHook(() => useUsage());

      await waitFor(() => {
        expect(result.current.usage?.is_exceeded).toBe(true);
      });

      expect(result.current.usage?.formats_used_this_month).toBe(55);
    });

    it('handles API errors', async () => {
      vi.mocked(api.getUsageInfo).mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useUsage());

      await waitFor(() => {
        expect(result.current.error).toBe('Database error');
      });

      // Usage might have previous value from store, error is the key indicator
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('auto-refresh', () => {
    it.skip('refreshes usage every 30 seconds', async () => {
      vi.useFakeTimers();

      const initialUsage = mockTauriResponses.usageInfo({
        formats_used_this_month: 10,
      });
      const updatedUsage = mockTauriResponses.usageInfo({
        formats_used_this_month: 15,
      });

      vi.mocked(api.getUsageInfo)
        .mockResolvedValueOnce(initialUsage)
        .mockResolvedValueOnce(updatedUsage);

      const { result } = renderHook(() => useUsage());

      // Run all pending timers (initial load)
      await vi.runOnlyPendingTimersAsync();

      await waitFor(() => {
        expect(result.current.usage?.formats_used_this_month).toBe(10);
      });

      // Fast-forward 30 seconds
      await vi.advanceTimersByTimeAsync(30000);

      await waitFor(() => {
        expect(result.current.usage?.formats_used_this_month).toBe(15);
      });

      expect(api.getUsageInfo).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    }, 10000);

    it('cleans up interval on unmount', () => {
      vi.useFakeTimers();
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

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
        formats_used_this_month: 42,
        monthly_limit: 50,
        percent_used: 84,
        resets_at: '2025-02-01T00:00:00Z',
        is_exceeded: false,
      });

      vi.mocked(api.getUsageInfo).mockResolvedValue(mockUsage);

      const { result } = renderHook(() => useUsage());

      await waitFor(() => {
        expect(result.current.usage).toBeDefined();
      });

      expect(result.current.usage).toEqual({
        formats_used_this_month: 42,
        monthly_limit: 50,
        percent_used: 84,
        resets_at: '2025-02-01T00:00:00Z',
        is_exceeded: false,
      });
    });
  });
});

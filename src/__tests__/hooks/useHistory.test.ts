import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHistory } from '../../hooks/useHistory';
import { api } from '../../lib/tauriApi';
import { mockTauriResponses } from '../mocks/tauriApi.mock';

vi.mock('../../lib/tauriApi');

describe('useHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial load', () => {
    it('loads history on mount', async () => {
      const mockHistory = mockTauriResponses.historyPage();
      vi.mocked(api.getHistory).mockResolvedValue(mockHistory);

      const { result } = renderHook(() => useHistory(10));

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.items).toHaveLength(2);
      expect(result.current.total).toBe(10);
      expect(api.getHistory).toHaveBeenCalledWith(1, 10);
    });

    it('handles empty history', async () => {
      vi.mocked(api.getHistory).mockResolvedValue(
        mockTauriResponses.historyPage({
          items: [],
          total: 0,
        })
      );

      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.total).toBe(0);
    });

    it('handles API errors', async () => {
      vi.mocked(api.getHistory).mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.error).toBe('Database error');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('pagination', () => {
    it('loads different pages', async () => {
      const page1 = mockTauriResponses.historyPage({
        items: [
          {
            id: 'content-1',
            title: 'Article 1',
            word_count: 500,
            format_count: 6,
            created_at: '2025-01-15T10:00:00Z',
          },
        ],
        page: 0,
      });

      const page2 = mockTauriResponses.historyPage({
        items: [
          {
            id: 'content-2',
            title: 'Article 2',
            word_count: 300,
            format_count: 3,
            created_at: '2025-01-14T10:00:00Z',
          },
        ],
        page: 1,
      });

      vi.mocked(api.getHistory).mockResolvedValueOnce(page1).mockResolvedValueOnce(page2);

      const { result } = renderHook(() => useHistory(10));

      await waitFor(() => {
        expect(result.current.items[0].id).toBe('content-1');
      });

      // Change page
      await act(async () => {
        result.current.setPage(2);
      });

      await waitFor(() => {
        expect(result.current.items[0].id).toBe('content-2');
      });

      expect(api.getHistory).toHaveBeenCalledTimes(2);
      expect(api.getHistory).toHaveBeenNthCalledWith(1, 1, 10);
      expect(api.getHistory).toHaveBeenNthCalledWith(2, 2, 10);
    });

    it('uses custom page size', async () => {
      vi.mocked(api.getHistory).mockResolvedValue(mockTauriResponses.historyPage());

      const { result } = renderHook(() => useHistory(50));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(api.getHistory).toHaveBeenCalledWith(1, 50);
      expect(result.current.pageSize).toBe(50);
    });

    it('defaults to page size 20', async () => {
      vi.mocked(api.getHistory).mockResolvedValue(mockTauriResponses.historyPage());

      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(api.getHistory).toHaveBeenCalledWith(1, 20);
      expect(result.current.pageSize).toBe(20);
    });
  });

  describe('refresh', () => {
    it('reloads current page', async () => {
      const initialData = mockTauriResponses.historyPage({
        items: [
          {
            id: 'content-1',
            title: 'Article 1',
            word_count: 500,
            format_count: 6,
            created_at: '2025-01-15T10:00:00Z',
          },
        ],
      });

      const refreshedData = mockTauriResponses.historyPage({
        items: [
          {
            id: 'content-1',
            title: 'Article 1',
            word_count: 500,
            format_count: 6,
            created_at: '2025-01-15T10:00:00Z',
          },
          {
            id: 'content-2',
            title: 'Article 2',
            word_count: 300,
            format_count: 3,
            created_at: '2025-01-15T09:00:00Z',
          },
        ],
        total: 11,
      });

      vi.mocked(api.getHistory)
        .mockResolvedValueOnce(initialData)
        .mockResolvedValueOnce(refreshedData);

      const { result } = renderHook(() => useHistory(10));

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      // Refresh
      await act(async () => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2);
      });

      expect(result.current.total).toBe(11);
      expect(api.getHistory).toHaveBeenCalledTimes(2);
    });

    it('clears error on refresh', async () => {
      vi.mocked(api.getHistory)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockTauriResponses.historyPage());

      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });

      // Refresh
      await act(async () => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });

      expect(result.current.items).toHaveLength(2);
    });
  });

  describe('loading states', () => {
    it('sets isLoading during fetch', async () => {
      vi.mocked(api.getHistory).mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve(mockTauriResponses.historyPage()), 100))
      );

      const { result } = renderHook(() => useHistory());

      expect(result.current.isLoading).toBe(true);

      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 200 }
      );
    });

    it('sets isLoading false even on error', async () => {
      vi.mocked(api.getHistory).mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('data integrity', () => {
    it('preserves all history item fields', async () => {
      const mockHistory = mockTauriResponses.historyPage({
        items: [
          {
            id: 'content-abc-123',
            title: 'Complete Article',
            word_count: 1500,
            format_count: 6,
            created_at: '2025-01-15T10:30:00Z',
          },
        ],
      });

      vi.mocked(api.getHistory).mockResolvedValue(mockHistory);

      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      const item = result.current.items[0];
      expect(item.id).toBe('content-abc-123');
      expect(item.title).toBe('Complete Article');
      expect(item.word_count).toBe(1500);
      expect(item.format_count).toBe(6);
      expect(item.created_at).toBe('2025-01-15T10:30:00Z');
    });

    it('handles null titles', async () => {
      vi.mocked(api.getHistory).mockResolvedValue(
        mockTauriResponses.historyPage({
          items: [
            {
              id: 'content-1',
              title: null,
              word_count: 100,
              format_count: 1,
              created_at: '2025-01-15T10:00:00Z',
            },
          ],
        })
      );

      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      expect(result.current.items[0].title).toBeNull();
    });
  });
});

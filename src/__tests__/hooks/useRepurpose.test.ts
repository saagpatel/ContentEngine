import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRepurpose } from '../../hooks/useRepurpose';
import { useAppStore } from '../../stores/appStore';
import { api } from '../../lib/tauriApi';
import { mockTauriResponses } from '../mocks/tauriApi.mock';

vi.mock('../../lib/tauriApi');

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

describe('useRepurpose', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useAppStore.setState({
      rawContent: '',
      title: '',
      sourceUrl: '',
      useUrl: false,
      selectedFormats: ['twitter_thread'],
      tone: 'professional',
      length: 'medium',
      selectedBrandVoiceId: null,
      platformConfig: {},
      isGenerating: false,
      generationError: null,
      outputs: [],
    });
  });

  describe('generate with raw content', () => {
    it('successfully generates outputs', async () => {
      const mockResponse = mockTauriResponses.repurposeResponse();
      vi.mocked(api.repurposeContent).mockResolvedValue(mockResponse);

      useAppStore.setState({
        rawContent: 'Test content for repurposing. '.repeat(20),
        selectedFormats: ['twitter_thread', 'linkedin'],
        tone: 'casual',
        length: 'short',
      });

      const { result } = renderHook(() => useRepurpose());

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBeNull();

      await act(async () => {
        await result.current.generate();
      });

      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
      });

      expect(api.repurposeContent).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining('Test content'),
          formats: ['twitter_thread', 'linkedin'],
          tone: 'casual',
          length: 'short',
        })
      );
    });

    it('sets isGenerating to true during generation', async () => {
      const deferred = createDeferred<ReturnType<typeof mockTauriResponses.repurposeResponse>>();
      vi.mocked(api.repurposeContent).mockReturnValue(deferred.promise);

      useAppStore.setState({
        rawContent: 'Content here',
      });

      const { result } = renderHook(() => useRepurpose());

      await act(async () => {
        void result.current.generate();
      });

      // Should be generating immediately
      expect(result.current.isGenerating).toBe(true);

      await act(async () => {
        deferred.resolve(mockTauriResponses.repurposeResponse());
        await deferred.promise;
      });

      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
      });
    });

    it('handles API errors gracefully', async () => {
      vi.mocked(api.repurposeContent).mockRejectedValue(new Error('API rate limited'));

      useAppStore.setState({
        rawContent: 'Content',
      });

      const { result } = renderHook(() => useRepurpose());

      await act(async () => {
        await result.current.generate();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('API rate limited');
      });

      expect(result.current.isGenerating).toBe(false);
    });

    it('clears previous errors on new generation', async () => {
      useAppStore.setState({
        rawContent: 'Content',
        generationError: 'Previous error',
      });

      vi.mocked(api.repurposeContent).mockResolvedValue(mockTauriResponses.repurposeResponse());

      const { result } = renderHook(() => useRepurpose());

      await act(async () => {
        await result.current.generate();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('generate with URL fetch', () => {
    it('fetches URL content before repurposing', async () => {
      const mockFetched = {
        title: 'Fetched Article',
        text: 'Fetched content from URL',
        word_count: 100,
      };
      vi.mocked(api.fetchUrl).mockResolvedValue(mockFetched);
      vi.mocked(api.repurposeContent).mockResolvedValue(mockTauriResponses.repurposeResponse());

      useAppStore.setState({
        useUrl: true,
        sourceUrl: 'https://example.com/article',
        selectedFormats: ['twitter_thread'],
      });

      const { result } = renderHook(() => useRepurpose());

      await act(async () => {
        await result.current.generate();
      });

      await waitFor(() => {
        expect(api.fetchUrl).toHaveBeenCalledWith('https://example.com/article');
      });

      expect(api.repurposeContent).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Fetched content from URL',
          source_url: 'https://example.com/article',
          title: 'Fetched Article',
        })
      );
    });

    it('handles URL fetch errors', async () => {
      vi.mocked(api.fetchUrl).mockRejectedValue(new Error('URL not found'));

      useAppStore.setState({
        useUrl: true,
        sourceUrl: 'https://invalid.com/404',
      });

      const { result } = renderHook(() => useRepurpose());

      await act(async () => {
        await result.current.generate();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('URL not found');
      });

      expect(api.repurposeContent).not.toHaveBeenCalled();
    });

    it('uses manual title if provided over fetched title', async () => {
      vi.mocked(api.fetchUrl).mockResolvedValue({
        title: 'Fetched Title',
        text: 'Content',
        word_count: 50,
      });
      vi.mocked(api.repurposeContent).mockResolvedValue(mockTauriResponses.repurposeResponse());

      useAppStore.setState({
        useUrl: true,
        sourceUrl: 'https://example.com',
        title: 'Manual Title',
      });

      const { result } = renderHook(() => useRepurpose());

      await act(async () => {
        await result.current.generate();
      });

      await waitFor(() => {
        expect(api.repurposeContent).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Manual Title',
          })
        );
      });
    });
  });

  describe('with brand voice', () => {
    it('includes brand voice ID in request', async () => {
      vi.mocked(api.repurposeContent).mockResolvedValue(mockTauriResponses.repurposeResponse());

      useAppStore.setState({
        rawContent: 'Content',
        selectedBrandVoiceId: 'voice-123',
      });

      const { result } = renderHook(() => useRepurpose());

      await act(async () => {
        await result.current.generate();
      });

      await waitFor(() => {
        expect(api.repurposeContent).toHaveBeenCalledWith(
          expect.objectContaining({
            voice_id: 'voice-123',
          })
        );
      });
    });

    it('omits voice_id if null', async () => {
      vi.mocked(api.repurposeContent).mockResolvedValue(mockTauriResponses.repurposeResponse());

      useAppStore.setState({
        rawContent: 'Content',
        selectedBrandVoiceId: null,
      });

      const { result } = renderHook(() => useRepurpose());

      await act(async () => {
        await result.current.generate();
      });

      await waitFor(() => {
        expect(api.repurposeContent).toHaveBeenCalledWith(
          expect.objectContaining({
            voice_id: undefined,
          })
        );
      });
    });
  });

  describe('platform config', () => {
    it('includes platform config if provided', async () => {
      vi.mocked(api.repurposeContent).mockResolvedValue(mockTauriResponses.repurposeResponse());

      const config = { tweet_count: 5 };

      useAppStore.setState({
        rawContent: 'Content',
        platformConfig: config,
      });

      const { result } = renderHook(() => useRepurpose());

      await act(async () => {
        await result.current.generate();
      });

      await waitFor(() => {
        expect(api.repurposeContent).toHaveBeenCalledWith(
          expect.objectContaining({
            config,
          })
        );
      });
    });

    it('omits config if empty', async () => {
      vi.mocked(api.repurposeContent).mockResolvedValue(mockTauriResponses.repurposeResponse());

      useAppStore.setState({
        rawContent: 'Content',
        platformConfig: {},
      });

      const { result } = renderHook(() => useRepurpose());

      await act(async () => {
        await result.current.generate();
      });

      await waitFor(() => {
        expect(api.repurposeContent).toHaveBeenCalledWith(
          expect.objectContaining({
            config: undefined,
          })
        );
      });
    });
  });

  describe('outputs handling', () => {
    it('updates store with generated outputs', async () => {
      const mockResponse = mockTauriResponses.repurposeResponse({
        outputs: [
          {
            id: 'output-1',
            content_input_id: 'content-1',
            format: 'twitter_thread',
            output_text: 'Tweet content',
            created_at: '2025-01-15T10:00:00Z',
          },
          {
            id: 'output-2',
            content_input_id: 'content-1',
            format: 'linkedin',
            output_text: 'LinkedIn post',
            created_at: '2025-01-15T10:00:00Z',
          },
        ],
      });

      vi.mocked(api.repurposeContent).mockResolvedValue(mockResponse);

      useAppStore.setState({
        rawContent: 'Content',
      });

      const { result } = renderHook(() => useRepurpose());

      await act(async () => {
        await result.current.generate();
      });

      await waitFor(() => {
        const state = useAppStore.getState();
        expect(state.outputs).toHaveLength(2);
      });
    });

    it('clears previous outputs before generating', async () => {
      const deferred = createDeferred<ReturnType<typeof mockTauriResponses.repurposeResponse>>();

      useAppStore.setState({
        rawContent: 'Content',
        outputs: [
          {
            id: 'old-1',
            content_input_id: 'old',
            format: 'twitter_thread',
            output_text: 'Old output',
            created_at: '2025-01-01T00:00:00Z',
          },
        ],
      });

      vi.mocked(api.repurposeContent).mockReturnValue(deferred.promise);

      const { result } = renderHook(() => useRepurpose());

      await act(async () => {
        void result.current.generate();
      });

      // Outputs should be cleared immediately
      const state = useAppStore.getState();
      expect(state.outputs).toHaveLength(0);

      await act(async () => {
        deferred.resolve(mockTauriResponses.repurposeResponse());
        await deferred.promise;
      });
    });
  });
});

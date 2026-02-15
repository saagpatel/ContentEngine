import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBrandVoice } from '../../hooks/useBrandVoice';
import { api } from '../../lib/tauriApi';
import { mockTauriResponses } from '../mocks/tauriApi.mock';

vi.mock('../../lib/tauriApi');

describe('useBrandVoice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadVoices', () => {
    it('loads brand voices on mount', async () => {
      const mockVoices = [
        mockTauriResponses.brandVoiceProfile(),
        mockTauriResponses.brandVoiceProfile({ id: 'voice-456', name: 'Casual Voice' }),
      ];
      vi.mocked(api.getBrandVoices).mockResolvedValue(mockVoices);

      const { result } = renderHook(() => useBrandVoice());

      await waitFor(() => {
        expect(result.current.voices).toHaveLength(2);
      });

      expect(result.current.voices[0].name).toBe('Professional Voice');
      expect(result.current.voices[1].name).toBe('Casual Voice');
    });

    it('handles empty voices list', async () => {
      vi.mocked(api.getBrandVoices).mockResolvedValue([]);

      const { result } = renderHook(() => useBrandVoice());

      await waitFor(() => {
        expect(result.current.voices).toHaveLength(0);
      });
    });

    it('handles API errors', async () => {
      vi.mocked(api.getBrandVoices).mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useBrandVoice());

      await waitFor(() => {
        expect(result.current.error).toBe('Database error');
      });
    });
  });

  describe('analyzeVoice', () => {
    it('creates new brand voice profile', async () => {
      const newVoice = mockTauriResponses.brandVoiceProfile({
        id: 'new-voice-123',
        name: 'New Voice',
      });

      vi.mocked(api.getBrandVoices).mockResolvedValue([]);
      vi.mocked(api.analyzeBrandVoice).mockResolvedValue(newVoice);
      vi.mocked(api.getBrandVoices).mockResolvedValue([newVoice]);

      const { result } = renderHook(() => useBrandVoice());

      await waitFor(() => {
        expect(result.current.voices).toHaveLength(0);
      });

      await act(async () => {
        await result.current.analyze('New Voice', ['Sample text']);
      });

      await waitFor(() => {
        expect(result.current.voices).toHaveLength(1);
      });

      expect(api.analyzeBrandVoice).toHaveBeenCalledWith({
        name: 'New Voice',
        samples: ['Sample text'],
      });
    });

    it('sets isAnalyzing during analysis', async () => {
      vi.mocked(api.getBrandVoices).mockResolvedValue([]);
      vi.mocked(api.analyzeBrandVoice).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockTauriResponses.brandVoiceProfile()), 100)
          )
      );

      const { result } = renderHook(() => useBrandVoice());

      await waitFor(() => {
        expect(result.current.isAnalyzing).toBe(false);
      });

      act(() => {
        result.current.analyze('Voice', ['Sample']);
      });

      await waitFor(() => {
        expect(result.current.isAnalyzing).toBe(true);
      });

      await waitFor(
        () => {
          expect(result.current.isAnalyzing).toBe(false);
        },
        { timeout: 200 }
      );
    });

    it('handles analysis errors', async () => {
      vi.mocked(api.getBrandVoices).mockResolvedValue([]);
      vi.mocked(api.analyzeBrandVoice).mockRejectedValue(new Error('Invalid samples'));

      const { result } = renderHook(() => useBrandVoice());

      await act(async () => {
        try {
          await result.current.analyze('Voice', []);
        } catch (err) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Invalid samples');
      });

      expect(result.current.isAnalyzing).toBe(false);
    });

    it('reloads voices after successful analysis', async () => {
      const initialVoices = [mockTauriResponses.brandVoiceProfile()];
      const newVoice = mockTauriResponses.brandVoiceProfile({
        id: 'new-123',
        name: 'New',
      });
      const updatedVoices = [...initialVoices, newVoice];

      vi.mocked(api.getBrandVoices)
        .mockResolvedValueOnce(initialVoices)
        .mockResolvedValueOnce(updatedVoices);
      vi.mocked(api.analyzeBrandVoice).mockResolvedValue(newVoice);

      const { result } = renderHook(() => useBrandVoice());

      await waitFor(() => {
        expect(result.current.voices).toHaveLength(1);
      });

      await act(async () => {
        await result.current.analyze('New', ['Sample']);
      });

      await waitFor(() => {
        expect(result.current.voices).toHaveLength(2);
      });
    });
  });

  describe('deleteVoice', () => {
    it('deletes brand voice', async () => {
      const voices = [
        mockTauriResponses.brandVoiceProfile({ id: 'voice-1' }),
        mockTauriResponses.brandVoiceProfile({ id: 'voice-2' }),
      ];

      vi.mocked(api.getBrandVoices)
        .mockResolvedValueOnce(voices)
        .mockResolvedValueOnce([voices[1]]);
      vi.mocked(api.deleteBrandVoice).mockResolvedValue();

      const { result } = renderHook(() => useBrandVoice());

      await waitFor(() => {
        expect(result.current.voices).toHaveLength(2);
      });

      await act(async () => {
        await result.current.deleteVoice('voice-1');
      });

      await waitFor(() => {
        expect(result.current.voices).toHaveLength(1);
      });

      expect(api.deleteBrandVoice).toHaveBeenCalledWith('voice-1');
    });

    it('handles delete errors', async () => {
      vi.mocked(api.getBrandVoices).mockResolvedValue([mockTauriResponses.brandVoiceProfile()]);
      vi.mocked(api.deleteBrandVoice).mockRejectedValue(new Error('Cannot delete'));

      const { result } = renderHook(() => useBrandVoice());

      await waitFor(() => {
        expect(result.current.voices).toHaveLength(1);
      });

      await act(async () => {
        await result.current.deleteVoice('voice-123');
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Cannot delete');
      });

      // Voice list should remain unchanged
      expect(result.current.voices).toHaveLength(1);
    });
  });

  describe('setDefaultVoice', () => {
    it('sets voice as default', async () => {
      vi.mocked(api.getBrandVoices).mockResolvedValue([mockTauriResponses.brandVoiceProfile()]);
      vi.mocked(api.setDefaultVoice).mockResolvedValue();

      const { result } = renderHook(() => useBrandVoice());

      await waitFor(() => {
        expect(result.current.voices).toHaveLength(1);
      });

      await act(async () => {
        await result.current.setDefault('voice-123');
      });

      expect(api.setDefaultVoice).toHaveBeenCalledWith('voice-123');
    });

    it('handles set default errors', async () => {
      vi.mocked(api.getBrandVoices).mockResolvedValue([]);
      vi.mocked(api.setDefaultVoice).mockRejectedValue(new Error('Voice not found'));

      const { result } = renderHook(() => useBrandVoice());

      await act(async () => {
        await result.current.setDefault('invalid-id');
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Voice not found');
      });
    });

    it('reloads voices after setting default', async () => {
      const voice1 = mockTauriResponses.brandVoiceProfile({
        id: 'voice-1',
        is_default: false,
      });
      const voice2 = mockTauriResponses.brandVoiceProfile({
        id: 'voice-2',
        is_default: false,
      });

      const updatedVoices = [
        { ...voice1, is_default: false },
        { ...voice2, is_default: true },
      ];

      vi.mocked(api.getBrandVoices)
        .mockResolvedValueOnce([voice1, voice2])
        .mockResolvedValueOnce(updatedVoices);
      vi.mocked(api.setDefaultVoice).mockResolvedValue();

      const { result } = renderHook(() => useBrandVoice());

      await waitFor(() => {
        expect(result.current.voices).toHaveLength(2);
      });

      await act(async () => {
        await result.current.setDefault('voice-2');
      });

      await waitFor(() => {
        expect(result.current.voices[1].is_default).toBe(true);
      });
    });
  });

  describe('data integrity', () => {
    it('preserves all voice profile fields', async () => {
      const mockVoice = mockTauriResponses.brandVoiceProfile({
        id: 'voice-abc',
        name: 'Test Voice',
        description: 'A test voice profile',
        is_default: true,
        created_at: '2025-01-10T10:00:00Z',
        updated_at: '2025-01-15T14:00:00Z',
        style_attributes: {
          tone: 'professional',
          vocabulary_level: 'technical',
          sentence_style: 'concise',
          personality_traits: ['analytical'],
          signature_phrases: ['therefore', 'thus'],
          avoid_phrases: ['literally'],
        },
      });

      vi.mocked(api.getBrandVoices).mockResolvedValue([mockVoice]);

      const { result } = renderHook(() => useBrandVoice());

      await waitFor(() => {
        expect(result.current.voices).toHaveLength(1);
      });

      const voice = result.current.voices[0];
      expect(voice.id).toBe('voice-abc');
      expect(voice.name).toBe('Test Voice');
      expect(voice.description).toBe('A test voice profile');
      expect(voice.is_default).toBe(true);
      expect(voice.style_attributes.tone).toBe('professional');
      expect(voice.style_attributes.signature_phrases).toEqual(['therefore', 'thus']);
    });
  });
});

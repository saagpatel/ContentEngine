import { invoke } from '@tauri-apps/api/core';
import { vi } from 'vitest';
import type {
  ContentInput,
  RepurposeResponse,
  HistoryPage,
  RepurposedOutput,
} from '../../types/content';
import type { BrandVoiceProfile } from '../../types/brandVoice';
import type { UsageInfo } from '../../types/usage';

/**
 * Mock factory for Tauri API responses
 * Use these helpers to create consistent test data.
 */
export const mockTauriResponses = {
  contentInput: (overrides?: Partial<ContentInput>): ContentInput => ({
    id: 'test-content-123',
    title: 'Test Article',
    raw_text: 'This is test content with enough words to meet the minimum requirement. '.repeat(10),
    source_url: 'https://example.com/article',
    word_count: 150,
    created_at: '2025-01-15T10:00:00Z',
    ...overrides,
  }),

  repurposedOutput: (overrides?: Partial<RepurposedOutput>): RepurposedOutput => ({
    id: 'output-1',
    content_input_id: 'test-content-123',
    format: 'twitter_thread',
    output_text: JSON.stringify({
      tweets: [{ text: 'Tweet 1 content' }, { text: 'Tweet 2 content' }],
    }),
    created_at: '2025-01-15T10:05:00Z',
    ...overrides,
  }),

  repurposeResponse: (overrides?: Partial<RepurposeResponse>): RepurposeResponse => ({
    content_input_id: 'test-content-123',
    outputs: [
      mockTauriResponses.repurposedOutput(),
      mockTauriResponses.repurposedOutput({
        id: 'output-2',
        format: 'linkedin',
        output_text: 'LinkedIn post content',
      }),
    ],
    ...overrides,
  }),

  historyPage: (overrides?: Partial<HistoryPage>): HistoryPage => ({
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
        created_at: '2025-01-14T10:00:00Z',
      },
    ],
    total: 10,
    page: 0,
    page_size: 10,
    ...overrides,
  }),

  brandVoiceProfile: (overrides?: Partial<BrandVoiceProfile>): BrandVoiceProfile => ({
    id: 'voice-123',
    name: 'Professional Voice',
    description: 'Corporate professional tone',
    style_attributes: {
      tone: 'professional',
      vocabulary_level: 'technical',
      sentence_style: 'clear and concise',
      personality_traits: ['authoritative', 'helpful'],
      signature_phrases: ['leverage', 'optimize'],
      avoid_phrases: ['ASAP', 'totally'],
    },
    is_default: false,
    created_at: '2025-01-10T10:00:00Z',
    updated_at: '2025-01-10T10:00:00Z',
    ...overrides,
  }),

  usageInfo: (overrides?: Partial<UsageInfo>): UsageInfo => ({
    used: 25,
    limit: 50,
    resets_at: '2025-02-01T00:00:00Z',
    ...overrides,
  }),
};

/**
 * Mock Tauri invoke function with specific responses
 * Usage in tests:
 *   setupTauriMock().mockResolvedValue(mockTauriResponses.contentInput())
 */
export const setupTauriMock = () => vi.mocked(invoke);

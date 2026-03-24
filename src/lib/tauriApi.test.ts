import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import type { RepurposeRequest } from '../types/content';
import { api } from './tauriApi';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('tauriApi command argument mapping', () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
    vi.mocked(invoke).mockResolvedValue(undefined);
  });

  it('maps optional source_url to Tauri camelCase for save_content', async () => {
    await api.saveContent({
      text: 'Example body',
      source_url: 'https://example.com/post',
      title: 'Example title',
    });

    expect(invoke).toHaveBeenCalledWith('save_content', {
      text: 'Example body',
      sourceUrl: 'https://example.com/post',
      title: 'Example title',
    });
    expect(vi.mocked(invoke).mock.calls[0]?.[1]).not.toHaveProperty('source_url');
  });

  it('uses camelCase pagination and export keys for Tauri commands', async () => {
    await api.getHistory(2, 10);
    await api.exportPdf('content-123');

    expect(invoke).toHaveBeenNthCalledWith(1, 'get_history', {
      page: 2,
      pageSize: 10,
    });
    expect(vi.mocked(invoke).mock.calls[0]?.[1]).not.toHaveProperty('page_size');

    expect(invoke).toHaveBeenNthCalledWith(2, 'export_pdf', {
      contentInputId: 'content-123',
    });
    expect(vi.mocked(invoke).mock.calls[1]?.[1]).not.toHaveProperty('content_input_id');
  });

  it('uses apiKey instead of api_key when saving settings', async () => {
    await api.setApiKey('sk-ant-test-key');

    expect(invoke).toHaveBeenCalledWith('set_api_key', {
      apiKey: 'sk-ant-test-key',
    });
    expect(vi.mocked(invoke).mock.calls[0]?.[1]).not.toHaveProperty('api_key');
  });

  it('routes the remaining Tauri commands through invoke with the expected payloads', async () => {
    const request: RepurposeRequest = {
      content: 'Source body',
      formats: ['summary'],
      tone: 'professional',
      length: 'short',
    };
    const voiceRequest = {
      name: 'Founder Voice',
      description: 'Clear and practical',
      samples: ['One sample'],
    };

    await api.fetchUrl('https://example.com/post');
    await api.repurposeContent(request);
    await api.getBrandVoices();
    await api.analyzeBrandVoice(voiceRequest);
    await api.deleteBrandVoice('voice-1');
    await api.setDefaultVoice('voice-1');
    await api.getHistoryDetail('content-1');
    await api.deleteHistoryItem('content-1');
    await api.getUsageInfo();
    await api.getApiKey();

    expect(invoke).toHaveBeenNthCalledWith(1, 'fetch_url', { url: 'https://example.com/post' });
    expect(invoke).toHaveBeenNthCalledWith(2, 'repurpose_content', { request });
    expect(invoke).toHaveBeenNthCalledWith(3, 'get_brand_voices');
    expect(invoke).toHaveBeenNthCalledWith(4, 'analyze_brand_voice', { request: voiceRequest });
    expect(invoke).toHaveBeenNthCalledWith(5, 'delete_brand_voice', { id: 'voice-1' });
    expect(invoke).toHaveBeenNthCalledWith(6, 'set_default_voice', { id: 'voice-1' });
    expect(invoke).toHaveBeenNthCalledWith(7, 'get_history_detail', { id: 'content-1' });
    expect(invoke).toHaveBeenNthCalledWith(8, 'delete_history_item', { id: 'content-1' });
    expect(invoke).toHaveBeenNthCalledWith(9, 'get_usage_info');
    expect(invoke).toHaveBeenNthCalledWith(10, 'get_api_key');
  });
});

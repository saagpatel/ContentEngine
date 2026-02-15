/**
 * Database fixture data for testing
 * These represent sample SQLite data structures
 */

export const dbFixtures = {
  contentInputs: [
    {
      id: 'content-abc-123',
      source_url: 'https://example.com/article-1',
      raw_text: 'This is a sample article about content marketing. '.repeat(20),
      title: 'The Ultimate Guide to Content Marketing',
      word_count: 350,
      created_at: '2025-01-15T10:00:00Z',
    },
    {
      id: 'content-def-456',
      source_url: null,
      raw_text: 'This is pasted content without a URL source. '.repeat(15),
      title: 'Quick Thoughts on Social Media',
      word_count: 120,
      created_at: '2025-01-14T15:30:00Z',
    },
  ],

  repurposedOutputs: [
    {
      id: 'output-twitter-123',
      content_input_id: 'content-abc-123',
      format: 'twitter',
      output_text: JSON.stringify({
        tweets: [
          { text: 'Tweet 1 about content marketing' },
          { text: 'Tweet 2 with insights' },
        ],
      }),
      parsed_metadata: JSON.stringify({
        tweets_count: 2,
        character_count: 240,
      }),
      created_at: '2025-01-15T10:05:00Z',
    },
    {
      id: 'output-linkedin-123',
      content_input_id: 'content-abc-123',
      format: 'linkedin',
      output_text: 'LinkedIn post content here...',
      parsed_metadata: null,
      created_at: '2025-01-15T10:05:00Z',
    },
  ],

  brandVoiceProfiles: [
    {
      id: 'voice-professional-001',
      name: 'Corporate Professional',
      description: 'Formal business communication style',
      style_attributes_json: JSON.stringify({
        tone: 'professional, authoritative',
        vocabulary: 'business-focused, technical',
        sentence_structure: 'clear and concise',
        key_phrases: ['leverage', 'optimize', 'synergy'],
        emoji_usage: 'none',
      }),
      is_default: 1,
      created_at: '2025-01-10T10:00:00Z',
      updated_at: '2025-01-10T10:00:00Z',
    },
    {
      id: 'voice-casual-002',
      name: 'Casual & Friendly',
      description: 'Conversational and approachable',
      style_attributes_json: JSON.stringify({
        tone: 'conversational, friendly, witty',
        vocabulary: 'everyday language, relatable',
        sentence_structure: 'short and punchy',
        key_phrases: ['hey there', 'let\'s dive in', 'here\'s the deal'],
        emoji_usage: 'high',
      }),
      is_default: 0,
      created_at: '2025-01-11T14:00:00Z',
      updated_at: '2025-01-11T14:00:00Z',
    },
  ],

  brandVoiceSamples: [
    {
      id: 'sample-001',
      profile_id: 'voice-professional-001',
      sample_text: 'We are pleased to announce our strategic partnership with leading industry experts to optimize operational efficiency and leverage cutting-edge solutions.',
      created_at: '2025-01-10T10:00:00Z',
    },
    {
      id: 'sample-002',
      profile_id: 'voice-casual-002',
      sample_text: 'Hey there! So glad you\'re here. Let me share something cool I discovered last week that totally changed my perspective on content creation.',
      created_at: '2025-01-11T14:00:00Z',
    },
  ],

  usageRecords: [
    {
      id: 'usage-001',
      content_input_id: 'content-abc-123',
      format_count: 6,
      created_at: '2025-01-15T10:05:00Z',
    },
    {
      id: 'usage-002',
      content_input_id: 'content-def-456',
      format_count: 3,
      created_at: '2025-01-14T15:35:00Z',
    },
  ],

  appSettings: [
    { key: 'monthly_usage_limit', value: '50' },
    { key: 'claude_api_key', value: '' },
    { key: 'app_version', value: '1.0.0' },
    { key: 'first_launch', value: '1' },
  ],
};

/**
 * Helper to generate usage records for testing limits
 */
export function generateUsageRecords(count: number, monthOffset: number = 0): any[] {
  const date = new Date();
  date.setMonth(date.getMonth() + monthOffset);

  return Array.from({ length: count }, (_, i) => ({
    id: `usage-${i}`,
    content_input_id: `content-${i}`,
    format_count: 1,
    created_at: date.toISOString(),
  }));
}

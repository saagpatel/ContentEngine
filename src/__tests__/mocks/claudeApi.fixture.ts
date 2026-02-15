/**
 * Claude API response fixtures for backend testing
 * These match the expected JSON structure from Claude API
 */

export const claudeApiFixtures = {
  /**
   * Valid Twitter thread response (JSON format)
   */
  twitterThreadJson: {
    tweets: [
      { text: 'Tweet 1: This is an engaging hook about the topic' },
      { text: 'Tweet 2: Here\'s the key insight that matters' },
      { text: 'Tweet 3: And here\'s why you should care about this' },
      { text: 'Tweet 4: Final call to action - check out the full article!' },
    ],
  },

  /**
   * Twitter thread with numbered markers (fallback format)
   */
  twitterThreadMarkers: `1/ This is an engaging hook about the topic

2/ Here's the key insight that matters

3/ And here's why you should care about this

4/ Final call to action - check out the full article!`,

  /**
   * Valid email sequence response (JSON format)
   */
  emailSequenceJson: {
    subject: 'Welcome to our content series',
    part1: {
      subject: 'Part 1: Introduction to the topic',
      body: 'Welcome! Here\'s what you need to know...',
    },
    part2: {
      subject: 'Part 2: Deep dive into key concepts',
      body: 'Now that you understand the basics, let\'s go deeper...',
    },
    part3: {
      subject: 'Part 3: Taking action',
      body: 'Here\'s how to apply what you\'ve learned...',
    },
  },

  /**
   * LinkedIn post response
   */
  linkedinPost: `Here's a professional LinkedIn post about the topic.

It includes multiple paragraphs with proper formatting.

Key insights are highlighted throughout.

#ContentMarketing #ProfessionalDevelopment`,

  /**
   * Instagram caption response
   */
  instagramCaption: `✨ Here's an engaging Instagram caption!

It includes emojis and hooks 🎯

Multiple short paragraphs for readability.

#ContentCreation #SocialMedia #Marketing`,

  /**
   * Newsletter excerpt response
   */
  newsletterExcerpt: `SUBJECT: Your weekly content insights

PREVIEW: Discover the top 3 strategies for better content

Here's this week's newsletter excerpt with valuable insights about content creation.

We'll cover:
- Strategy 1: Focus on quality
- Strategy 2: Know your audience
- Strategy 3: Consistent publishing

Read more in the full newsletter!`,

  /**
   * Summary response
   */
  summary: `This article discusses three key strategies for effective content creation: focusing on quality over quantity, deeply understanding your target audience, and maintaining a consistent publishing schedule. The author emphasizes that these fundamentals are more important than chasing trends or using complex tools.`,

  /**
   * Brand voice analysis response
   */
  brandVoiceAnalysis: {
    tone: 'conversational, witty, professional',
    vocabulary: 'contemporary, accessible, business-focused',
    sentence_structure: 'short and punchy with occasional longer explanations',
    key_phrases: ['game-changer', 'level up', 'let\'s dive in', 'here\'s the thing'],
    emoji_usage: 'medium',
  },

  /**
   * Key points extraction (used in repurpose pipeline)
   */
  keyPointsExtraction: {
    main_topic: 'Content marketing strategies',
    key_points: [
      'Quality matters more than quantity',
      'Understanding audience is critical',
      'Consistency builds trust and authority',
    ],
    supporting_details: [
      'Research shows quality content drives 3x more engagement',
      'Audience research reduces content creation time by 40%',
      'Regular publishing schedules increase subscriber retention',
    ],
    tone: 'professional and educational',
    target_audience: 'Content marketers and business owners',
  },
};

/**
 * Claude API error responses
 */
export const claudeApiErrors = {
  rateLimited: {
    error: {
      type: 'rate_limit_error',
      message: 'Rate limit exceeded',
    },
  },

  invalidApiKey: {
    error: {
      type: 'authentication_error',
      message: 'Invalid API key',
    },
  },

  timeout: {
    error: {
      type: 'timeout_error',
      message: 'Request timed out',
    },
  },
};

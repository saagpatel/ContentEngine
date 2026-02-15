/**
 * Validation constants and rules
 */
export const VALIDATION = {
  CONTENT: {
    MIN_WORDS: 50,
    MAX_CHARS: 500_000, // ~100K words, safe for Claude
    MIN_CHARS: 50,
  },
  URL: {
    TIMEOUT_MS: 30_000,
    MAX_SIZE_BYTES: 10_000_000, // 10MB max page size
    ALLOWED_PROTOCOLS: ['http:', 'https:'] as const,
  },
  BRAND_VOICE: {
    NAME_MAX_CHARS: 100,
    DESCRIPTION_MAX_CHARS: 500,
    MIN_SAMPLES: 1,
    MAX_SAMPLES: 10,
    SAMPLE_MIN_CHARS: 50,
    SAMPLE_MAX_CHARS: 10_000,
  },
  API_KEY: {
    PREFIX: 'sk-ant-',
    MIN_LENGTH: 50,
  },
  USAGE: {
    DEFAULT_MONTHLY_LIMIT: 50,
    RESET_UTC_HOUR: 0,
  },
} as const;

/**
 * Validate content length
 */
export function validateContent(text: string): {
  valid: boolean;
  error?: string;
  wordCount?: number;
} {
  if (text.length < VALIDATION.CONTENT.MIN_CHARS) {
    return {
      valid: false,
      error: `Content too short. Minimum ${VALIDATION.CONTENT.MIN_CHARS} characters required.`,
    };
  }

  if (text.length > VALIDATION.CONTENT.MAX_CHARS) {
    return {
      valid: false,
      error: `Content too long. Maximum ${VALIDATION.CONTENT.MAX_CHARS} characters allowed.`,
    };
  }

  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount < VALIDATION.CONTENT.MIN_WORDS) {
    return {
      valid: false,
      error: `Content too short. Minimum ${VALIDATION.CONTENT.MIN_WORDS} words required.`,
      wordCount,
    };
  }

  return { valid: true, wordCount };
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    if (!VALIDATION.URL.ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return {
        valid: false,
        error: `Invalid URL protocol. Only HTTP and HTTPS are allowed.`,
      };
    }

    // Block localhost and internal IPs
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    ) {
      return {
        valid: false,
        error: 'Internal and localhost URLs are not allowed.',
      };
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      error: 'Invalid URL format.',
    };
  }
}

/**
 * Validate brand voice samples
 */
export function validateBrandVoiceSamples(samples: string[]): {
  valid: boolean;
  error?: string;
} {
  if (samples.length < VALIDATION.BRAND_VOICE.MIN_SAMPLES) {
    return {
      valid: false,
      error: `At least ${VALIDATION.BRAND_VOICE.MIN_SAMPLES} sample required.`,
    };
  }

  if (samples.length > VALIDATION.BRAND_VOICE.MAX_SAMPLES) {
    return {
      valid: false,
      error: `Maximum ${VALIDATION.BRAND_VOICE.MAX_SAMPLES} samples allowed.`,
    };
  }

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    if (sample.length < VALIDATION.BRAND_VOICE.SAMPLE_MIN_CHARS) {
      return {
        valid: false,
        error: `Sample ${i + 1} too short. Minimum ${VALIDATION.BRAND_VOICE.SAMPLE_MIN_CHARS} characters.`,
      };
    }

    if (sample.length > VALIDATION.BRAND_VOICE.SAMPLE_MAX_CHARS) {
      return {
        valid: false,
        error: `Sample ${i + 1} too long. Maximum ${VALIDATION.BRAND_VOICE.SAMPLE_MAX_CHARS} characters.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validate API key format
 */
export function validateApiKey(key: string): { valid: boolean; error?: string } {
  if (!key.startsWith(VALIDATION.API_KEY.PREFIX)) {
    return {
      valid: false,
      error: `API key must start with "${VALIDATION.API_KEY.PREFIX}".`,
    };
  }

  if (key.length < VALIDATION.API_KEY.MIN_LENGTH) {
    return {
      valid: false,
      error: `API key is too short. Please check your key.`,
    };
  }

  return { valid: true };
}

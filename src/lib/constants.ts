import type { OutputFormat, TonePreset, LengthPreset } from '../types/platform';

export const FORMAT_META: Record<
  OutputFormat,
  { label: string; icon: string; description: string }
> = {
  twitter_thread: { label: 'Twitter/X Thread', icon: '🐦', description: 'Multi-tweet thread' },
  linkedin: { label: 'LinkedIn Post', icon: '💼', description: 'Professional post' },
  instagram: { label: 'Instagram Caption', icon: '📸', description: 'Caption with hashtags' },
  newsletter: { label: 'Newsletter', icon: '📧', description: 'Email newsletter excerpt' },
  email_sequence: { label: 'Email Sequence', icon: '📬', description: '3-part drip campaign' },
  summary: { label: 'Summary', icon: '📝', description: 'Concise summary' },
};

export const TONE_META: Record<TonePreset, { label: string; description: string }> = {
  casual: { label: 'Casual', description: 'Conversational and relaxed' },
  professional: { label: 'Professional', description: 'Polished and authoritative' },
  storytelling: { label: 'Storytelling', description: 'Narrative and engaging' },
  educational: { label: 'Educational', description: 'Informative and clear' },
};

export const LENGTH_META: Record<LengthPreset, { label: string }> = {
  short: { label: 'Short' },
  medium: { label: 'Medium' },
  long: { label: 'Long' },
};

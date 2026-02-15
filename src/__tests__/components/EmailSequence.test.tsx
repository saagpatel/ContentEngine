import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmailSequence } from '../../components/output/EmailSequence';
import type { RepurposedOutput, EmailSequenceData } from '../../types/content';

const createMockOutput = (outputText: string): RepurposedOutput => ({
  id: 'output-email-123',
  content_input_id: 'content-123',
  format: 'email',
  output_text: outputText,
  created_at: '2025-01-15T10:00:00Z',
});

const validEmailSequence: EmailSequenceData = {
  emails: [
    {
      email_number: 1,
      label: 'Introduction',
      subject_line: 'Welcome to our content series',
      preview_text: 'Learn the fundamentals',
      body: 'Welcome! Here is the first email with valuable content.',
      cta_text: 'Read More',
    },
    {
      email_number: 2,
      label: 'Deep Dive',
      subject_line: 'Going deeper into the topic',
      preview_text: 'Advanced strategies revealed',
      body: "Now that you know the basics, let's explore advanced concepts.",
      cta_text: 'Continue Learning',
    },
    {
      email_number: 3,
      label: 'Taking Action',
      subject_line: 'Put it into practice',
      preview_text: 'Your action plan',
      body: "Here's how to apply everything you've learned.",
      cta_text: 'Get Started',
    },
  ],
};

describe('EmailSequence', () => {
  describe('Valid JSON parsing', () => {
    it('renders all emails in sequence', () => {
      const output = createMockOutput(JSON.stringify(validEmailSequence));

      render(<EmailSequence output={output} />);

      expect(screen.getByText('Email 1')).toBeInTheDocument();
      expect(screen.getByText('Introduction')).toBeInTheDocument();
      expect(screen.getByText('Email 2')).toBeInTheDocument();
      expect(screen.getByText('Deep Dive')).toBeInTheDocument();
      expect(screen.getByText('Email 3')).toBeInTheDocument();
      expect(screen.getByText('Taking Action')).toBeInTheDocument();
    });

    it('first email is expanded by default', () => {
      const output = createMockOutput(JSON.stringify(validEmailSequence));

      render(<EmailSequence output={output} />);

      // First email's content should be visible
      expect(screen.getByText('Welcome to our content series')).toBeInTheDocument();
      expect(screen.getByText('Learn the fundamentals')).toBeInTheDocument();
      expect(
        screen.getByText('Welcome! Here is the first email with valuable content.')
      ).toBeInTheDocument();
    });

    it('expands and collapses emails on click', () => {
      const output = createMockOutput(JSON.stringify(validEmailSequence));

      render(<EmailSequence output={output} />);

      // First email is expanded, click to collapse
      const email1Button = screen.getByText('Introduction').closest('button');
      fireEvent.click(email1Button!);

      // First email content should be hidden
      expect(screen.queryByText('Welcome to our content series')).not.toBeInTheDocument();

      // Click second email to expand
      const email2Button = screen.getByText('Deep Dive').closest('button');
      fireEvent.click(email2Button!);

      // Second email content should be visible
      expect(screen.getByText('Going deeper into the topic')).toBeInTheDocument();
      expect(
        screen.getByText("Now that you know the basics, let's explore advanced concepts.")
      ).toBeInTheDocument();
    });

    it('displays all email sections when expanded', () => {
      const output = createMockOutput(JSON.stringify(validEmailSequence));

      render(<EmailSequence output={output} />);

      // Check for section labels
      expect(screen.getByText('Subject')).toBeInTheDocument();
      expect(screen.getByText('Preview')).toBeInTheDocument();
      expect(screen.getByText('Body')).toBeInTheDocument();
      expect(screen.getByText('CTA')).toBeInTheDocument();
    });

    it('renders CTA text correctly', () => {
      const output = createMockOutput(JSON.stringify(validEmailSequence));

      render(<EmailSequence output={output} />);

      expect(screen.getByText('Read More')).toBeInTheDocument();
    });

    it('renders Copy All button', () => {
      const output = createMockOutput(JSON.stringify(validEmailSequence));

      render(<EmailSequence output={output} />);

      expect(screen.getByText('Copy All')).toBeInTheDocument();
    });
  });

  describe('Edge cases for valid JSON', () => {
    it('handles single email sequence', () => {
      const singleEmail: EmailSequenceData = {
        emails: [validEmailSequence.emails[0]],
      };
      const output = createMockOutput(JSON.stringify(singleEmail));

      render(<EmailSequence output={output} />);

      expect(screen.getByText('Email 1')).toBeInTheDocument();
      expect(screen.getByText('Introduction')).toBeInTheDocument();
    });

    it('handles empty emails array', () => {
      const emptySequence: EmailSequenceData = {
        emails: [],
      };
      const output = createMockOutput(JSON.stringify(emptySequence));

      render(<EmailSequence output={output} />);

      // Falls back to plaintext mode with a single Copy button
      expect(screen.getByText('Copy')).toBeInTheDocument();
    });

    it('handles long email bodies with newlines', () => {
      const longBodyEmail: EmailSequenceData = {
        emails: [
          {
            email_number: 1,
            label: 'Long Email',
            subject_line: 'Subject',
            preview_text: 'Preview',
            body: 'Line 1\n\nLine 2\n\nLine 3 with lots of content\n\nLine 4',
            cta_text: 'Click Here',
          },
        ],
      };
      const output = createMockOutput(JSON.stringify(longBodyEmail));

      render(<EmailSequence output={output} />);

      const bodyText = screen.getByText(/Line 1/);
      expect(bodyText).toBeInTheDocument();
    });
  });

  describe('Invalid JSON - Fallback to plaintext', () => {
    it('renders invalid JSON as plaintext', () => {
      const invalidJson = '{ this is not valid json }';
      const output = createMockOutput(invalidJson);

      render(<EmailSequence output={output} />);

      expect(screen.getByText('{ this is not valid json }')).toBeInTheDocument();
      // Should not show email structure
      expect(screen.queryByText('Email 1')).not.toBeInTheDocument();
    });

    it('renders plain text without JSON structure', () => {
      const plainText = 'This is a plain text email sequence fallback.';
      const output = createMockOutput(plainText);

      render(<EmailSequence output={output} />);

      expect(screen.getByText('This is a plain text email sequence fallback.')).toBeInTheDocument();
    });

    it('preserves formatting in plaintext fallback', () => {
      const formattedText = 'Email 1:\nSubject: Test\nBody: Content\n\nEmail 2:\nMore content';
      const output = createMockOutput(formattedText);

      render(<EmailSequence output={output} />);

      expect(screen.getByText(/Email 1:/)).toBeInTheDocument();
    });

    it('renders copy button for plaintext fallback', () => {
      const output = createMockOutput('Fallback text');

      // Should have at least one copy button
      const { container } = render(<EmailSequence output={output} />);
      const copyButtons = container.querySelectorAll('button');
      expect(copyButtons.length).toBeGreaterThan(0);
    });
  });

  describe('UI interactions', () => {
    it('shows collapse indicator (-) when expanded', () => {
      const output = createMockOutput(JSON.stringify(validEmailSequence));

      render(<EmailSequence output={output} />);

      // First email is expanded by default
      const email1Button = screen.getByText('Introduction').closest('button');
      expect(email1Button).toHaveTextContent('-');
    });

    it('shows expand indicator (+) when collapsed', () => {
      const output = createMockOutput(JSON.stringify(validEmailSequence));

      render(<EmailSequence output={output} />);

      // Second and third emails are collapsed
      const email2Button = screen.getByText('Deep Dive').closest('button');
      expect(email2Button).toHaveTextContent('+');
    });

    it('only one email can be expanded at a time', () => {
      const output = createMockOutput(JSON.stringify(validEmailSequence));

      render(<EmailSequence output={output} />);

      // First email is expanded
      expect(screen.getByText('Welcome to our content series')).toBeInTheDocument();

      // Click second email
      const email2Button = screen.getByText('Deep Dive').closest('button');
      fireEvent.click(email2Button!);

      // Second email should be expanded, first should be collapsed
      expect(screen.queryByText('Welcome to our content series')).not.toBeInTheDocument();
      expect(screen.getByText('Going deeper into the topic')).toBeInTheDocument();
    });
  });

  describe('Data integrity', () => {
    it('handles special characters in subject lines', () => {
      const specialCharsEmail: EmailSequenceData = {
        emails: [
          {
            email_number: 1,
            label: 'Test',
            subject_line: 'Subject with <special> & "characters"',
            preview_text: 'Preview',
            body: 'Body',
            cta_text: 'CTA',
          },
        ],
      };
      const output = createMockOutput(JSON.stringify(specialCharsEmail));

      render(<EmailSequence output={output} />);

      expect(screen.getByText(/Subject with <special>/)).toBeInTheDocument();
    });

    it('handles emojis in all fields', () => {
      const emojiEmail: EmailSequenceData = {
        emails: [
          {
            email_number: 1,
            label: '🚀 Launch',
            subject_line: '🎉 Welcome!',
            preview_text: '✨ Preview',
            body: '💡 Body content',
            cta_text: '👉 Click',
          },
        ],
      };
      const output = createMockOutput(JSON.stringify(emojiEmail));

      render(<EmailSequence output={output} />);

      expect(screen.getByText('🚀 Launch')).toBeInTheDocument();
      expect(screen.getByText('🎉 Welcome!')).toBeInTheDocument();
    });

    it('handles empty strings in email fields', () => {
      const emptyFieldsEmail: EmailSequenceData = {
        emails: [
          {
            email_number: 1,
            label: '',
            subject_line: '',
            preview_text: '',
            body: '',
            cta_text: '',
          },
        ],
      };
      const output = createMockOutput(JSON.stringify(emptyFieldsEmail));

      render(<EmailSequence output={output} />);

      expect(screen.getByText('Email 1')).toBeInTheDocument();
    });
  });
});

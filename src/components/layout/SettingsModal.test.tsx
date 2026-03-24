import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SettingsModal } from './SettingsModal';
import { useAppStore } from '../../stores/appStore';
import { api } from '../../lib/tauriApi';

vi.mock('../../lib/tauriApi', () => ({
  api: {
    getApiKey: vi.fn(),
    setApiKey: vi.fn(),
  },
}));

describe('SettingsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ settingsOpen: true });
  });

  it('shows the stored key as helper text without placing it in the input', async () => {
    vi.mocked(api.getApiKey).mockResolvedValue('sk-a...1234');

    render(<SettingsModal />);

    await waitFor(() => {
      expect(screen.getByText('Current saved key: sk-a...1234')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Anthropic API Key')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('masks a full stored key before showing helper text', async () => {
    vi.mocked(api.getApiKey).mockResolvedValue('sk-ant-this-is-a-real-secret');

    render(<SettingsModal />);

    await waitFor(() => {
      expect(screen.getByText('Current saved key: sk-a...cret')).toBeInTheDocument();
    });

    expect(screen.queryByDisplayValue('sk-ant-this-is-a-real-secret')).not.toBeInTheDocument();
  });

  it('saves a newly entered replacement key', async () => {
    vi.mocked(api.getApiKey).mockResolvedValue('sk-a...1234');
    vi.mocked(api.setApiKey).mockResolvedValue();

    render(<SettingsModal />);

    await waitFor(() => {
      expect(screen.getByText('Current saved key: sk-a...1234')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Anthropic API Key'), {
      target: { value: 'sk-ant-real-key' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(api.setApiKey).toHaveBeenCalledWith('sk-ant-real-key');
    });

    expect(screen.getByLabelText('Anthropic API Key')).toHaveValue('');
  });

  it('does not save the masked helper value back to storage', async () => {
    vi.mocked(api.getApiKey).mockResolvedValue('sk-a...1234');

    render(<SettingsModal />);

    await waitFor(() => {
      expect(screen.getByText('Current saved key: sk-a...1234')).toBeInTheDocument();
    });

    expect(api.setApiKey).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('clears a stored key explicitly', async () => {
    vi.mocked(api.getApiKey).mockResolvedValue('sk-a...1234');
    vi.mocked(api.setApiKey).mockResolvedValue();

    render(<SettingsModal />);

    await waitFor(() => {
      expect(screen.getByText('Current saved key: sk-a...1234')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Clear Saved Key' }));

    await waitFor(() => {
      expect(api.setApiKey).toHaveBeenCalledWith('');
    });
  });
});

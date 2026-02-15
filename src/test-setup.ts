import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Tauri's invoke function
// This will be overridden in individual tests with specific return values
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn((cmd: string, args?: any) => {
    console.warn(`Unmocked Tauri command: ${cmd}`, args);
    return Promise.resolve(null);
  }),
}));

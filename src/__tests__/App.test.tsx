import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

import { Dashboard } from '../pages/Dashboard';

// Mock AuthContext
vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: null,
      login: vi.fn(),
      logout: vi.fn()
    })
  };
});

describe('Dashboard (Unauthenticated)', () => {
  it('renders sign in prompt when no user is logged in', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    expect(screen.getByText(/Transform your idea into a/i)).toBeDefined();
    expect(screen.getByText(/Sign In to Start Forging/i)).toBeDefined();
  });
});

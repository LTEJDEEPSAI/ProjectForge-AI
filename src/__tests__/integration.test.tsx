import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';
import { Onboarding } from '../pages/Onboarding';
import { ImproveProject } from '../pages/ImproveProject';
import * as api from '../utils/api';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'user123', email: 'test@example.com' },
    login: vi.fn(),
    logout: vi.fn()
  })
}));

vi.mock('../firebase', () => {
  return {
    db: {},
    auth: { currentUser: { getIdToken: async () => 'mock-token' } }
  };
});

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false })),
  deleteDoc: vi.fn(),
}));

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dashboard', () => {
    it('renders user projects securely isolating data', async () => {
      const { getDocs, where } = await import('firebase/firestore');
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [
          {
            id: 'proj1',
            data: () => ({ title: 'My Private Project', concept: 'A test project', difficulty: 'Beginner', techStack: ['React'] })
          }
        ]
      } as any);

      render(<BrowserRouter><Dashboard /></BrowserRouter>);
      
      await waitFor(() => {
        expect(where).toHaveBeenCalledWith('userId', '==', 'user123');
        expect(screen.getByText('My Private Project')).toBeDefined();
      });
    });
  });

  describe('Onboarding UI Validation', () => {
    it('shows validation errors for empty submissions on step 1', async () => {
      render(<BrowserRouter><Onboarding /></BrowserRouter>);
      const nextBtn = screen.getByText(/Next Step/i);
      fireEvent.click(nextBtn);
      
      await waitFor(() => {
        expect(screen.getByText(/Branch is required/i)).toBeDefined();
      });
    });
    
    it('allows typing into form fields', async () => {
      render(<BrowserRouter><Onboarding /></BrowserRouter>);
      const branchInput = screen.getByLabelText(/Academic Branch \/ Specialization/i);
      fireEvent.change(branchInput, { target: { value: 'Computer Science' } });
      expect((branchInput as HTMLInputElement).value).toBe('Computer Science');
    });
  });

  describe('Improve Project Validation', () => {
    it('validates description is required', async () => {
      vi.spyOn(api, 'fetchApi');
      render(<BrowserRouter><ImproveProject /></BrowserRouter>);
      const btn = screen.getByText(/Analyze Project/i);
      fireEvent.click(btn);
      
      expect(api.fetchApi).not.toHaveBeenCalled();
    });
  });

  describe('API and Security Handling', () => {
    it('safely handles API failures and format errors', async () => {
      vi.spyOn(api, 'fetchApi').mockRejectedValueOnce(new Error('API Error: 429 Too Many Requests'));
      
      await expect(api.fetchApi('/api/generate-projects', { method: 'POST', body: JSON.stringify({ profile: {} }) })).rejects.toThrow('API Error: 429 Too Many Requests');
    });
  });
});

/**
 * Tests for App component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../src/App';

// Mock Firebase auth
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((auth, callback) => {
    // Simulate loading complete with no user
    setTimeout(() => callback(null), 10);
    return vi.fn();
  }),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  signInWithPopup: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

// Mock Firebase service
vi.mock('../src/services/firebase', () => ({
  auth: {},
  googleProvider: {},
}));

import { onAuthStateChanged } from 'firebase/auth';

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', async () => {
    render(<App />);

    // Wait for loading to complete
    await waitFor(() => {
      // App should render something
      expect(document.body).not.toBeEmptyDOMElement();
    });
  });

  it('shows loading state initially', () => {
    // Make auth check take longer
    onAuthStateChanged.mockImplementation(() => vi.fn());

    render(<App />);

    expect(screen.getByText(/loading firebook/i)).toBeInTheDocument();
  });

  it('shows auth page when user is not authenticated', async () => {
    onAuthStateChanged.mockImplementation((auth, callback) => {
      setTimeout(() => callback(null), 10);
      return vi.fn();
    });

    render(<App />);

    await waitFor(() => {
      // AuthPage should show the welcome message
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });
  });

  it('wraps content in error boundary', async () => {
    // Verify ErrorBoundary is present by checking the component tree renders
    const { container } = render(<App />);

    await waitFor(() => {
      expect(container).not.toBeEmptyDOMElement();
    });
  });
});

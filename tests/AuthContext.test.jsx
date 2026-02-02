/**
 * Tests for AuthContext
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

// Mock Firebase auth
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((auth, callback) => {
    // Simulate async auth check
    setTimeout(() => callback(null), 0);
    return vi.fn(); // unsubscribe function
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

// Import mocked functions for assertions
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AuthProvider', () => {
    it('renders children', async () => {
      render(
        <AuthProvider>
          <div>Child content</div>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Child content')).toBeInTheDocument();
      });
    });

    it('starts with loading state true', () => {
      // Override mock to not call callback immediately
      onAuthStateChanged.mockImplementation(() => vi.fn());

      const TestComponent = () => {
        const { loading } = useAuth();
        return <div>{loading ? 'Loading' : 'Not loading'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByText('Loading')).toBeInTheDocument();
    });

    it('sets loading to false after auth state check', async () => {
      onAuthStateChanged.mockImplementation((auth, callback) => {
        setTimeout(() => callback(null), 10);
        return vi.fn();
      });

      const TestComponent = () => {
        const { loading } = useAuth();
        return <div>{loading ? 'Loading' : 'Not loading'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Not loading')).toBeInTheDocument();
      });
    });

    it('provides user when authenticated', async () => {
      const mockUser = { email: 'test@example.com', uid: '123' };
      onAuthStateChanged.mockImplementation((auth, callback) => {
        setTimeout(() => callback(mockUser), 10);
        return vi.fn();
      });

      const TestComponent = () => {
        const { user, loading } = useAuth();
        if (loading) return <div>Loading</div>;
        return <div>{user ? user.email : 'No user'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
      });
    });
  });

  describe('useAuth hook', () => {
    it('returns empty context when used outside AuthProvider', () => {
      // Note: The current implementation returns {} (default context value)
      // rather than throwing, so we test the actual behavior
      const TestComponent = () => {
        const auth = useAuth();
        return <div data-testid="has-user">{auth.user ? 'yes' : 'no'}</div>;
      };

      render(<TestComponent />);

      // Context returns empty object, so user is undefined
      expect(screen.getByTestId('has-user')).toHaveTextContent('no');
    });

    it('provides signIn function', async () => {
      signInWithEmailAndPassword.mockResolvedValue({ user: { email: 'test@example.com' } });
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return vi.fn();
      });

      const TestComponent = () => {
        const { signIn } = useAuth();
        return (
          <button onClick={() => signIn('test@example.com', 'password')}>
            Sign In
          </button>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        screen.getByText('Sign In').click();
      });

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password'
      );
    });

    it('provides signUp function', async () => {
      createUserWithEmailAndPassword.mockResolvedValue({ user: { email: 'new@example.com' } });
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return vi.fn();
      });

      const TestComponent = () => {
        const { signUp } = useAuth();
        return (
          <button onClick={() => signUp('new@example.com', 'password')}>
            Sign Up
          </button>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        screen.getByText('Sign Up').click();
      });

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'new@example.com',
        'password'
      );
    });

    it('provides signOut function', async () => {
      signOut.mockResolvedValue();
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback({ email: 'test@example.com' });
        return vi.fn();
      });

      const TestComponent = () => {
        const { signOut: handleSignOut } = useAuth();
        return <button onClick={handleSignOut}>Sign Out</button>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        screen.getByText('Sign Out').click();
      });

      expect(signOut).toHaveBeenCalled();
    });

    it('sets error on signIn failure', async () => {
      const errorMessage = 'Invalid credentials';
      signInWithEmailAndPassword.mockRejectedValue(new Error(errorMessage));
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return vi.fn();
      });

      const TestComponent = () => {
        const { signIn, error } = useAuth();
        return (
          <div>
            <button onClick={() => signIn('test@example.com', 'wrong').catch(() => {})}>
              Sign In
            </button>
            {error && <div data-testid="error">{error}</div>}
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        screen.getByText('Sign In').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
      });
    });

    it('provides clearError function', async () => {
      signInWithEmailAndPassword.mockRejectedValue(new Error('Error'));
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return vi.fn();
      });

      const TestComponent = () => {
        const { signIn, error, clearError } = useAuth();
        return (
          <div>
            <button onClick={() => signIn('test@example.com', 'wrong').catch(() => {})}>
              Sign In
            </button>
            <button onClick={clearError}>Clear Error</button>
            {error && <div data-testid="error">{error}</div>}
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Trigger error
      await act(async () => {
        screen.getByText('Sign In').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      // Clear error
      await act(async () => {
        screen.getByText('Clear Error').click();
      });

      expect(screen.queryByTestId('error')).not.toBeInTheDocument();
    });

    it('provides sendPasswordResetEmail function', async () => {
      sendPasswordResetEmail.mockResolvedValue();
      onAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return vi.fn();
      });

      const TestComponent = () => {
        const { sendPasswordResetEmail: resetPassword } = useAuth();
        return (
          <button onClick={() => resetPassword('test@example.com')}>
            Reset Password
          </button>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        screen.getByText('Reset Password').click();
      });

      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com'
      );
    });
  });
});

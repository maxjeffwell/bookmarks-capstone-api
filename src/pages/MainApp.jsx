import React from 'react';
import { useAuth } from '../context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';
import AuthPage from './AuthPage';
import BookmarksPage from './BookmarksPage';

function MainApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-white text-xl font-medium">Loading FireBook...</p>
        </div>
      </div>
    );
  }

  return user ? (
    <ErrorBoundary>
      <BookmarksPage />
    </ErrorBoundary>
  ) : (
    <ErrorBoundary>
      <AuthPage />
    </ErrorBoundary>
  );
}

export default MainApp;

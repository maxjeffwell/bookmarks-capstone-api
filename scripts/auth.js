window.auth = (function() {
  'use strict';

  let currentUser = null;
  let authStateListeners = [];

  // Initialize Firebase Auth
  const initialize = function() {
    const authInstance = firebase.auth();

    // Set up persistence
    authInstance.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
      .catch(error => {
        console.error('Error setting persistence:', error);
      });

    // Listen for auth state changes
    authInstance.onAuthStateChanged(user => {
      currentUser = user;
      console.log('Auth state changed:', user ? user.email : 'No user');

      // Notify all listeners
      authStateListeners.forEach(listener => listener(user));
    });

    return authInstance;
  };

  // Sign in with email and password
  const signInWithEmail = function(email, password) {
    return firebase.auth().signInWithEmailAndPassword(email, password)
      .then(userCredential => {
        console.log('Signed in successfully:', userCredential.user.email);
        return userCredential.user;
      })
      .catch(error => {
        console.error('Sign in error:', error);
        throw new Error(getErrorMessage(error.code));
      });
  };

  // Sign up with email and password
  const signUpWithEmail = function(email, password) {
    return firebase.auth().createUserWithEmailAndPassword(email, password)
      .then(userCredential => {
        console.log('Account created successfully:', userCredential.user.email);
        return userCredential.user;
      })
      .catch(error => {
        console.error('Sign up error:', error);
        throw new Error(getErrorMessage(error.code));
      });
  };

  // Sign in with Google
  const signInWithGoogle = function() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return firebase.auth().signInWithPopup(provider)
      .then(result => {
        console.log('Signed in with Google:', result.user.email);
        return result.user;
      })
      .catch(error => {
        console.error('Google sign in error:', error);
        throw new Error(getErrorMessage(error.code));
      });
  };

  // Sign out
  const signOut = function() {
    return firebase.auth().signOut()
      .then(() => {
        console.log('Signed out successfully');
      })
      .catch(error => {
        console.error('Sign out error:', error);
        throw new Error('Failed to sign out');
      });
  };

  // Get current user
  const getCurrentUser = function() {
    return currentUser;
  };

  // Check if user is signed in
  const isSignedIn = function() {
    return currentUser !== null;
  };

  // Get user ID for database paths
  const getUserId = function() {
    return currentUser ? currentUser.uid : null;
  };

  // Add auth state listener
  const onAuthStateChanged = function(callback) {
    authStateListeners.push(callback);
    // Call immediately with current state
    callback(currentUser);

    // Return unsubscribe function
    return function() {
      authStateListeners = authStateListeners.filter(listener => listener !== callback);
    };
  };

  // Password reset
  const sendPasswordResetEmail = function(email) {
    return firebase.auth().sendPasswordResetEmail(email)
      .then(() => {
        console.log('Password reset email sent');
      })
      .catch(error => {
        console.error('Password reset error:', error);
        throw new Error(getErrorMessage(error.code));
      });
  };

  // Helper to get user-friendly error messages
  const getErrorMessage = function(errorCode) {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please sign in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled. Please contact support.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please sign up instead.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/popup-blocked':
        return 'Sign-in popup was blocked. Please allow popups for this site.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in was cancelled.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  return {
    initialize,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    getCurrentUser,
    isSignedIn,
    getUserId,
    onAuthStateChanged,
    sendPasswordResetEmail
  };
}());

window.firebaseConfig = (function() {
  'use strict';

  // Firebase configuration object
  // Replace these values with your actual Firebase project configuration
  const config = {
    apiKey: "AIzaSyCVYAWuJoIEqza8m4mmMHLyiTHefm2Tu0g",
    authDomain: "marmoset-c2870.firebaseapp.com",
    projectId: "marmoset-c2870",
    storageBucket: "marmoset-c2870.firebasestorage.app",
    messagingSenderId: "974701944865",
    appId: "1:974701944865:web:a269c4879807d2f4500360",
    measurementId: "G-YYK5EW7H44"
  };

  // Initialize Firebase
  let app = null;
  let db = null;

  const initialize = function() {
    try {
      if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK not loaded. Please check script tags in HTML.');
      }
      app = firebase.initializeApp(config);
      db = firebase.firestore();

      // Enable offline persistence
      db.enablePersistence()
        .catch((err) => {
          if (err.code === 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
          } else if (err.code === 'unimplemented') {
            console.warn('The current browser does not support offline persistence');
          }
        });

      console.log('Firebase initialized successfully');
      return db;
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      throw error;
    }
  };

  // Get Firestore instance
  const getDb = function() {
    if (!db) {
      throw new Error('Firebase not initialized. Call initialize() first.');
    }
    return db;
  };

  // Collection reference helper
  const getCollection = function(collectionName) {
    return getDb().collection(collectionName);
  };

  return {
    initialize,
    getDb,
    getCollection
  };
}());

//# sourceMappingURL=

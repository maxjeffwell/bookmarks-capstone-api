const analyticsTracker = (function() {
  'use strict';

  // Track page views
  const trackPageView = function(page_title, page_location) {
    const analytics = window.firebaseConfig.getAnalytics();
    if (analytics) {
      firebase.analytics().logEvent('page_view', {
        page_title: page_title || document.title,
        page_location: page_location || window.location.href
      });
    }
  };

  // Track bookmark actions
  const trackBookmarkCreated = function() {
    const analytics = window.firebaseConfig.getAnalytics();
    if (analytics) {
      firebase.analytics().logEvent('bookmark_created', {
        event_category: 'bookmark',
        event_label: 'create_bookmark'
      });
    }
  };

  const trackBookmarkDeleted = function() {
    const analytics = window.firebaseConfig.getAnalytics();
    if (analytics) {
      firebase.analytics().logEvent('bookmark_deleted', {
        event_category: 'bookmark',
        event_label: 'delete_bookmark'
      });
    }
  };

  const trackBookmarkExpanded = function() {
    const analytics = window.firebaseConfig.getAnalytics();
    if (analytics) {
      firebase.analytics().logEvent('bookmark_expanded', {
        event_category: 'bookmark',
        event_label: 'expand_bookmark'
      });
    }
  };

  const trackFilterUsed = function(filter_value) {
    const analytics = window.firebaseConfig.getAnalytics();
    if (analytics) {
      firebase.analytics().logEvent('filter_used', {
        event_category: 'filter',
        event_label: 'rating_filter',
        value: filter_value
      });
    }
  };

  // Track user authentication
  const trackUserSignIn = function() {
    const analytics = window.firebaseConfig.getAnalytics();
    if (analytics) {
      firebase.analytics().logEvent('login', {
        method: 'firebase'
      });
    }
  };

  // Initialize analytics tracking
  const initialize = function() {
    // Track initial page view
    trackPageView();
    
    // Set user properties if available
    const analytics = window.firebaseConfig.getAnalytics();
    if (analytics && window.auth && window.auth.getUserId()) {
      firebase.analytics().setUserId(window.auth.getUserId());
    }
  };

  return {
    initialize,
    trackPageView,
    trackBookmarkCreated,
    trackBookmarkDeleted,
    trackBookmarkExpanded,
    trackFilterUsed,
    trackUserSignIn
  };
}());
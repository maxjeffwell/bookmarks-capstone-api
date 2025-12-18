'use strict';

const security = (function() {
  const escapeHtml = function(unsafe) {
    if (typeof unsafe !== 'string') {
      return '';
    }
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const isValidUrl = function(string) {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  };

  const sanitizeUrl = function(url) {
    if (!url || typeof url !== 'string') {
      return '#';
    }
    
    if (isValidUrl(url)) {
      return url;
    }
    
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://' + url;
    }
    
    return '#';
  };

  return {
    escapeHtml,
    isValidUrl,
    sanitizeUrl
  };
}());
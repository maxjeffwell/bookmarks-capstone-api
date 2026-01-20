/**
 * Cloudflare CDN cache purge utility for Firebase Cloud Functions
 * Automatically invalidates cached pages when bookmark data changes
 */

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';
const MAX_URLS_PER_REQUEST = 30; // Cloudflare API limit

// Base URL for the frontend app
const APP_BASE_URL = 'https://firebook-k8s.el-jefe.me';

/**
 * URL patterns to purge for different operations
 * For SPA with React Router, purge HTML shell and route pages
 */
const PURGE_PATTERNS = {
  /**
   * URLs to purge when a bookmark is updated
   * @param {string} bookmarkId - Firebase bookmark ID
   * @returns {string[]} - Array of URLs to purge
   */
  bookmarkUpdate(bookmarkId) {
    return [
      `${APP_BASE_URL}/`,
      `${APP_BASE_URL}/index.html`,
      `${APP_BASE_URL}/bookmarks`,
      `${APP_BASE_URL}/bookmarks/${bookmarkId}`,
    ];
  },

  /**
   * All common entry points for full purge scenarios
   * @returns {string[]} - Array of URLs to purge
   */
  allRoutes() {
    return [
      `${APP_BASE_URL}/`,
      `${APP_BASE_URL}/index.html`,
      `${APP_BASE_URL}/bookmarks`,
      `${APP_BASE_URL}/collections`,
      `${APP_BASE_URL}/search`,
    ];
  },
};

/**
 * Create a Cloudflare cache purge client
 * @param {string} zoneId - Cloudflare Zone ID
 * @param {string} apiToken - Cloudflare API Token with Cache Purge permission
 * @returns {Object} - Cloudflare client with purge methods
 */
function createCloudflareClient(zoneId, apiToken) {
  if (!zoneId || !apiToken) {
    console.log('Cloudflare purge disabled: credentials not configured');
    return createNoopClient();
  }

  return {
    /**
     * Purge specific URLs from Cloudflare cache
     * Batches requests to respect the 30-URL limit per API call
     * @param {string[]} urls - URLs to purge
     * @param {Object} timing - Optional ServerTiming instance
     * @returns {Promise<{success: boolean, purged: number, errors: string[]}>}
     */
    async purgeUrls(urls, timing = null) {
      if (!urls || urls.length === 0) {
        return { success: true, purged: 0, errors: [] };
      }

      const uniqueUrls = [...new Set(urls)];
      const batches = [];

      // Split into batches of MAX_URLS_PER_REQUEST
      for (let i = 0; i < uniqueUrls.length; i += MAX_URLS_PER_REQUEST) {
        batches.push(uniqueUrls.slice(i, i + MAX_URLS_PER_REQUEST));
      }

      console.log(`Cloudflare purge: ${uniqueUrls.length} URLs in ${batches.length} batch(es)`);

      const errors = [];
      let totalPurged = 0;
      const startTime = performance.now();

      for (const batch of batches) {
        try {
          const response = await fetch(
            `${CLOUDFLARE_API_BASE}/zones/${zoneId}/purge_cache`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ files: batch }),
            }
          );

          const data = await response.json();

          if (data.success) {
            totalPurged += batch.length;
            console.log(`Cloudflare purge batch success: ${batch.length} URLs`);
          } else {
            const errorMsg = data.errors?.map(e => e.message).join(', ') || 'Unknown error';
            errors.push(errorMsg);
            console.error('Cloudflare purge batch failed:', errorMsg);
          }
        } catch (err) {
          errors.push(err.message);
          console.error('Cloudflare purge request error:', err.message);
        }
      }

      const duration = performance.now() - startTime;
      if (timing) {
        timing.add('cf-purge', `Cloudflare purge (${totalPurged} URLs)`, duration);
      }

      const success = errors.length === 0;
      if (success) {
        console.log(`Cloudflare purge success: ${totalPurged} URLs in ${duration.toFixed(0)}ms`);
      }

      return { success, purged: totalPurged, errors };
    },

    /**
     * Purge everything in the zone (emergency use only)
     * This is expensive and should be used sparingly
     * @param {Object} timing - Optional ServerTiming instance
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async purgeEverything(timing = null) {
      console.log('Cloudflare purge: PURGING EVERYTHING');
      const startTime = performance.now();

      try {
        const response = await fetch(
          `${CLOUDFLARE_API_BASE}/zones/${zoneId}/purge_cache`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ purge_everything: true }),
          }
        );

        const data = await response.json();
        const duration = performance.now() - startTime;

        if (timing) {
          timing.add('cf-purge-all', 'Cloudflare purge everything', duration);
        }

        if (data.success) {
          console.log(`Cloudflare purge everything success in ${duration.toFixed(0)}ms`);
          return { success: true };
        } else {
          const error = data.errors?.map(e => e.message).join(', ') || 'Unknown error';
          console.error('Cloudflare purge everything failed:', error);
          return { success: false, error };
        }
      } catch (err) {
        console.error('Cloudflare purge everything error:', err.message);
        return { success: false, error: err.message };
      }
    },

    /**
     * Purge URLs for a bookmark update
     * Convenience method that uses PURGE_PATTERNS.bookmarkUpdate
     * @param {string} bookmarkId - The bookmark ID that was updated
     * @param {Object} timing - Optional ServerTiming instance
     * @returns {Promise<{success: boolean, purged: number, errors: string[]}>}
     */
    async purgeBookmark(bookmarkId, timing = null) {
      const urls = PURGE_PATTERNS.bookmarkUpdate(bookmarkId);
      return this.purgeUrls(urls, timing);
    },
  };
}

/**
 * No-op client for when Cloudflare is disabled
 * All methods succeed silently
 */
function createNoopClient() {
  return {
    async purgeUrls() {
      return { success: true, purged: 0, errors: [] };
    },
    async purgeEverything() {
      return { success: true };
    },
    async purgeBookmark() {
      return { success: true, purged: 0, errors: [] };
    },
  };
}

module.exports = {
  createCloudflareClient,
  PURGE_PATTERNS,
  APP_BASE_URL,
};

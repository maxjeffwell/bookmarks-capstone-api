/**
 * Upstash Redis caching utility for Firebase Cloud Functions
 * Uses REST API for serverless-friendly connections
 */

const CACHE_PREFIX = 'firebook:';

// Default TTLs in seconds
const TTL = {
  METADATA: 86400,      // 24 hours - URL metadata rarely changes
  EMBEDDING: 604800,    // 7 days - embeddings are deterministic
  AI_TAGS: 86400,       // 24 hours - AI-generated tags
  AI_DESCRIPTION: 86400, // 24 hours - AI-generated descriptions
  SIMILAR: 3600,        // 1 hour - similarity results change as bookmarks added
};

// Cache key generators
const CACHE_KEYS = {
  metadata: (url) => `${CACHE_PREFIX}meta:${hashUrl(url)}`,
  embedding: (text) => `${CACHE_PREFIX}embed:${hashText(text)}`,
  aiTags: (title, url) => `${CACHE_PREFIX}tags:${hashText(title + url)}`,
  aiDescription: (title, url) => `${CACHE_PREFIX}desc:${hashText(title + url)}`,
  similar: (bookmarkId, threshold) => `${CACHE_PREFIX}similar:${bookmarkId}:${threshold}`,
};

/**
 * Simple hash function for cache keys
 * Uses djb2 algorithm for fast, reasonable distribution
 */
function hashText(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return Math.abs(hash).toString(36);
}

function hashUrl(url) {
  // Normalize URL before hashing
  try {
    const parsed = new URL(url);
    const normalized = `${parsed.host}${parsed.pathname}`.toLowerCase();
    return hashText(normalized);
  } catch {
    return hashText(url);
  }
}

/**
 * Create a cache client using Upstash REST API
 * @param {string} restUrl - Upstash REST URL
 * @param {string} restToken - Upstash REST Token
 */
function createCacheClient(restUrl, restToken) {
  if (!restUrl || !restToken) {
    console.log('Cache disabled: Upstash credentials not configured');
    return createNoopClient();
  }

  return {
    async get(key) {
      try {
        const response = await fetch(`${restUrl}/get/${key}`, {
          headers: { Authorization: `Bearer ${restToken}` },
        });
        const data = await response.json();
        if (data.result) {
          const parsed = JSON.parse(data.result);
          // Handle old corrupted format where value was wrapped in {value, ex}
          if (parsed && typeof parsed === 'object' && 'value' in parsed && 'ex' in parsed) {
            console.log('Cache: migrating old format for key:', key);
            return JSON.parse(parsed.value);
          }
          return parsed;
        }
        return null;
      } catch (err) {
        console.error('Cache get error:', err.message);
        return null;
      }
    },

    async set(key, value, ttlSeconds) {
      try {
        // Use Upstash REST API pipeline format for SET with EX
        const response = await fetch(`${restUrl}/pipeline`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${restToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([
            ['SET', key, JSON.stringify(value), 'EX', ttlSeconds.toString()]
          ]),
        });
        return response.ok;
      } catch (err) {
        console.error('Cache set error:', err.message);
        return false;
      }
    },

    async del(key) {
      try {
        const response = await fetch(`${restUrl}/del/${key}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${restToken}` },
        });
        return response.ok;
      } catch (err) {
        console.error('Cache del error:', err.message);
        return false;
      }
    },

    async setex(key, ttlSeconds, value) {
      return this.set(key, value, ttlSeconds);
    },
  };
}

/**
 * No-op client for when cache is disabled
 */
function createNoopClient() {
  return {
    async get() { return null; },
    async set() { return false; },
    async del() { return false; },
    async setex() { return false; },
  };
}

module.exports = {
  createCacheClient,
  CACHE_KEYS,
  TTL,
  hashText,
  hashUrl,
};

/**
 * Server-Timing utility for Firebase Cloud Functions
 * Tracks operation durations and generates Server-Timing header values
 */

class ServerTiming {
  constructor() {
    this.timings = [];
    this.startTime = performance.now();
  }

  /**
   * Time an async operation
   * @param {string} name - Metric name (e.g., 'firestore', 'ai-gateway')
   * @param {string} description - Human-readable description
   * @param {Function} fn - Async function to time
   * @returns {Promise<any>} - Result of the function
   */
  async time(name, description, fn) {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.timings.push({ name, description, duration, hit: true });
      return result;
    } catch (err) {
      const duration = performance.now() - start;
      this.timings.push({ name, description, duration, hit: false, error: true });
      throw err;
    }
  }

  /**
   * Add a cache hit/miss marker
   * @param {string} name - Cache name
   * @param {boolean} hit - Whether cache was hit
   */
  cacheStatus(name, hit) {
    this.timings.push({
      name: `${name}-${hit ? 'hit' : 'miss'}`,
      description: hit ? 'Cache hit' : 'Cache miss',
      duration: 0,
    });
  }

  /**
   * Add a manual timing entry
   * @param {string} name - Metric name
   * @param {string} description - Description
   * @param {number} duration - Duration in ms
   */
  add(name, description, duration) {
    this.timings.push({ name, description, duration });
  }

  /**
   * Get total elapsed time since creation
   * @returns {number} - Total time in ms
   */
  total() {
    return performance.now() - this.startTime;
  }

  /**
   * Generate Server-Timing header value
   * @returns {string} - Formatted Server-Timing header
   */
  toString() {
    const parts = this.timings.map(t => {
      if (t.duration === 0) {
        // Status marker without duration
        return `${t.name};desc="${t.description}"`;
      }
      return `${t.name};dur=${t.duration.toFixed(2)};desc="${t.description}"`;
    });

    // Add total time
    parts.push(`total;dur=${this.total().toFixed(2)}`);

    return parts.join(', ');
  }

  /**
   * Get timings as an object (for logging/response body)
   * @returns {Object} - Timing data
   */
  toJSON() {
    return {
      timings: this.timings.map(t => ({
        name: t.name,
        description: t.description,
        duration: Math.round(t.duration * 100) / 100,
        ...(t.error && { error: true }),
      })),
      total: Math.round(this.total() * 100) / 100,
    };
  }
}

/**
 * Create a new ServerTiming instance
 * @returns {ServerTiming}
 */
function createTiming() {
  return new ServerTiming();
}

module.exports = {
  ServerTiming,
  createTiming,
};

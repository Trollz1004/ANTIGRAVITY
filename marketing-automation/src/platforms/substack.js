/**
 * Substack Platform Handler
 * Note: No public API - requires manual posting or email
 */

class SubstackHandler {
  authenticate() {
    return this;
  }

  async post(content) {
    console.warn('Substack requires manual posting via their editor');
    return {
      note: 'Post manually at your Substack publication',
      content: content // Store for manual posting
    };
  }

  async getAnalytics() {
    return { note: 'Use Substack dashboard for analytics' };
  }
}

module.exports = new SubstackHandler();

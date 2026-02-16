/**
 * Indie Hackers Platform Handler
 * Note: No public API - requires browser automation
 */

class IndieHackersHandler {
  authenticate() {
    return this;
  }

  async post(content) {
    console.warn('IndieHackers requires manual posting');
    return {
      note: 'Post manually at https://indiehackers.com',
      url: 'https://indiehackers.com'
    };
  }

  async getAnalytics() {
    return { note: 'Manual tracking required' };
  }
}

module.exports = new IndieHackersHandler();

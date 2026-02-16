/**
 * Marketing Engine - Cross-Platform Analytics
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

const DATA_FILE = path.join(__dirname, '..', 'data', 'analytics.json');

class Analytics {
  constructor() {
    this.data = { posts: [], metrics: {} };
  }

  async load() {
    try {
      const content = await fs.readFile(DATA_FILE, 'utf8');
      this.data = JSON.parse(content);
    } catch {
      this.data = { posts: [], metrics: {} };
    }
  }

  async save() {
    const dir = path.dirname(DATA_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(this.data, null, 2));
  }

  async trackPost(postData) {
    await this.load();

    this.data.posts.push({
      ...postData,
      trackedAt: new Date().toISOString(),
    });

    await this.save();
  }

  async updateMetrics(platform, metrics) {
    await this.load();

    if (!this.data.metrics[platform]) {
      this.data.metrics[platform] = [];
    }

    this.data.metrics[platform].push({
      ...metrics,
      recordedAt: new Date().toISOString(),
    });

    await this.save();
  }

  async getReport(days = 7) {
    await this.load();

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const recentPosts = this.data.posts.filter(
      p => new Date(p.trackedAt) > cutoff
    );

    const byPlatform = {};
    recentPosts.forEach(post => {
      if (!byPlatform[post.platform]) {
        byPlatform[post.platform] = { count: 0, engagement: 0 };
      }
      byPlatform[post.platform].count += 1;
      byPlatform[post.platform].engagement += post.engagement || 0;
    });

    return {
      period: `${days} days`,
      totalPosts: recentPosts.length,
      byPlatform,
      generatedAt: new Date().toISOString(),
    };
  }
}

module.exports = new Analytics();

/**
 * Hashnode Platform Handler
 * Opus Platform - Production Grade
 */

const axios = require('axios');
const BasePlatformHandler = require('../utils/base-handler');
const logger = require('../logger');

class HashnodeHandler extends BasePlatformHandler {
  constructor() {
    super('hashnode', ['HASHNODE_TOKEN', 'HASHNODE_PUBLICATION_ID']);
    this.apiKey = process.env.HASHNODE_TOKEN;
    this.publicationId = process.env.HASHNODE_PUBLICATION_ID;
    this.apiUrl = 'https://gql.hashnode.com';
  }

  async authenticate() {
    logger.info('Hashnode: Verifying credentials...');

    const response = await axios.post(
      this.apiUrl,
      {
        query: `query { me { id username name } }`
      },
      {
        ...this.getAxiosConfig({
          'Authorization': this.apiKey,
          'Content-Type': 'application/json'
        })
      }
    );

    const user = response.data?.data?.me;
    if (!user?.id) {
      throw new Error('Failed to verify Hashnode credentials');
    }

    logger.info(`Hashnode: Authenticated as @${user.username}`);
    this.authenticated = true;
    this.userId = user.id;
    return this;
  }

  async _post(content, options = {}) {
    const { title = 'New Post', tags = ['programming'] } = options;

    const response = await axios.post(
      this.apiUrl,
      {
        query: `
          mutation PublishPost($input: PublishPostInput!) {
            publishPost(input: $input) {
              post {
                id
                slug
                url
                title
              }
            }
          }
        `,
        variables: {
          input: {
            title,
            contentMarkdown: content,
            publicationId: this.publicationId,
            tags: tags.map(tag => ({ slug: tag.toLowerCase().replace(/\s+/g, '-') }))
          }
        }
      },
      {
        ...this.getAxiosConfig({
          'Authorization': this.apiKey,
          'Content-Type': 'application/json'
        })
      }
    );

    const post = response.data?.data?.publishPost?.post;
    if (!post?.id) {
      const errors = response.data?.errors;
      throw new Error(errors?.[0]?.message || 'Hashnode publish failed');
    }

    const result = {
      id: post.id,
      url: post.url,
      slug: post.slug,
      platform: this.platform
    };

    logger.info('Hashnode: Posted successfully', { id: result.id, url: result.url });
    return result;
  }

  async _getAnalytics(postId) {
    return {
      note: 'Hashnode analytics available via dashboard',
      postId
    };
  }
}

module.exports = new HashnodeHandler();

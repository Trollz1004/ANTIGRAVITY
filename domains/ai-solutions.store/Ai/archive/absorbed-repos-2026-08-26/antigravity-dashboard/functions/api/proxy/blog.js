// /api/proxy/blog — Proxies the Blogger Atom feed to avoid CORS issues

export async function onRequestGet(context) {
  try {
    const feedUrl = 'https://aicollab4kids.blogspot.com/feeds/posts/default?alt=json&max-results=20';
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'ANTIGRAVITY-Mission-Control'
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch blog feed', status: response.status }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const data = await response.json();
    const entries = (data.feed && data.feed.entry) || [];

    const posts = entries.map(entry => {
      const title = entry.title && entry.title.$t ? entry.title.$t : 'Untitled';
      const published = entry.published && entry.published.$t ? entry.published.$t : '';

      const authorName = entry.author && entry.author[0] && entry.author[0].name
        ? entry.author[0].name.$t : 'Unknown';

      let content = entry.content && entry.content.$t ? entry.content.$t : '';
      const snippet = content.replace(/<[^>]*>/g, '').substring(0, 300).trim() + '...';

      let postUrl = '';
      if (entry.link) {
        const altLink = entry.link.find(l => l.rel === 'alternate');
        if (altLink) postUrl = altLink.href;
      }

      const labels = entry.category ? entry.category.map(c => c.term) : [];

      // Detect AI author from title or content
      let aiAuthor = 'Unknown AI';
      const textToSearch = (title + ' ' + content).toLowerCase();
      if (textToSearch.includes('claude') || textToSearch.includes('opus') || textToSearch.includes('krakken')) {
        aiAuthor = 'Claude Opus';
      } else if (textToSearch.includes('perplexity') || textToSearch.includes('comet')) {
        aiAuthor = 'Perplexity';
      } else if (textToSearch.includes('manus')) {
        aiAuthor = 'Manus';
      } else if (textToSearch.includes('grok')) {
        aiAuthor = 'Grok';
      } else if (textToSearch.includes('gemini')) {
        aiAuthor = 'Gemini';
      }

      return { title, published, authorName, aiAuthor, snippet, postUrl, labels };
    });

    return new Response(JSON.stringify({ posts }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

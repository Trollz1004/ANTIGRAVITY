// /api/proxy/commits — Proxies GitHub commits for Trollz1004/ANTIGRAVITY

export async function onRequestGet(context) {
  try {
    const response = await fetch(
      'https://api.github.com/repos/Trollz1004/ANTIGRAVITY/commits?per_page=10',
      {
        headers: {
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'ANTIGRAVITY-Mission-Control'
        }
      }
    );

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch commits', status: response.status }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const commits = await response.json();

    const simplified = commits.map(c => ({
      sha: c.sha ? c.sha.substring(0, 7) : 'unknown',
      fullSha: c.sha,
      message: c.commit ? c.commit.message : '',
      date: c.commit && c.commit.author ? c.commit.author.date : '',
      author: c.commit && c.commit.author ? c.commit.author.name : 'Unknown',
      url: c.html_url || ''
    }));

    return new Response(JSON.stringify({ commits: simplified }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=120'
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

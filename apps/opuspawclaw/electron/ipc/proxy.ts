export async function verifyWithJules(code: string) {
  // Use import.meta.env for Vite compatibility in the web preview
  const JULES_API_URL = (import.meta as any).env?.VITE_JULES_API_URL || process.env.VITE_JULES_API_URL || 'https://api.aidoesitall.website/v1/jules-scan';
  const JULES_API_KEY = (import.meta as any).env?.VITE_JULES_API_KEY || process.env.VITE_JULES_API_KEY || 'mock_key';

  try {
    const response = await fetch(JULES_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JULES_API_KEY}`
      },
      body: JSON.stringify({ code })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Jules API error:', error);
    throw error;
  }
}

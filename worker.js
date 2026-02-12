/**
 * Spy Movies & TV - Seen List Sync API
 * Cloudflare Worker + KV
 *
 * === SETUP INSTRUCTIONS ===
 *
 * 1. Go to Cloudflare Dashboard → Workers & Pages → KV
 * 2. Create a KV namespace called "SPY_MOVIES_SEEN"
 * 3. Go to Workers & Pages → Create Application → Create Worker
 * 4. Name it "spy-movies-api"
 * 5. Paste this code into the worker editor
 * 6. Go to Settings → Variables → KV Namespace Bindings
 *    - Variable name: SEEN_KV
 *    - KV Namespace: SPY_MOVIES_SEEN
 * 7. Deploy!
 *
 * The worker will be available at: https://spy-movies-api.belk714.workers.dev
 *
 * === API ===
 *
 * GET  /seen?user=default        → returns JSON array of seen movie IDs
 * PUT  /seen?user=default        → saves JSON array of seen movie IDs
 *
 * All write requests require header: X-Pin: 7714
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Pin',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname !== '/seen') {
      return new Response('Not found', { status: 404, headers: corsHeaders });
    }

    const user = url.searchParams.get('user') || 'default';
    const key = `seen:${user}`;

    if (request.method === 'GET') {
      const data = await env.SEEN_KV.get(key);
      return new Response(data || '[]', {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (request.method === 'PUT') {
      const pin = request.headers.get('X-Pin');
      if (pin !== '7714') {
        return new Response(JSON.stringify({ error: 'Invalid PIN' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const body = await request.json();
      if (!Array.isArray(body)) {
        return new Response(JSON.stringify({ error: 'Body must be a JSON array' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      await env.SEEN_KV.put(key, JSON.stringify(body));
      return new Response(JSON.stringify({ ok: true, count: body.length }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  },
};

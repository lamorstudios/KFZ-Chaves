/**
 * bot-block.js – Netlify Edge Function
 * Blockiert bekannte Bot-Query-Parameter bevor index.html ausgeliefert wird.
 *
 * Ziel: Bandwidth sparen durch frühes Abfangen von:
 *   - ?page_id=...   (WordPress-typischer Bot/Scanner-Traffic)
 *   - ?ai1ec=...     (AI1EC Event Calendar Bot-Traffic)
 *
 * Echte Besucher nutzen diese Parameter nie.
 * Alle anderen Requests laufen unverändert durch.
 */

export default async (request) => {
  const url = new URL(request.url);

  if (
    url.searchParams.has('page_id') ||
    url.searchParams.has('ai1ec')
  ) {
    return new Response('Not found.', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  // Alle anderen Requests: unverändert weiterleiten
};

export const config = {
  path: '/*',
};

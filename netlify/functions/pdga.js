// Arena: PDGA rating lookup. GET /.netlify/functions/pdga?num=221281
// Reads the public player page at pdga.com and returns name, rating, rating date, classification, status.
exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=21600', 'Access-Control-Allow-Origin': '*' };
  const num = String((event.queryStringParameters || {}).num || '').replace(/\D/g, '');
  if (!num) return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Enter a PDGA number.' }) };
  try {
    const res = await fetch('https://www.pdga.com/player/' + num, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.pdga.com/',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'follow',
    });
    if (res.status === 404) return { statusCode: 404, headers, body: JSON.stringify({ ok: false, error: 'No PDGA player with that number.' }) };
    if (res.status === 403) return { statusCode: 502, headers, body: JSON.stringify({ ok: false, code: 'blocked', error: 'The PDGA site blocked the automatic lookup.' }) };
    if (!res.ok) return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: 'PDGA returned ' + res.status + '.' }) };
    const html = await res.text();
    const strip = (x) => (x || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
    const pick = (re) => { const m = html.match(re); return m ? strip(m[1]) : null; };
    // Name: page title is "First Last #12345 | Professional Disc Golf Association"
    let name = pick(/<title>([^<|#]+?)\s*#\d+/i) || pick(/<h1[^>]*>([^<]+?)\s*#\d+/i) || pick(/<h1[^>]*>([^<]+)<\/h1>/i);
    // Rating: <li class="current-rating">Current Rating: <strong>1004</strong> <small class="rating-date">(as of 07-Jun-2024)</small></li>
    const ratingBlock = (html.match(/class="[^"]*current-rating[^"]*"[^>]*>([\s\S]*?)<\/li>/i) || [])[1] || '';
    const rating = (() => { const m = strip(ratingBlock).match(/Current Rating:\s*(\d{3,4})/i) || html.match(/Current Rating:?\s*(?:<[^>]+>\s*)*(\d{3,4})/i); return m ? parseInt(m[1], 10) : null; })();
    const ratingDate = (() => { const m = strip(ratingBlock).match(/as of\s+([0-9]{1,2}-[A-Za-z]{3}-[0-9]{4})/i); return m ? m[1] : null; })();
    const classification = pick(/class="[^"]*classification[^"]*"[^>]*>[\s\S]*?Classification:\s*([\s\S]*?)<\/li>/i);
    const status = pick(/class="[^"]*membership-status[^"]*"[^>]*>[\s\S]*?Membership Status:\s*([\s\S]*?)<\/li>/i);
    const location = pick(/class="[^"]*location[^"]*"[^>]*>[\s\S]*?Location:\s*([\s\S]*?)<\/li>/i);
    if (!name && !rating) return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: 'Could not read that PDGA page.' }) };
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, number: num, name, rating, ratingDate, classification, status, location }) };
  } catch (e) {
    return { statusCode: 502, headers, body: JSON.stringify({ ok: false, error: 'Could not reach the PDGA right now.' }) };
  }
};

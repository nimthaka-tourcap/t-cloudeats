const https = require('https');

const finalUrls = [
  'https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2pBeUxUSktjeTFLUW01VlZuRXpXVzF2YW5NMGMzYxAB!2m1!1s0x0:0x254afb02a157e1c1!3m1!1s2@1:CAIQACodChtycF9oOjAyLTJKcy1KQm5VVnEzWW1vanM0c3c%7C%7C?hl=en',
  'https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT25kMmFsSjRWSFJUV2xkSlZIRXpURXRKTkV0aVNVRRAB!2m1!1s0x0:0x254afb02a157e1c1!3m1!1s2@1:CAIQACodChtycF9oOnd2alJ4VHRTWldJVHEzTEtJNEtiSUE%7C%7C?hl=en',
  'https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT201cVpreG1iVVF5VkcxYVdIRnFNRE5YTW5SS1VYYxAB!2m1!1s0x0:0x254afb02a157e1c1!3m1!1s2@1:CAIQACodChtycF9oOm5qZkxmbUQyVG1aWHFqMDNXMnRKUXc%7C%7C?hl=en',
  'https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2xKVGVWbEdRbTE2Y0Vac1ExTlBTRGRpVUVWR1dGRRAB!2m1!1s0x0:0x254afb02a157e1c1!3m1!1s2@1:CAIQACodChtycF9oOlJTeVlGQm16cEZsQ1NPSDdiUEVGWFE%7C%7C?hl=en',
  'https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2pocmVVeE9jakZ5TkMxR1VsUmpTRmxyVTBWdU9WRRAB!2m1!1s0x0:0x254afb02a157e1c1!3m1!1s2@1:CAIQACodChtycF9oOjhreUxOcjFyNC1GUlRjSFlrU0VuOVE%7C%7C?hl=en',
  'https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sCi9DQUlRQUNvZENodHljRjlvT2todllqSjBibTE0U3pJd2JUWnVPRGxGUzJ4SWFsRRAB!2m1!1s0x0:0x254afb02a157e1c1!3m1!1s2@1:CAIQACodChtycF9oOkhvYjJ0bm14SzIwbTZuODlFS2xIalE%7C%7C?hl=en'
];

async function fetchReviewData(url, idx) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Extract raw JSON array inside JS payload or meta text
        console.log(`\nReview ${idx + 1}:`);
        const matches = data.match(/\["([A-Z][a-zA-Z\s\.]{2,30})",\s*\[?"(https:\/\/lh3\.googleusercontent\.com\/[^"]+)"/);
        if (matches) {
          console.log('Author:', matches[1]);
        }
        // Extract plain text string sequences that look like review comments
        const textSnippets = Array.from(data.matchAll(/\"([A-Za-z0-9\s,\.!\'\?\-\/]{10,200})\"/g))
          .map(m => m[1])
          .filter(t => !t.includes('http') && !t.includes('google') && !t.includes('Maps') && !t.includes('Window') && !t.includes('Search') && t.length > 20);
        console.log('Text snippets:', textSnippets.slice(0, 5));
        resolve();
      });
    }).on('error', (e) => {
      console.error(e);
      resolve();
    });
  });
}

async function main() {
  for (let i = 0; i < finalUrls.length; i++) {
    await fetchReviewData(finalUrls[i], i);
  }
}

main();

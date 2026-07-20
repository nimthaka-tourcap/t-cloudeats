const fs = require('fs');

const urls = [
  'https://share.google/XfX96zQZ36QWsqjlI',
  'https://share.google/y80WdEtoMV9bRdeFT',
  'https://share.google/eJhWP2tMIsHOp0iTs',
  'https://share.google/Wmb7eUaSzIlG8Y2Ml',
  'https://share.google/KvwuzXIvknEDxGasV',
  'https://share.google/nk2NN7nxO0rI2dhy2'
];

async function run() {
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const html = await res.text();
      const title = html.match(/<title>(.*?)<\/title>/i);
      const ogTitle = html.match(/property="og:title" content="(.*?)"/i);
      const ogDesc = html.match(/property="og:description" content="(.*?)"/i);
      
      console.log('==========================================');
      console.log('URL:', url);
      console.log('Title:', title ? title[1] : 'N/A');
      console.log('OG Title:', ogTitle ? ogTitle[1] : 'N/A');
      console.log('OG Desc:', ogDesc ? ogDesc[1] : 'N/A');

      // Find strings in the HTML payload
      const matches = Array.from(html.matchAll(/"([^"]{15,250})"/g)).map(m => m[1]);
      const reviewSnippets = matches.filter(m => /food|taste|service|delicious|kottu|rice|good|great|place|recommend|clean|fast|staff|best|quality|portion/i.test(m));
      console.log('Review Snippets:', reviewSnippets.slice(0, 5));
    } catch (err) {
      console.error('Error for', url, err.message);
    }
  }
}

run();

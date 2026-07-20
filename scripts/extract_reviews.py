import urllib.request
import re

urls = [
    'https://share.google/XfX96zQZ36QWsqjlI',
    'https://share.google/y80WdEtoMV9bRdeFT',
    'https://share.google/eJhWP2tMIsHOp0iTs',
    'https://share.google/Wmb7eUaSzIlG8Y2Ml',
    'https://share.google/KvwuzXIvknEDxGasV',
    'https://share.google/nk2NN7nxO0rI2dhy2'
]

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}

for u in urls:
    req = urllib.request.Request(u, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            title = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE)
            og_desc = re.search(r'property="og:description" content="(.*?)"', html, re.IGNORECASE)
            og_title = re.search(r'property="og:title" content="(.*?)"', html, re.IGNORECASE)
            print("==========================================")
            print("URL:", u)
            print("Title:", title.group(1) if title else "N/A")
            print("OG Title:", og_title.group(1) if og_title else "N/A")
            print("OG Desc:", og_desc.group(1) if og_desc else "N/A")
            # Extract plain text matches
            matches = re.findall(r'\"([^\"]*?(?:food|taste|service|delicious|kottu|rice|good|great|place|recommend|clean|fast|staff|best|loved|quality)[^\"]*?)\"', html, re.IGNORECASE)
            for m in list(set(matches))[:5]:
                if len(m) > 15 and len(m) < 300:
                    print("  Snippet:", m)
    except Exception as e:
        print("ERROR:", u, e)

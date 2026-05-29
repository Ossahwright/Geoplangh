const https = require('https');
https.get("https://ghanapostgps.com/regions-and-district-codes/", (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => {
    const list = [];
    const regex = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
    let match;
    while(match = regex.exec(data)) {
        list.push(match[0].replace(/<[^>]+>/g, '|').replace(/\s+/g, ' '));
    }
    console.log(list.slice(0, 30).join('\n'));
    console.log("Total rows:", list.length);
  });
});

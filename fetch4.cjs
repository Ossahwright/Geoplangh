const https = require('https');
https.get("https://ghanapostgps.com/regions-and-district-codes/", (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => {
    // Strip tags and print some text
    const text = data.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log(text.substring(text.indexOf("Ashanti Region"), text.indexOf("Ashanti Region") + 5000));
  });
});

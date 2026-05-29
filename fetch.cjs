const http = require('https');
const url = "https://ghanapostgps.com/regions-and-district-codes/";
http.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const matches = data.match(/<tr>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<\/tr>/g);
    if(matches) {
       console.log(matches.slice(0, 10).join("\n"));
       console.log("Total:", matches.length)
    } else {
       console.log("No matches");
       // Try without tr
       const tds = data.match(/<td>(.*?)<\/td>/gi);
       if (tds) {
          console.log("Found tds:", tds.length);
          for(let i=0; i<30; i++) console.log(tds[i]);
       } else {
         console.log(data.substring(0, 1000));
       }
    }
  });
});

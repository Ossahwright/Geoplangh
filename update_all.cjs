const fs = require('fs');

const raw = fs.readFileSync('raw_all.txt', 'utf8').trim().split('\n');
let code = fs.readFileSync('src/lib/ghanaPostDistrictCodes.ts', 'utf8');

let currRegion = '';
const entries = {};

for (const line of raw) {
  const tLine = line.trim();
  if (!tLine) continue;
  
  if (tLine.toLowerCase().endsWith('region')) {
    let caseCapped = tLine.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    currRegion = caseCapped;
  } else {
    // format: Name (CODE)
    const match = tLine.match(/(.+)\((.+)\)/);
    if (match) {
       const districtName = match[1].trim();
       let c = match[2].trim().toUpperCase();
       
       let munName = districtName;
       if (districtName.includes('/')) {
         munName = districtName.split('/')[0].trim();
       }
       
       let displayRegion = currRegion;
       if (currRegion === '') displayRegion = 'Unknown Region';
       
       entries[c] = `  "${c}": { region: "${displayRegion}", district: "${districtName}", municipality: "${munName}" },`;
    }
  }
}

let startIndex = code.indexOf('export const GHANA_POST_DISTRICT_CODES: Record<string, DistrictCodeInfo> = {');
let endIndex = code.indexOf('};', startIndex); // finds the closing brace of the object
if (startIndex !== -1 && endIndex !== -1) {
  let newMapStr = 'export const GHANA_POST_DISTRICT_CODES: Record<string, DistrictCodeInfo> = {\n';
  for (let c of Object.keys(entries).sort()) {
     newMapStr += entries[c] + '\n';
  }
  newMapStr += '\n';
  
  code = code.substring(0, startIndex) + newMapStr + code.substring(endIndex);
}

fs.writeFileSync('src/lib/ghanaPostDistrictCodes.ts', code);
console.log('Codes updated!');

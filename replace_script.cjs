const fs = require('fs');
let code = fs.readFileSync('src/lib/ghanaPostDistrictCodes.ts', 'utf8');
const generated = fs.readFileSync('generated_codes.txt', 'utf8');

// The replacement starts from line 8: 
// export const GHANA_POST_DISTRICT_CODES: Record<string, DistrictCodeInfo> = {
// to the closing brace before export function parseGhanaPostPrefix

const startIndex = code.indexOf('export const GHANA_POST_DISTRICT_CODES: Record<string, DistrictCodeInfo> = {');
const endIndex = code.indexOf('};', startIndex) + 2;

const newCode = code.substring(0, startIndex) + 'export const GHANA_POST_DISTRICT_CODES: Record<string, DistrictCodeInfo> = {\n' + generated + '\n' + code.substring(endIndex);

fs.writeFileSync('src/lib/ghanaPostDistrictCodes.ts', newCode);
console.log('Replaced successfully');

const fs = require('fs');
let code = fs.readFileSync('src/lib/ghanaPostDistrictCodes.ts', 'utf8');

const codes = `Akuapem North (E2)
Akuapem South (E3)
Abuakwa North (E4)
Abuakwa South (E5)
Fanteakwa South (E6)
New Juaben North (E7)
Asene Manso Akroso (E8)
Atiwa East (E9)
Asuogyaman (EA)
Birim Central (EB)
Achiase (EC)
Denkyembour (ED)
Fanteakwa North (EF)
Nsawam Adoagyiri (EG)
Kwahu East (EH)
Kwahu South (EI)
Kwahu West (EJ)
Kwaebibirem (EK)
Lower Manya Krobo (EL)
Akyemansa (EM)
New Juaben South (EN)
Ayensuano (EO)
Kwahu Afram Plains North (EP)
Kwahu Afram Plains South (EQ)
Okere (ER)
Suhum (ES)
Atiwa West (ET)
Upper Manya Krobo (EU)
Upper West Akim (EV)
West Akim (EW)
Birim North (EX)
Yilo Krobo (EY)
Birim South (EZ)`;

const lines = codes.split('\n');
const entries = {};
for (const line of lines) {
  const match = line.match(/(.+)\((.+)\)/);
  if (match) {
     const name = match[1].trim();
     const c = match[2].trim();
     entries[c] = `  "${c}": { region: "Eastern Region", district: "${name}", municipality: "${name}" },`;
  }
}

// Strip out existing Eastern region lines from the dictionary that conflict or just replace the Eastern block
let startIndex = code.indexOf('// Eastern Region');
let endIndex = code.indexOf('// Greater Accra Region', startIndex);
if (startIndex !== -1 && endIndex !== -1) {
  let newEasternBlock = '// Eastern Region\n';
  for (let c in entries) {
    newEasternBlock += entries[c] + '\n';
  }
  newEasternBlock += '\n  ';
  code = code.substring(0, startIndex) + newEasternBlock + code.substring(endIndex);
}

fs.writeFileSync('src/lib/ghanaPostDistrictCodes.ts', code);
console.log('Eastern region updated!');

const text = `Ashanti Region Adansi North | A2 Ahafo Ano South | AY Asante Akim North | AN Atwima Mponua | AI Bosome Freho Ext | A9 Kumasi | AK Obuasi | AO Sekyere Central | AQ Adansi South | A3 Amansie Central | AV Asante Akim South | AA Atwima Nwabiagya | AH Bosomtwe | AT Kumawu | AU Offinso North | A6 Sekyere East | AR Afigya Kwabre | AF Amansie West | AW Asokore Mampong | AS Bekwai | AB Ejisu Juaben | AE Kwabre East | AD Offinso South | A7 Sekyere South | AZ Ahafo Ano North | AX Asante Akim Central | AC Atwima Kwanwoma | AG Bosome Freho | A4 Ejura-Sekyedumase | AJ Mampong | AM Sekyere Afram Plains | AP Brong Ahafo Region Asunafo North | Bu Atebubu-Amantin | BA Dormaa East | BE Kintampo North | BK Pru | BP Sunyani West | BY Techiman | BT Asunafo South | BV Banda | BC Dormaa West | BF Kintampo South | BL Sene East | BG Tain | BZ Techiman North | BX Asutifi North | BQ Berekum | BB Jaman North | BJ Nkoranza North | BN Sene West | BH Tano North | B2 Wenchi | BW Asutifi South | BR Dormaa | BD Jaman South | BI Nkoranza South | BO Sunyani | BS Tano South | B3 Central Region Abura Asebu Kwamankese | CA Asikuma / Odoben / Brakwa | CB Awutu Senya East | CX Gomoa East | CG Twifo Ati-Morkwa | CT Gomoa East | CG Agona East | CP Assin North | CR Cape Coast | CC Twifo/Heman/Lower Denkyira | CH Agona West | CO Assin South | CS Effutu | CE Komenda Edina Eguafo | CK Upper Denkyira East | CU Ajumako Enyan Esiam | CJ Awutu Senya | CW Ekumfi | CF Mfantseman | CM Upper Denkyira West | CV Eastern Region Akuapem North | E2 Atiwa | ET Birim South | EZ Kwaebibirem | EK Kwahu South | EI Nsawam Adoagyiri | EG West Akim | EW Akuapem South | E3 Ayensuano | EO Denkyembour | ED Kwahu Afram Plains North | EP Kwahu West | EJ Suhum | ES Akyemansa | EM Birim Central | EB East Akim | EE Kwahu Afram Plains South | EQ Lower Manya Krobo | EL Upper Manya Krobo | EU Asuogyaman | EA Birim North | EX Fanteakwa | EF Kwahu East | EH New Juaben | EN Upper West Akim | EV Yilo Krobo | EY Greater Accra Region Accra | Ga Ashaiman | GB Ga West | GW Ledzokuku Krowor | GZ Ada East | GY Ga Central | GC Kpone Katamanso | GK Ningo Prampram | GN Ada West | GX Ga East | GE La Dade-Kotopon | GL Shai-Osudoku | GO Adentann | GD Ga South | GS La Nkwantanang-Madina | GM Tema | GT Northern Region Bole | NB East Gonja | N4 Kpandai | NA Nanumba North | NN Sagnerigu | NS Tatale Sangule | NF Yendi | NY Bunkpurugu-Yunyoo | NP East Mamprusi | NE Kumbungu | NK Nanumba South | NO Savelugu-Nanton | NU Tolon | NL Central Gonja | N3 Gushiegu | NG Mamprugu Moaduri | NM North Gonja | N2 Sawla Tuna Kalba | NW West Gonja | N5 Chereponi | NC Karaga | NR Mion | NI Saboba | NX Tamale | NT West Mamprusi | ND Zabzugu | NZ Upper East Region Bawku | UA Bongo | UO Kassena Nankana East | UK Talensi | UT Bawku West | UW Builsa North | UR Kassena Nankana West | UL Binduri | UU Builsa South | US Nabdam | UN Bolgatanga | UB Garu-Tempane | UG Pusiga | UP Upper West Region Daffiama Bussie Issa | XD Nadowli Kaleo | XO Wa | XW Jirapa | XJ Nandom | XN Wa East | XX Lambussie Karni | XK Sissala East | XS Wa West | XY Lawra | XL Sissala West | XT Volta Region Adaklu | VA Akatsi South | VX Ho West | VI Keta | VK Krachi EasT | VR Nkwanta South | VO South Tongu | VE Afadjato South | VF Biakoye | VB Hohoe | VC Ketu North | VY Krachi Nchumuru | VQ North Dayi | VD Agotime Ziope | VG Central Tongu | VV Jasikan | VJ Ketu South | VZ Krachi West | VS North Tongu | VT Akatsi North | VW Ho | VH Kadjebi | VM Kpando | VP Nkwanta North | VN South Dayi | VE Western Region Ahanta West | WH Bibiani/Anhwiaso/Bekwai | WB Juaboso | WQ Sefwi Akontombra | WF Suaman | WU Wassa Amenfi West | WY Aowin | WA Bodi | WO Mpohor | WM Sefwi Wiaso | WG Tarkwa Nsuaem | WT Wassa East | WZ Bia East | WC Ellembelle | WE Nzema East | WN Sekondi-Takoradi | WS Wassa Amenfi Central | WW Bia West | WD Jomoro | WJ Prestea Huni Valley | WP Shama | WR Wassa Amenfi East | WX`;

const regions = ["Ashanti Region", "Brong Ahafo Region", "Central Region", "Eastern Region", "Greater Accra Region", "Northern Region", "Upper East Region", "Upper West Region", "Volta Region", "Western Region"];

let output = '';
let currentRegion = "";

const pieces = text.split(/(Ashanti Region|Brong Ahafo Region|Central Region|Eastern Region|Greater Accra Region|Northern Region|Upper East Region|Upper West Region|Volta Region|Western Region)/gi);

for (let i = 1; i < pieces.length; i+=2) {
    const region = pieces[i];
    const rest = pieces[i+1];
    output += `\n  // ${region}\n`;
    const sections = rest.split('|');
    if(sections.length < 2) continue;
    
    let currentName = sections[0].trim();
    for (let j = 1; j < sections.length; j++) {
        let part = sections[j].trim();
        // A code is the first word of part, the rest is the next name
        // However, codes are usually 2 characters "A2", "AY", "Bu" (case-insensitive)
        let spaceIndex = part.indexOf(' ');
        let code = '';
        let nextName = '';
        if (spaceIndex === -1) {
            code = part;
        } else {
            code = part.substring(0, spaceIndex);
            nextName = part.substring(spaceIndex + 1).trim();
        }
        code = code.toUpperCase();
        // Edge cases like GA for Accra
        let mun = currentName.split(' / ')[0].trim();
        output += `  "${code}": { region: "${region.trim()}", district: "${currentName.trim()}", municipality: "${mun}" },\n`;
        currentName = nextName;
    }
}
console.log(output);

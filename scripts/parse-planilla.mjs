// Run: node scripts/parse-planilla.mjs
// Reads the Excel planilla and outputs public/planilla_historica.json

import * as XLSX from 'xlsx';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const EXCEL_PATH = '/root/.claude/uploads/35d75d0c-6817-404c-9825-68211e7a254e/d4512f92-Planilla_mensual_de_Hacienda_La_Delia_y_San_Jose_20192024.xlsx';
const OUT_PATH = resolve(__dirname, '../public/planilla_historica.json');

// Canonical subcategory keys (21 total, Nov 2025 layout)
const CATS = [
  'toritos','toros','toros_desecho',
  'vacas_ss','vacas_prenadas','vacas_cut','vacas_cria','vacas_engorde',
  'vaqs_repo1518','vaqs_repo2224','vaqs_1serv','vaqs_2serv','vaqs_inv',
  'nov_menor1','nov_1_2','nov_mayor2',
  'tern_inv_m','tern_inv_h','tern_ot_m','tern_ot_h'
];

const EV_FACTORS = {
  toritos: 0.8, toros: 1.2, toros_desecho: 1.2,
  vacas_ss: 1.0, vacas_prenadas: 0.9, vacas_cut: 1.0, vacas_cria: 1.0, vacas_engorde: 1.0,
  vaqs_repo1518: 0.7, vaqs_repo2224: 0.8, vaqs_1serv: 0.7, vaqs_2serv: 0.8, vaqs_inv: 1.2,
  nov_menor1: 0.7, nov_1_2: 0.8, nov_mayor2: 0.0,
  tern_inv_m: 0.0, tern_inv_h: 0.0, tern_ot_m: 0.3, tern_ot_h: 0.3,
};

function emptyStock() {
  return Object.fromEntries(CATS.map(k => [k, 0]));
}

// Parse sheet name → YYYY-MM
function monthLabel(name) {
  const MONTHS_ES = {
    'enero':1,'febrero':2,'marzo':3,'abril':4,'mayo':5,'junio':6,
    'julio':7,'agosto':8,'septiembre':9,'octubre':10,'noviembre':11,'diciembre':12,
    'ene':1,'feb':2,'mar':3,'abr':4,'jun':6,
    'jul':7,'ago':8,'sep':9,'oct':10,'nov':11,'dic':12,
  };
  const s = name.trim().toLowerCase().replace(/[-_]/g,' ');
  // Try "Mes Año" or "Mes-Año" format: "septiembre 2019", "ago 22", "noviembre 25"
  const m = s.match(/^([a-záéíóú]+)\s+(\d{2,4})$/);
  if (m) {
    const mon = MONTHS_ES[m[1]];
    if (!mon) return null;
    const yr = m[2].length === 2 ? '20' + m[2] : m[2];
    return `${yr}-${String(mon).padStart(2,'0')}`;
  }
  // Bare month name only (no year) - we need to handle "Noviembre" etc. from 2020-2021
  // These sheets have no year - we'll skip for now and handle by position
  return null;
}

// Map column header label → canonical cat key
function labelToKey(lbl) {
  const s = lbl.toLowerCase().trim()
    .replace(/[.°°´`']/g,'')  // remove dots, degree signs, apostrophes
    .replace(/\s*\d{2,4}\s*$/, '')  // strip trailing year like "24" or "2024"
    .replace(/\s+/g,' ')
    .trim();

  const MAP = {
    'toritos': 'toritos',
    'torillo': 'toritos',
    'toros': 'toros',
    'toro': 'toros',
    'desecho': 'toros_desecho',
    'toros desecho': 'toros_desecho',

    // Vacas
    'en servicio': 'vacas_ss',
    'perdonada ss inv': 'vacas_ss',
    'vacas ss': 'vacas_ss',
    's/s': 'vacas_ss',
    'ss': 'vacas_ss',
    'preñadas': 'vacas_prenadas',
    'prenadas': 'vacas_prenadas',
    'pre': 'vacas_prenadas',
    'cut': 'vacas_cut',
    'c.u.t': 'vacas_cut',
    'c/t': 'vacas_cut',
    'c/cría': 'vacas_cria',
    'c/cria': 'vacas_cria',
    'engorde-consumo': 'vacas_engorde',
    'engorde': 'vacas_engorde',
    'consumo': 'vacas_engorde',

    // Vaquillonas
    'repo 15/18 m': 'vaqs_repo1518',
    'repo 15/18m': 'vaqs_repo1518',
    'repo. 15/18 m': 'vaqs_repo1518',
    '15/18': 'vaqs_repo1518',
    'repo 22/24 m': 'vaqs_repo2224',
    'repo 22/24m': 'vaqs_repo2224',
    '22/24': 'vaqs_repo2224',
    '1er servicio': 'vaqs_1serv',
    '1 servicio': 'vaqs_1serv',
    '1er serv': 'vaqs_1serv',
    '2do servicio': 'vaqs_2serv',
    '2 servicio': 'vaqs_2serv',
    '2do serv': 'vaqs_2serv',
    'invernada': 'vaqs_inv',

    // Novillos
    '< 1 año': 'nov_menor1',
    '<1 año': 'nov_menor1',
    '< 1 ano': 'nov_menor1',
    '<1 ano': 'nov_menor1',
    '< 1': 'nov_menor1',
    '<1': 'nov_menor1',
    '1-2 años': 'nov_1_2',
    '1-2 anos': 'nov_1_2',
    '1/2 años': 'nov_1_2',
    '1/2 anos': 'nov_1_2',
    'más 2 años': 'nov_mayor2',
    'mas 2 anos': 'nov_mayor2',
    'más 2 anos': 'nov_mayor2',
    'mas 2 años': 'nov_mayor2',
    '>2 años': 'nov_mayor2',
    '>2': 'nov_mayor2',
    '> 2': 'nov_mayor2',
  };

  // Exact map first
  if (MAP[s]) return MAP[s];

  // Terneros - need context from group header to distinguish inv vs ot, m vs h
  return null;
}

function parseSheet(sheet, sheetName, sequentialYear) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  // Row 3 = group headers, Row 4 = sub-category labels
  const groupRow = rows[3] || [];
  const subRow = rows[4] || [];

  if (subRow.length < 5) {
    console.warn(`  [${sheetName}] Too few columns in subRow`);
    return null;
  }

  // Build column → canonical key mapping
  // We need to use group context for terneros disambiguation
  const colMap = {};
  let currentGroup = '';

  for (let c = 1; c < subRow.length; c++) {
    const grp = String(groupRow[c] || '').trim().toLowerCase();
    if (grp) currentGroup = grp;

    const sub = String(subRow[c] || '').trim();
    if (!sub) continue;

    const key = labelToKey(sub);
    if (key) {
      colMap[c] = key;
      continue;
    }

    // Terneros disambiguation based on group header and sub-label
    const subL = sub.toLowerCase().replace(/[.°°]/g,'').trim();
    const isInv = currentGroup.includes('inv');
    const isOt = currentGroup.includes('ot') || currentGroup.includes('otoñ');
    const isMacho = subL.includes('mac') || subL === 'm' || subL === 'machos';
    const isHembra = subL.includes('hem') || subL === 'h' || subL === 'hembras';

    if (isMacho || isHembra) {
      if (isInv) {
        colMap[c] = isMacho ? 'tern_inv_m' : 'tern_inv_h';
      } else if (isOt) {
        colMap[c] = isMacho ? 'tern_ot_m' : 'tern_ot_h';
      } else {
        // Early sheets: just "Machos" / "Hembras" under "TERNEROS"
        // Map to tern_ot_m / tern_ot_h as the main ternero categories
        colMap[c] = isMacho ? 'tern_ot_m' : 'tern_ot_h';
      }
    }
  }

  if (Object.keys(colMap).length < 5) {
    console.warn(`  [${sheetName}] Only ${Object.keys(colMap).length} cols mapped`);
    // Debug output
    console.warn(`    groupRow: ${groupRow.slice(0,25).map(v=>String(v).substring(0,12)).join('|')}`);
    console.warn(`    subRow:   ${subRow.slice(0,25).map(v=>String(v).substring(0,12)).join('|')}`);
    return null;
  }

  function readRow(rowIdx) {
    const stock = emptyStock();
    const row = rows[rowIdx] || [];
    for (const [cStr, catKey] of Object.entries(colMap)) {
      const c = parseInt(cStr);
      const v = row[c];
      if (typeof v === 'number' && v !== 0) stock[catKey] = Math.round(v);
    }
    return stock;
  }

  // Fixed row structure (0-indexed):
  // 5 = apertura
  // 8 = nacimientos, 9 = traslados entrada, 10 = compras, 11 = recuento entrada, 12 = clasif entrada
  // 15 = mortandad, 16 = traslados salida, 17 = ventas, 18 = consumo, 19 = recuento salida, 20 = clasif salida
  // 23 = cierre (for verification)

  return {
    apertura: readRow(5),
    entradas: {
      nacimientos: readRow(8),
      traslados: readRow(9),
      compras: readRow(10),
      recuento: readRow(11),
      clasificacion: readRow(12),
    },
    salidas: {
      mortandad: readRow(15),
      traslados: readRow(16),
      ventas: readRow(17),
      consumo: readRow(18),
      recuento: readRow(19),
      clasificacion: readRow(20),
    },
    _cierre_excel: readRow(23), // for verification
  };
}

function parseTactos(sheet) {
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const results = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0]) continue;
    results.push({
      fecha: String(row[0]).trim(),
      lote: String(row[1] || '').trim(),
      prenadas: Number(row[2]) || 0,
      cut: Number(row[3]) || 0,
      vacias: Number(row[4]) || 0,
      pct_prenez: Number(row[5]) || 0,
    });
  }
  return results;
}

// Detect year for sheets with no year in name based on context (sequential months in 2020/2021)
function buildYearContext(sheetNames) {
  // We know the sequence starts Sep 2019.
  // Sheets with ambiguous names (no year) appear between Jan 2021 and Nov 2021
  // We'll assign years based on position relative to known sheets
  const result = {};
  let lastKnownYear = 2019;
  let lastKnownMonth = 8; // September = 9, but we'll track 0-indexed

  const MONTHS_ES = {
    'enero':1,'febrero':2,'marzo':3,'abril':4,'mayo':5,'junio':6,
    'julio':7,'agosto':8,'septiembre':9,'octubre':10,'noviembre':11,'diciembre':12,
    'ene':1,'feb':2,'mar':3,'abr':4,'jun':6,
    'jul':7,'ago':8,'sep':9,'oct':10,'nov':11,'dic':12,
  };

  for (const name of sheetNames) {
    const ym = monthLabel(name);
    if (ym) {
      result[name] = ym;
      lastKnownYear = parseInt(ym.slice(0,4));
      lastKnownMonth = parseInt(ym.slice(5,7));
    } else {
      // Ambiguous name - infer from position
      const s = name.trim().toLowerCase().replace(/[-_]/g,' ');
      const wordMatch = s.match(/^([a-záéíóú]+)$/);
      if (wordMatch) {
        const monNum = MONTHS_ES[wordMatch[1]];
        if (monNum) {
          // Infer year: if monNum > lastKnownMonth, same year; else next year
          let yr = lastKnownYear;
          if (monNum <= lastKnownMonth) yr++;
          result[name] = `${yr}-${String(monNum).padStart(2,'0')}`;
          lastKnownYear = yr;
          lastKnownMonth = monNum;
        }
      }
    }
  }
  return result;
}

// Main
const buf = readFileSync(EXCEL_PATH);
const wb = XLSX.read(buf, { type: 'buffer' });

console.log(`Sheets: ${wb.SheetNames.length}`);

const ymMap = buildYearContext(wb.SheetNames);
console.log('Year map:', Object.entries(ymMap).map(([k,v]) => `${k}→${v}`).join(', '));

const output = { months: {}, tactos: [] };

for (const name of wb.SheetNames) {
  const ym = ymMap[name];
  if (!ym) {
    if (name.toLowerCase().includes('tacto')) {
      console.log(`Parsing tactos: ${name}`);
      output.tactos = parseTactos(wb.Sheets[name]);
    }
    continue;
  }

  console.log(`Parsing ${name} → ${ym}`);
  const parsed = parseSheet(wb.Sheets[name], name);
  if (parsed) {
    output.months[ym] = { ym, ...parsed };
    const tot = Object.values(parsed.apertura).reduce((a,b)=>a+b,0);
    const cols = Object.keys(parsed.apertura).filter(k => parsed.apertura[k] > 0);
    console.log(`  apertura=${tot}, active cats: ${cols.join(',')}`);
  }
}

const monthCount = Object.keys(output.months).length;
console.log(`\nParsed ${monthCount} months`);
console.log('Months:', Object.keys(output.months).sort().join(', '));

writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));
console.log(`Written to ${OUT_PATH} (${Math.round(readFileSync(OUT_PATH).length/1024)}KB)`);

// Hakee Tilastokeskuksen taulusta 11re väestön ikäryhmittäin → data/vaesto.json
// Rajapinta: https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/vaerak/11re.px (maksuton)
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('../', import.meta.url);
const TABLE = 'https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/vaerak/11re.px';
const YEARS_BACK = 15;
const GROUPS = [
  { id: 'yhteensa', label: 'Koko väestö', from: 0, to: 999 },
  { id: '0-14', label: '0–14-vuotiaat', from: 0, to: 14 },
  { id: '15-64', label: '15–64-vuotiaat', from: 15, to: 64 },
  { id: '65-', label: '65 vuotta täyttäneet', from: 65, to: 999 }
];

export async function fetchStatfin() {
  const config = JSON.parse(await readFile(new URL('config/indicators.json', ROOT), 'utf8'));
  const meta = await (await fetch(TABLE)).json();
  const v = code => meta.variables.find(x => x.code.startsWith(code));
  const area = v('alue'), age = v('ikaryhma'), sex = v('sukupuoli'), year = v('timeperiod');

  const wanted = [...config.municipalities, 'KOKO MAA'];
  const areaCodes = wanted.map(n => {
    const i = area.valueTexts.findIndex(t => t.toUpperCase() === n.toUpperCase());
    if (i < 0) throw new Error(`11re: aluetta ${n} ei löytynyt`);
    return area.values[i];
  });
  const ageCodes = age.values.filter(c => c !== 'SSS');
  const years = year.values.slice(-YEARS_BACK);

  const query = {
    query: [
      { code: area.code, selection: { filter: 'item', values: areaCodes } },
      { code: age.code, selection: { filter: 'item', values: ageCodes } },
      { code: sex.code, selection: { filter: 'item', values: ['SSS'] } },
      { code: year.code, selection: { filter: 'item', values: years } }
    ],
    response: { format: 'json-stat2' }
  };
  const res = await fetch(TABLE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(query) });
  if (!res.ok) throw new Error(`11re HTTP ${res.status}: ${await res.text()}`);
  const js = await res.json();

  // json-stat2: arvot rivinä dimensioiden järjestyksessä
  const dims = js.id, sizes = js.size;
  const idx = d => js.dimension[d].category.index;
  const keyOf = (d, pos) => Object.keys(idx(d)).find(k => idx(d)[k] === pos);
  const out = {};
  js.value.forEach((val, flat) => {
    let rem = flat; const pos = {};
    for (let k = dims.length - 1; k >= 0; k--) { pos[dims[k]] = rem % sizes[k]; rem = Math.floor(rem / sizes[k]); }
    const aCode = keyOf(area.code, pos[area.code]);
    const name = wanted[areaCodes.indexOf(aCode)] === 'KOKO MAA' ? 'Koko maa' : wanted[areaCodes.indexOf(aCode)];
    const y = keyOf(year.code, pos[year.code]);
    const ageNum = parseInt(keyOf(age.code, pos[age.code]), 10);
    const rec = ((out[name] ??= {})[y] ??= Object.fromEntries(GROUPS.map(g => [g.id, 0])));
    for (const g of GROUPS) if (ageNum >= g.from && ageNum <= g.to) rec[g.id] += val ?? 0;
  });

  const result = {
    source: 'Tilastokeskus, Väestörakenne (11re)', url: 'https://pxdata.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__vaerak/statfin_vaerak_pxt_11re.px/',
    fetched: new Date().toISOString(), latestYear: years.at(-1), groups: GROUPS.map(({ id, label }) => ({ id, label })), values: out
  };
  await writeFile(new URL('data/vaesto.json', ROOT), JSON.stringify(result));
  const k = out[config.home][result.latestYear];
  console.log(`11re: ${config.home} ${result.latestYear}: ${k.yhteensa} asukasta (0–14: ${k['0-14']}, 15–64: ${k['15-64']}, 65+: ${k['65-']})`);
  return result;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fetchStatfin().catch(err => { console.error(err); process.exit(1); });
}

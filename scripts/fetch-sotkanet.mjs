// Hakee config/indicators.json-tiedoston Sotkanet-indikaattorit → data/sotkanet.json
// Rajapinta: https://sotkanet.fi/rest/1.1 (avoin, ei kirjautumista)
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('../', import.meta.url);
const API = 'https://sotkanet.fi/rest/1.1';
const FIRST_YEAR = 1990;

async function getJson(url, tries = 3) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return await res.json();
    } catch (err) {
      if (i >= tries) throw err;
      await new Promise(r => setTimeout(r, 1000 * i));
    }
  }
}

async function pool(items, size, fn) {
  const out = []; let next = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

export async function fetchSotkanet() {
  const config = JSON.parse(await readFile(new URL('config/indicators.json', ROOT), 'utf8'));
  const wanted = [...config.municipalities, ...config.references];

  // Alueet nimen ja tyypin perusteella (kunta, maakunta, maa)
  const regions = await getJson(`${API}/regions`);
  const regionName = {};
  const kuntaIds = new Set(regions.filter(r => r.category === 'KUNTA').map(r => r.id));
  for (const r of regions) {
    const n = r.title.fi;
    const ok = (r.category === 'KUNTA' && config.municipalities.includes(n))
      || (r.category === 'MAAKUNTA' && n === 'Pirkanmaa')
      || (r.category === 'MAA' && n === 'Koko maa');
    if (ok) regionName[r.id] = n;
  }
  const missing = wanted.filter(n => !Object.values(regionName).includes(n));
  if (missing.length) throw new Error(`Sotkanet-alueita ei löytynyt: ${missing.join(', ')}`);

  const ids = [...new Set(config.indicators.filter(i => i.source === 'sotkanet').flatMap(i => i.variants.map(v => v.id)))];
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: thisYear - FIRST_YEAR + 1 }, (_, k) => `years=${FIRST_YEAR + k}`).join('&');

  const result = { source: 'Sotkanet, THL', url: 'https://sotkanet.fi', fetched: new Date().toISOString(), indicators: {} };
  const empty = [];
  await pool(ids, 4, async id => {
    const [meta, rows] = await Promise.all([
      getJson(`${API}/indicators/${id}`),
      getJson(`${API}/json?indicator=${id}&${years}&genders=total`)
    ]);
    const values = {};
    const kuntaSum = {};
    for (const row of rows) {
      if (row.value == null) continue;
      if (kuntaIds.has(row.region)) { const k = (kuntaSum[row.year] ??= [0, 0]); k[0] += row.value; k[1]++; }
      const name = regionName[row.region];
      if (name) (values[name] ??= {})[row.year] = row.value;
    }
    // Jos koko maan arvoa ei julkaista (esim. TEAviisari), lasketaan kuntien keskiarvo
    let nationalComputed = false;
    if (!values['Koko maa'] && Object.keys(kuntaSum).length) {
      nationalComputed = true;
      values['Koko maa'] = Object.fromEntries(Object.entries(kuntaSum).map(([y, [sum, n]]) => [y, Math.round(sum / n * 10) / 10]));
    }
    if (!values[config.home]) empty.push(id);
    result.indicators[id] = {
      title: meta.title?.fi,
      organization: meta.organization?.title?.fi ?? null,
      decimals: meta.decimals ?? null,
      updated: meta['data-updated'] ?? null,
      description: (meta.description?.fi || '').trim(),
      nationalComputed,
      values
    };
    process.stdout.write('.');
  });
  process.stdout.write('\n');

  await writeFile(new URL('data/sotkanet.json', ROOT), JSON.stringify(result));
  console.log(`Sotkanet: ${ids.length} indikaattoria tallennettu data/sotkanet.json`);
  if (empty.length) console.log(`  Huom: ei ${config.home}-arvoja (käytetään Pirkanmaa/koko maa): ${empty.join(', ')}`);
  return result;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fetchSotkanet().catch(err => { console.error(err); process.exit(1); });
}

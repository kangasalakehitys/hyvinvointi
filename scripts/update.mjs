// npm run update — hakee kaikki rajapintatiedot ja kirjoittaa data/meta.json
// Uusi tietolähde: tee scripts/fetch-<lähde>.mjs, joka vie funktion, ja lisää se SOURCES-listaan.
import { writeFile } from 'node:fs/promises';
import { fetchSotkanet } from './fetch-sotkanet.mjs';
import { fetchStatfin } from './fetch-statfin.mjs';

const SOURCES = [
  { id: 'sotkanet', name: 'Sotkanet (THL)', run: fetchSotkanet },
  { id: 'vaesto', name: 'Tilastokeskus 11re', run: fetchStatfin }
];

const meta = { updated: new Date().toISOString(), sources: {} };
let failed = false;
for (const s of SOURCES) {
  try {
    const r = await s.run();
    meta.sources[s.id] = { name: s.name, fetched: r.fetched, ok: true };
  } catch (err) {
    failed = true;
    console.error(`${s.name} epäonnistui:`, err.message);
    meta.sources[s.id] = { name: s.name, ok: false, error: err.message };
  }
}
await writeFile(new URL('../data/meta.json', import.meta.url), JSON.stringify(meta, null, 2));
console.log(failed ? 'Valmis virheiden kanssa. Vanhat tiedostot jäivät ennalleen.' : 'Valmis. Tarkista muutokset, tee commit ja push.');
process.exit(failed ? 1 : 0);

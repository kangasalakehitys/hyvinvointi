/* Datakerros: lukee config/indicators.json, data/*.json ja oman Excelin.
   Kaikki lähteet muunnetaan samaan muotoon:
   item = { id, category, section, title, source, better, unit, variants:[{ label, series:{ alue:{ vuosi: arvo } } }] } */
window.HY = window.HY || {};
(function (HY) {
  const fetchJson = async (url) => {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
    return r.json();
  };

  async function readOwnExcel(url) {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw new Error(`Excel ${url}: HTTP ${r.status}`);
    const wb = XLSX.read(await r.arrayBuffer(), { type: 'array' });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: null });
    // Vastuutaho-saraketta ei käytetä eikä näytetä (henkilötietoja)
    return rows
      .filter(r => r.Alakategoria && r.Vuosi != null && r.Arvo != null && r.Arvo !== '')
      .map(r => ({ kunta: String(r.Kunta || '').trim(), kategoria: String(r.Kategoria || '').trim(), alakategoria: String(r.Alakategoria).trim(), vuosi: Number(r.Vuosi), arvo: Number(r.Arvo) }))
      .filter(r => Number.isFinite(r.arvo) && Number.isFinite(r.vuosi));
  }

  const applyTransform = (t, v) => t === '100-x' ? Math.round((100 - v) * 10) / 10 : v;

  function buildItems(cfg, sotkanet, ownRows) {
    const items = [];
    for (const ind of cfg.indicators) {
      if (ind.source !== 'sotkanet') continue;
      let nationalComputed = false, updated = null, decimals = null;
      const variants = ind.variants.map(v => {
        const src = sotkanet.indicators[v.id];
        if (!src) return { label: v.label, sotkanetId: v.id, series: {} };
        nationalComputed = nationalComputed || src.nationalComputed;
        updated = src.updated || updated;
        decimals = src.decimals ?? decimals;
        const series = {};
        for (const [region, ys] of Object.entries(src.values)) {
          series[region] = {};
          for (const [y, val] of Object.entries(ys)) series[region][y] = applyTransform(ind.transform, val);
        }
        return { label: v.label, sotkanetId: v.id, series };
      });
      items.push({ ...ind, variants, source: 'Sotkanet / THL', sourceUrl: 'https://sotkanet.fi', updated, decimals, nationalComputed });
    }

    // Oma Excel: yksi kortti per Alakategoria
    const groups = new Map();
    for (const r of ownRows) {
      const key = r.kategoria + '||' + r.alakategoria;
      if (!groups.has(key)) groups.set(key, { kategoria: r.kategoria, title: r.alakategoria, series: {} });
      const g = groups.get(key);
      (g.series[r.kunta || cfg.home] ??= {})[r.vuosi] = r.arvo;
    }
    let n = 0;
    for (const g of groups.values()) {
      const category = cfg.excelCategories[g.kategoria];
      if (!category) { console.warn('Excel-kategorialle ei ole yläluokkaa config/indicators.json → excelCategories:', g.kategoria); continue; }
      const betterKey = Object.keys(cfg.excelBetter || {}).find(k => g.title.startsWith(k));
      items.push({
        id: 'oma-' + (++n), category, section: g.kategoria, title: g.title, source: 'Kangasalan kaupunki (oma tieto)', own: true,
        better: betterKey ? cfg.excelBetter[betterKey] : null, unit: /%/.test(g.title) ? '%' : '',
        variants: [{ label: '', series: g.series }]
      });
    }
    return items;
  }

  HY.load = async function () {
    const cfg = await fetchJson('config/indicators.json');
    const [sotkanet, vaesto, meta] = await Promise.all([
      fetchJson('data/sotkanet.json'), fetchJson('data/vaesto.json'), fetchJson('data/meta.json').catch(() => ({}))
    ]);
    let ownRows = [], ownError = null;
    try { ownRows = await readOwnExcel(cfg.ownData.url); } catch (e) { ownError = e.message; console.error(e); }
    const items = buildItems(cfg, sotkanet, ownRows);
    HY.store = { cfg, sotkanet, vaesto, meta, items, ownRows, ownError };
    return HY.store;
  };

  // Apuja
  HY.years = (series) => {
    const s = new Set();
    for (const r of Object.values(series || {})) Object.keys(r).forEach(y => s.add(+y));
    return [...s].sort((a, b) => a - b);
  };
  HY.regionsOf = (cfg) => [...cfg.municipalities, ...cfg.references];
  HY.focusRegion = (item, cfg) => {
    const s = item.variants.find(v => v.series[cfg.home]) ? cfg.home : (item.variants.some(v => v.series.Pirkanmaa) ? 'Pirkanmaa' : cfg.home);
    return s;
  };
  HY.fmt = (v, item, opts = {}) => {
    if (v == null || Number.isNaN(v)) return '–';
    const d = item && item.decimals != null ? item.decimals : (Math.abs(v) >= 1000 || Number.isInteger(v) ? 0 : 1);
    const s = v.toLocaleString('fi-FI', { minimumFractionDigits: opts.minDec ?? 0, maximumFractionDigits: Math.max(d, opts.minDec ?? 0) });
    if (opts.noUnit || !item || !item.unit) return s;
    return item.unit === '%' ? s + ' %' : s + ' ' + item.unit;
  };
  HY.slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  HY.esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
})(window.HY);

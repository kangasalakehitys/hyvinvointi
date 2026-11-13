/* Kaikki indikaattoritulokset yhteen XLSX-tiedostoon (SheetJS). Vastuutaho-saraketta ei viedä. */
(function (HY) {
  HY.exportXlsx = function (store) {
    const { cfg, items, vaesto } = store;
    const catTitle = Object.fromEntries(cfg.categories.map(c => [c.id, c.title]));
    const order = Object.fromEntries(cfg.categories.map((c, i) => [c.id, i]));
    const sorted = items.slice().sort((a, b) => order[a.category] - order[b.category]);

    const long = [];
    const analysis = [];
    for (const it of sorted) {
      for (const v of it.variants) {
        for (const [region, ys] of Object.entries(v.series)) {
          for (const [y, val] of Object.entries(ys)) {
            long.push({ 'Yläluokka': catTitle[it.category], 'Osio': it.section, 'Indikaattori': it.title, 'Ryhmä': v.label || '', 'Alue': region, 'Vuosi': +y, 'Arvo': val, 'Lähde': it.source, 'Sotkanet-id': v.sotkanetId || '' });
          }
        }
        const a = HY.analyse(it, v, cfg);
        analysis.push({ 'Yläluokka': catTitle[it.category], 'Indikaattori': it.title, 'Ryhmä': v.label || '', 'Viimeisin vuosi': a.latestYear ?? '', 'Arvo': a.latest ?? '', 'Edellinen vuosi': a.prevYear ?? '', 'Edellinen arvo': a.prev ?? '', 'Suunta': HY.statusLabel[a.status], 'Analyysi': a.text });
      }
    }
    const pop = [];
    for (const [region, ys] of Object.entries(vaesto.values)) for (const [y, r] of Object.entries(ys)) {
      pop.push({ 'Alue': region, 'Vuosi': +y, 'Koko väestö': r.yhteensa, '0–14-vuotiaat': r['0-14'], '0–14 %': +(r['0-14'] / r.yhteensa * 100).toFixed(1), '15–64-vuotiaat': r['15-64'], '15–64 %': +(r['15-64'] / r.yhteensa * 100).toFixed(1), '65+ vuotiaat': r['65-'], '65+ %': +(r['65-'] / r.yhteensa * 100).toFixed(1) });
    }

    const wb = XLSX.utils.book_new();
    const add = (rows, name, widths) => { const ws = XLSX.utils.json_to_sheet(rows); ws['!cols'] = widths.map(w => ({ wch: w })); ws['!autofilter'] = { ref: ws['!ref'] }; XLSX.utils.book_append_sheet(wb, ws, name); };
    add(analysis, 'Yhteenveto', [26, 60, 14, 12, 10, 12, 12, 22, 110]);
    add(long, 'Indikaattorit', [26, 30, 70, 14, 14, 8, 10, 30, 12]);
    add(pop, 'Väestö', [14, 8, 12, 12, 8, 12, 8, 12, 8]);
    const info = [
      { 'Tieto': 'Raportti', 'Arvo': 'Kangasalan hyvinvointityön indikaattorit' },
      { 'Tieto': 'Luotu', 'Arvo': new Date().toLocaleString('fi-FI') },
      { 'Tieto': 'Rajapintatiedot päivitetty', 'Arvo': store.meta?.updated ? new Date(store.meta.updated).toLocaleString('fi-FI') : '' },
      { 'Tieto': 'Lähteet', 'Arvo': 'Sotkanet (THL), Tilastokeskus 11re, Kangasalan kaupungin omat tiedot' }
    ];
    add(info, 'Tietoja', [28, 70]);
    XLSX.writeFile(wb, `kangasala-hyvinvointi-indikaattorit-${new Date().toISOString().slice(0, 10)}.xlsx`, { compression: true });
  };
})(window.HY);

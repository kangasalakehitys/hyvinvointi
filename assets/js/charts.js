/* Yhteinen kaaviokomponentti (ECharts). Brändiohje: brand_overview.md
   - läpinäkyvä tausta ja reunat, akselifontti 14 px, katkoviivaiset ruudukot
   - PNG/JPG/SVG/CSV-lataus ilman zoom-komponentteja */
(function (HY) {
  const C = { red: '#DE232F', yellow: '#FCB316', navy: '#28336C', orange: '#E64925', cyan: '#00ADC5', green: '#009651', grey: '#9a9aa5' };
  HY.colors = C;
  const FONT = "'Century Gothic', 'Questrial', 'Segoe UI', sans-serif";
  const AXIS = { fontSize: 14, color: '#000000', fontWeight: 'normal', fontFamily: FONT };
  const GRID_LINE = { lineStyle: { type: 'dashed', color: '#E0E0E0', width: 1 } };
  const REF_COLOR = { 'Koko maa': C.navy, 'Pirkanmaa': C.cyan };
  const registry = new Map();
  HY.charts = registry;

  const base = () => ({
    backgroundColor: 'transparent',
    textStyle: { fontFamily: FONT },
    animationDuration: 500,
    tooltip: { confine: true, textStyle: { fontFamily: FONT } }
  });


  // Seutuvertailu: vaakapylväät, Kangasala korostettuna, viiteaLueet harmaina
  HY.optRegionBar = function (item, variant, year, cfg) {
    const names = HY.regionsOf(cfg).filter(n => variant.series[n]?.[year] != null);
    const rows = names.map(n => ({ name: n, value: variant.series[n][year] }));
    const muni = rows.filter(r => cfg.municipalities.includes(r.name)).sort((a, b) => a.value - b.value);
    const refs = rows.filter(r => !cfg.municipalities.includes(r.name));
    const ordered = [...refs, ...muni];
    const o = base();
    o.grid = { left: 8, right: 54, top: 8, bottom: 8, containLabel: true };
    o.xAxis = { type: 'value', axisLabel: { ...AXIS, fontSize: 12, formatter: v => v.toLocaleString('fi-FI') }, splitLine: GRID_LINE };
    o.yAxis = { type: 'category', data: ordered.map(r => r.name), axisLabel: { ...AXIS, formatter: v => v === cfg.home ? `{h|${v}}` : v, rich: { h: { fontWeight: 'bold', fontSize: 14, color: C.red, fontFamily: FONT } } }, axisTick: { show: false }, axisLine: { lineStyle: { color: '#bdbdc6' } } };
    o.tooltip = { ...o.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: v => HY.fmt(v, item) };
    o.series = [{
      type: 'bar', barMaxWidth: 22, name: String(year),
      data: ordered.map(r => ({
        value: r.value,
        itemStyle: { color: r.name === cfg.home ? C.red : (REF_COLOR[r.name] ? REF_COLOR[r.name] : C.navy), opacity: r.name === cfg.home ? 1 : (REF_COLOR[r.name] ? 0.85 : 0.35), borderRadius: [0, 4, 4, 0] }
      })),
      label: { show: true, position: 'right', fontFamily: FONT, fontSize: 12, color: '#1d1d1f', formatter: p => HY.fmt(p.value, item, { noUnit: true }) }
    }];
    return o;
  };

  // Kehitys: pylväät (Kangasala tai Pirkanmaa) + viivat vertailualueille, sama y-akseli
  HY.optTrend = function (item, variant, cfg, opts = {}) {
    const focus = variant.series[cfg.home] ? cfg.home : 'Pirkanmaa';
    const ys = HY.years(variant.series);
    const o = base();
    const refs = cfg.references.filter(r => r !== focus && variant.series[r]);
    const showRefs = !opts.noRefs && refs.length;
    o.grid = { left: 8, right: 16, top: showRefs ? 40 : 14, bottom: ys.length > 12 ? 46 : 8, containLabel: true };
    o.legend = showRefs ? { top: 0, left: 0, textStyle: { ...AXIS, fontSize: 12 }, itemWidth: 14, itemHeight: 10 } : undefined;
    o.xAxis = { type: 'category', data: ys.map(String), axisLabel: { ...AXIS, fontSize: 12 }, axisTick: { alignWithLabel: true }, axisLine: { lineStyle: { color: '#bdbdc6' } } };
    o.yAxis = { type: 'value', axisLabel: { ...AXIS, fontSize: 12, formatter: v => v.toLocaleString('fi-FI') }, splitLine: GRID_LINE, scale: false };
    o.tooltip = { ...o.tooltip, trigger: 'axis', valueFormatter: v => HY.fmt(v, item) };
    o.series = [{
      name: focus, type: 'bar', barMaxWidth: 34,
      itemStyle: { color: focus === cfg.home ? C.red : C.cyan, borderRadius: [4, 4, 0, 0] },
      data: ys.map(y => variant.series[focus]?.[y] ?? null),
      label: { show: ys.length <= 8, position: 'top', fontFamily: FONT, fontSize: 12, color: '#1d1d1f', formatter: p => HY.fmt(p.value, item, { noUnit: true }) }
    }];
    if (showRefs) for (const r of refs) {
      o.series.push({
        name: r + (r === 'Koko maa' && item.nationalComputed ? ' (kuntien ka.)' : ''), type: 'line', smooth: 0.5, connectNulls: true, symbol: 'circle', symbolSize: 8,
        lineStyle: { width: 2.5, color: REF_COLOR[r] }, itemStyle: { color: REF_COLOR[r], borderColor: '#ffffff', borderWidth: 2, borderType: 'solid' },
        data: ys.map(y => variant.series[r]?.[y] ?? null)
      });
    }
    if (ys.length > 12) {
      o.dataZoom = [{ type: 'inside', startValue: String(ys.at(-12)) }, { type: 'slider', height: 18, bottom: 6, startValue: String(ys.at(-12)), textStyle: { fontSize: 11 } }];
    }
    return o;
  };

  // Cleveland dot plot: Kangasala pääpisteenä, muut kunnat taustapisteinä
  HY.optDotPlot = function (rows, cfg, labelOf, year) {
    const o = base();
    const cats = rows.map(labelOf);
    o.grid = { left: 8, right: 20, top: 34, bottom: 8, containLabel: true };
    o.legend = { top: 0, left: 0, textStyle: { ...AXIS, fontSize: 12 } };
    o.tooltip = { ...o.tooltip, trigger: 'item', formatter: p => `${HY.esc(p.seriesName)}<br>${HY.esc(cats[p.value[1]])}: <b>${p.value[0]}</b>` };
    o.xAxis = { type: 'value', min: 0, max: 100, axisLabel: { ...AXIS, fontSize: 12, fontWeight: 'bold' }, splitLine: GRID_LINE };
    o.yAxis = { type: 'category', data: cats, axisLabel: { ...AXIS, fontSize: 12, fontWeight: 'bold', width: 260, overflow: 'break' }, splitLine: { show: true, ...GRID_LINE }, axisTick: { show: false } };
    const others = [], home = [];
    rows.forEach((it, i) => {
      const s = it.variants[0].series;
      for (const m of cfg.municipalities) {
        const v = s[m]?.[year]; if (v == null) continue;
        (m === cfg.home ? home : others).push({ value: [v, i], name: m });
      }
    });
    o.series = [
      { name: 'Muut seudun kunnat', type: 'scatter', symbolSize: 11, itemStyle: { color: C.navy, opacity: 0.5, borderWidth: 0 }, data: others,
        tooltip: { formatter: p => `${HY.esc(p.name)}<br>${HY.esc(cats[p.value[1]])}: <b>${p.value[0]}</b>` } },
      { name: cfg.home, type: 'scatter', symbolSize: 14, z: 3, itemStyle: { color: C.red, borderColor: '#fff', borderWidth: 2, borderType: 'solid' }, data: home }
    ];
    return o;
  };

  // TEAviisari: sektorit, Kangasala vs. koko maa (viimeisin vuosi sektoreittain)
  HY.optTea = function (items, cfg) {
    const rows = items.map(it => {
      const s = it.variants[0].series; const ys = Object.keys(s[cfg.home] || {}).map(Number).sort((a, b) => a - b); const y = ys.at(-1);
      return { name: it.tea, year: y, home: s[cfg.home]?.[y], nat: s['Koko maa']?.[y], computed: it.nationalComputed };
    }).reverse();
    const o = base();
    o.grid = { left: 8, right: 40, top: 34, bottom: 8, containLabel: true };
    o.legend = { top: 0, left: 0, textStyle: { ...AXIS, fontSize: 12 } };
    o.tooltip = { ...o.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } };
    o.xAxis = { type: 'value', min: 0, max: 100, axisLabel: { ...AXIS, fontSize: 12 }, splitLine: GRID_LINE };
    o.yAxis = { type: 'category', data: rows.map(r => `${r.name} ${r.year ?? ''}`), axisLabel: AXIS, axisTick: { show: false } };
    const lbl = { show: true, position: 'right', fontFamily: FONT, fontSize: 12, color: '#1d1d1f' };
    o.series = [
      { name: 'Koko maa', type: 'bar', barGap: '15%', barMaxWidth: 16, itemStyle: { color: C.navy, opacity: 0.55, borderRadius: [0, 4, 4, 0] }, label: lbl, data: rows.map(r => r.nat ?? null) },
      { name: cfg.home, type: 'bar', barMaxWidth: 16, itemStyle: { color: C.red, borderRadius: [0, 4, 4, 0] }, label: lbl, data: rows.map(r => r.home ?? null) }
    ];
    return o;
  };

  // Ikärakenne 100 % pinottuna
  HY.optAgeStructure = function (vaesto, cfg) {
    const y = vaesto.latestYear;
    const names = [...cfg.municipalities, 'Koko maa'];
    const groups = vaesto.groups.filter(g => g.id !== 'yhteensa');
    const colors = [C.yellow, C.navy, C.red];
    const o = base();
    o.grid = { left: 8, right: 16, top: 34, bottom: 8, containLabel: true };
    o.legend = { top: 0, left: 0, textStyle: { ...AXIS, fontSize: 12 } };
    o.tooltip = { ...o.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: v => HY.fmt(v, null, { minDec: 1 }) + ' %' };
    o.xAxis = { type: 'value', max: 100, axisLabel: { ...AXIS, fontSize: 12, formatter: '{value} %' }, splitLine: GRID_LINE };
    o.yAxis = { type: 'category', inverse: true, data: names, axisLabel: { ...AXIS, formatter: v => v === cfg.home ? `{h|${v}}` : v, rich: { h: { fontWeight: 'bold', color: C.red, fontSize: 14, fontFamily: FONT } } }, axisTick: { show: false } };
    o.series = groups.map((g, i) => ({
      name: g.label, type: 'bar', stack: 'a', barMaxWidth: 26, itemStyle: { color: colors[i], borderColor: '#fff', borderWidth: 1 },
      label: { show: true, fontFamily: FONT, fontSize: 11, color: i === 0 ? '#1d1d1f' : '#fff', formatter: p => p.value >= 8 ? Math.round(p.value) + ' %' : '' },
      data: names.map(n => { const r = vaesto.values[n]?.[y]; return r ? Math.round(r[g.id] / r.yhteensa * 1000) / 10 : null; })
    }));
    return o;
  };

  HY.optPopulation = function (vaesto, cfg) {
    const s = vaesto.values[cfg.home]; const ys = Object.keys(s).sort();
    const o = base();
    o.grid = { left: 8, right: 16, top: 14, bottom: 8, containLabel: true };
    o.tooltip = { ...o.tooltip, trigger: 'axis', valueFormatter: v => HY.fmt(v) + ' asukasta' };
    o.xAxis = { type: 'category', data: ys, axisLabel: { ...AXIS, fontSize: 12 } };
    o.yAxis = { type: 'value', axisLabel: { ...AXIS, fontSize: 12, formatter: v => v.toLocaleString('fi-FI') }, splitLine: GRID_LINE };
    o.series = [{ type: 'bar', name: 'Väkiluku', barMaxWidth: 30, itemStyle: { color: C.red, borderRadius: [4, 4, 0, 0] }, data: ys.map(y => s[y].yhteensa) }];
    return o;
  };

  // Mounttaa kaavion, rekisteröi latauksia ja PPTX:ää varten
  HY.mountChart = function (el, option, meta) {
    let chart = echarts.getInstanceByDom(el);
    if (!chart) chart = echarts.init(el, null, { renderer: 'canvas' });
    chart.setOption(option, true);
    registry.set(el.id, { chart, option, meta });
    return chart;
  };
  let resizeT;
  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => registry.forEach(r => r.chart.resize()), 120); });

  const download = (href, name) => { const a = document.createElement('a'); a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove(); };
  const stripZoom = (opt) => { const o = { ...opt, animation: false }; delete o.dataZoom; if (o.grid) o.grid = { ...o.grid, bottom: 8 }; return o; };

  // Renderöi option kuvaksi näytön ulkopuolella (myös PPTX käyttää tätä)
  HY.renderImage = function (option, { type = 'png', width = 960, height = 520, bg = '#ffffff', pixelRatio = 2 } = {}) {
    const div = document.createElement('div');
    div.style.cssText = `position:fixed;left:-10000px;top:0;width:${width}px;height:${height}px`;
    document.body.appendChild(div);
    const renderer = type === 'svg' ? 'svg' : 'canvas';
    const c = echarts.init(div, null, { renderer, width, height });
    c.setOption(stripZoom(option));
    let out;
    if (type === 'svg') out = c.renderToSVGString();
    else out = c.getDataURL({ type: type === 'jpg' ? 'jpeg' : 'png', pixelRatio, backgroundColor: type === 'jpg' ? bg : (bg || 'transparent') });
    c.dispose(); div.remove();
    return out;
  };

  HY.exportChart = function (id, type) {
    const r = registry.get(id); if (!r) return;
    const name = (r.meta?.filename || id);
    if (type === 'csv') {
      const csv = r.meta?.csv ? r.meta.csv() : '';
      download(URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })), name + '.csv');
      return;
    }
    const opt = { ...r.option, title: { text: r.meta?.title || '', left: 0, top: 0, textStyle: { fontFamily: FONT, fontSize: 16, color: '#1d1d1f', width: 900, overflow: 'break' } } };
    opt.grid = { ...opt.grid, top: (opt.grid?.top || 10) + 44 };
    if (opt.legend) opt.legend = { ...opt.legend, top: 30 };
    if (type === 'svg') {
      const svg = HY.renderImage(opt, { type: 'svg' });
      download(URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })), name + '.svg');
    } else download(HY.renderImage(opt, { type, bg: type === 'png' ? null : '#ffffff' }), name + '.' + type);
  };

  // CSV: alueet riveinä, vuodet sarakkeina
  HY.seriesCsv = function (item, variant) {
    const ys = HY.years(variant.series);
    const head = ['Alue', ...ys].join(';');
    const lines = Object.entries(variant.series).map(([r, s]) => [r, ...ys.map(y => s[y] == null ? '' : String(s[y]).replace('.', ','))].join(';'));
    return [`# ${item.title}${variant.label ? ' – ' + variant.label : ''}`, `# Lähde: ${item.source}`, head, ...lines].join('\n');
  };
})(window.HY);

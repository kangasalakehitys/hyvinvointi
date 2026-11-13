/* Sivujen renderöinti: ylätunniste, yläluokkavalikko, etusivu ja kategoriasivut. */
(function (HY) {
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => HY.esc(s);

  const ICONS = {
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    award: '<circle cx="12" cy="8" r="7"/><path d="M8.2 13.9L7 23l5-3 5 3-1.2-9.1"/>',
    compass: '<circle cx="12" cy="12" r="10"/><path d="M16.2 7.8l-2.1 6.3-6.3 2.1 2.1-6.3z"/>',
    home: '<path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    pptx: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
    xlsx: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>'
  };
  const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
  HY.icon = icon;

  function renderChrome(store, current) {
    const { cfg } = store;
    $('#site-header').innerHTML = `
      <div class="wrap">
        <a class="brand" href="index.html"><img src="assets/brand/Kangasala_logo_RGB_color.svg" alt="Kangasala"><span><strong>Hyvinvointityön indikaattorit</strong>Hyvinvoinnin ja terveyden edistäminen</span></a>
        <div class="header-actions">
          <button class="btn btn-ghost" data-export="xlsx" title="Lataa kaikki indikaattoritulokset Excel-muodossa">${icon('xlsx')}<span>Lataa XLSX</span></button>
          <button class="btn btn-primary" data-export="pptx" title="Lataa koko raportti PowerPoint-muodossa">${icon('pptx')}<span>Lataa PPTX</span></button>
        </div>
      </div>`;
    const curTitle = current === 'home' ? 'Etusivu' : (cfg.categories.find(c => c.id === current)?.title || '');
    $('#catnav').classList.remove('open');
    $('#catnav').innerHTML = `<div class="bar"><span class="current">${esc(curTitle)}</span><button type="button" aria-expanded="false" aria-controls="catnav-list">Yläluokat ▾</button></div>
    <ul id="catnav-list">
      <li><a href="index.html" ${current === 'home' ? 'aria-current="page"' : ''}>${icon('home')}Etusivu</a></li>
      ${cfg.categories.map(c => `<li><a href="indikaattorit.html#${c.id}" data-cat="${c.id}" ${current === c.id ? 'aria-current="page"' : ''}>${esc(c.title)}</a></li>`).join('')}
    </ul>`;
    const nav = $('#catnav'), toggle = nav.querySelector('.bar button');
    toggle.addEventListener('click', () => { const open = nav.classList.toggle('open'); toggle.setAttribute('aria-expanded', open); toggle.textContent = open ? 'Sulje ✕' : 'Yläluokat ▾'; });
    nav.querySelectorAll('ul a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
    const m = store.meta?.updated ? new Date(store.meta.updated).toLocaleDateString('fi-FI') : '–';
    $('#site-footer').innerHTML = `<div class="wrap">
      <img src="assets/brand/Kangasala_logo_slogan_RGB_white.svg" alt="Kangasala – Oksalla ylimmällä">
      <div>Lähteet: Sotkanet (THL), Tilastokeskus (11re) ja Kangasalan kaupungin omat tiedot. Rajapintatiedot päivitetty ${m}.<br>
      <a href="https://www.kangasala.fi/koe-viihdy-ja-ela/hyvinvoinnin-ja-terveyden-edistaminen/">Hyvinvoinnin ja terveyden edistäminen kangasala.fi-sivustolla</a></div>
      <div>Hyvinvointikoordinaattori<br><b>Marjut Hietaniemi</b></div></div>`;
    document.querySelectorAll('[data-export]').forEach(b => b.addEventListener('click', async () => {
      const label = b.querySelector('span')?.textContent; b.disabled = true;
      if (b.querySelector('span')) b.querySelector('span').textContent = 'Luodaan…';
      try { b.dataset.export === 'xlsx' ? HY.exportXlsx(store) : await HY.exportPptx(store); }
      catch (e) { console.error(e); alert('Lataus epäonnistui: ' + e.message); }
      finally { b.disabled = false; if (b.querySelector('span')) b.querySelector('span').textContent = label; }
    }));
  }

  // ---------- Väestö ----------
  function populationKpis(store) {
    const { vaesto, cfg } = store;
    const y = vaesto.latestYear, prev = String(+y - 1);
    const r = vaesto.values[cfg.home][y], p = vaesto.values[cfg.home][prev];
    const colors = ['var(--red)', 'var(--yellow)', 'var(--navy)', 'var(--cyan)'];
    return `<div class="kpis">${vaesto.groups.map((g, i) => {
      const v = r[g.id], share = v / r.yhteensa * 100, d = p ? v - p[g.id] : null;
      return `<div class="kpi" style="--c:${colors[i]}"><div class="label">${esc(g.label)} ${y}</div>
        <div class="value">${v.toLocaleString('fi-FI')}</div>
        <div class="sub">${g.id === 'yhteensa' ? 'asukasta' : HY.fmt(share, null, { minDec: 1 }) + ' % väestöstä'}
        ${d != null ? ` · <span class="${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '+' : '−'}${Math.abs(d).toLocaleString('fi-FI')}</span> vs. ${prev}` : ''}</div></div>`;
    }).join('')}</div>`;
  }

  function populationTable(store) {
    const { vaesto, cfg } = store; const y = vaesto.latestYear, prev = String(+y - 1);
    const names = [...cfg.municipalities, 'Koko maa'];
    const rows = names.map(n => {
      const r = vaesto.values[n][y], p = vaesto.values[n][prev];
      const ch = p ? (r.yhteensa - p.yhteensa) / p.yhteensa * 100 : null;
      const pct = k => HY.fmt(r[k] / r.yhteensa * 100, null, { minDec: 1 });
      return `<tr class="${n === cfg.home ? 'home' : ''}"><td>${n}</td><td data-v="${r.yhteensa}">${r.yhteensa.toLocaleString('fi-FI')}</td>
        <td data-v="${ch}" class="${ch >= 0 ? 'pos' : 'neg'}">${ch == null ? '–' : (ch >= 0 ? '+' : '') + HY.fmt(ch, null, { minDec: 1 })} %</td>
        <td data-v="${r['0-14']}">${r['0-14'].toLocaleString('fi-FI')} (${pct('0-14')} %)</td><td data-v="${r['15-64']}">${r['15-64'].toLocaleString('fi-FI')} (${pct('15-64')} %)</td><td data-v="${r['65-']}">${r['65-'].toLocaleString('fi-FI')} (${pct('65-')} %)</td></tr>`;
    }).join('');
    return `<div class="table-wrap"><table class="data sortable" id="tbl-vaesto"><thead><tr><th>Alue</th><th>Väkiluku ${y}</th><th>Muutos ${prev}–${y}</th><th>0–14 v.</th><th>15–64 v.</th><th>65+ v.</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function renderPopulation(store, root) {
    const { vaesto, cfg } = store;
    const y = vaesto.latestYear, r = vaesto.values[cfg.home][y], first = Object.keys(vaesto.values[cfg.home]).sort()[0];
    const r0 = vaesto.values[cfg.home][first];
    const growth = (r.yhteensa - r0.yhteensa) / r0.yhteensa * 100;
    const old = r['65-'] / r.yhteensa * 100, oldNat = vaesto.values['Koko maa'][y]['65-'] / vaesto.values['Koko maa'][y].yhteensa * 100;
    root.innerHTML = `
      <div class="summary"><h2>Yhteenveto</h2><p>Kangasalla oli vuoden ${y} lopussa <b>${r.yhteensa.toLocaleString('fi-FI')}</b> asukasta.
        Väkiluku on kasvanut vuodesta ${first} ${HY.fmt(growth, null, { minDec: 1 })} %. 65 vuotta täyttäneiden osuus on ${HY.fmt(old, null, { minDec: 1 })} %
        (koko maa ${HY.fmt(oldNat, null, { minDec: 1 })} %), ja lasten (0–14 v.) osuus on ${HY.fmt(r['0-14'] / r.yhteensa * 100, null, { minDec: 1 })} %.</p></div>
      ${populationKpis(store)}
      <div class="grid" style="margin-top:22px">
        <article class="card span-2"><h3>Ikärakenne seudun kunnissa ${y}</h3><div class="chart tall" id="chart-ikarakenne"></div>
          <div class="card-foot"><span class="src">Lähde: ${esc(vaesto.source)}</span>${dlButtons('chart-ikarakenne')}</div></article>
        <figure class="photo-tile"><img src="assets/img/areena.jpg" alt="" loading="lazy"><figcaption>Kangasala kasvaa – palveluja suunnitellaan kaikenikäisille.</figcaption></figure>
        <article class="card span-2"><h3>Kangasalan väkiluku ${first}–${y}</h3><div class="chart" id="chart-vakiluku"></div>
          <div class="card-foot"><span class="src">Lähde: ${esc(vaesto.source)}</span>${dlButtons('chart-vakiluku')}</div></article>
        <article class="card"><h3>Väestö ikäryhmittäin</h3><p class="analysis">${esc(cfg.homeIn)} 15–64-vuotiaita on ${HY.fmt(r['15-64'] / r.yhteensa * 100, null, { minDec: 1 })} % väestöstä.
          Ikärakenne ohjaa palvelutarvetta: lasten ja nuorten osuus kertoo varhaiskasvatuksen ja koulutuksen tarpeesta, ikääntyneiden osuus hoivan ja liikkumisen tuen tarpeesta.</p></article>
        <article class="card span-all"><h3>Väestö seudun kunnissa ${y}</h3>${populationTable(store)}
          <div class="card-foot"><span class="src">Lähde: ${esc(vaesto.source)}. Taulukon voi järjestää sarakeotsikkoa napsauttamalla.</span></div></article>
      </div>`;
    const csvAge = () => ['Alue;Vuosi;Yhteensä;0-14;15-64;65+', ...[...cfg.municipalities, 'Koko maa'].flatMap(n => Object.entries(vaesto.values[n]).map(([yy, v]) => [n, yy, v.yhteensa, v['0-14'], v['15-64'], v['65-']].join(';')))].join('\n');
    HY.mountChart($('#chart-ikarakenne'), HY.optAgeStructure(vaesto, cfg), { title: `Ikärakenne seudun kunnissa ${y}`, filename: 'ikarakenne', csv: csvAge });
    HY.mountChart($('#chart-vakiluku'), HY.optPopulation(vaesto, cfg), { title: `Kangasalan väkiluku ${first}–${y}`, filename: 'vakiluku', csv: csvAge });
    bindTables(root);
  }

  // ---------- Indikaattorikortti ----------
  const dlButtons = (id) => `<span class="dl" role="group" aria-label="Lataa kaavio">${['png', 'jpg', 'svg', 'csv'].map(t => `<button data-dl="${id}" data-type="${t}" title="Lataa ${t.toUpperCase()}">${t.toUpperCase()}</button>`).join('')}</span>`;

  function cardHtml(item, store) {
    const { cfg } = store;
    const v0 = item.variants.find(v => Object.keys(v.series).length) || item.variants[0];
    const hasRegions = item.variants.some(v => v.series[cfg.home]) && cfg.municipalities.filter(m => item.variants.some(v => v.series[m])).length > 1;
    const a = HY.analyse(item, v0, cfg);
    const chartId = 'chart-' + item.id;
    const variantSeg = item.variants.length > 1 ? `<div class="seg" data-role="variant">${item.variants.map((v, i) => `<button data-i="${i}" aria-pressed="${v === v0}">${esc(v.label)}</button>`).join('')}</div>` : '';
    const viewSeg = hasRegions ? `<div class="seg" data-role="view"><button data-v="region" aria-pressed="true">Seutuvertailu</button><button data-v="trend" aria-pressed="false">Kehitys</button></div>` : '';
    return `<article class="card" id="card-${item.id}" data-item="${item.id}">
      <h3>${esc(item.title)}</h3>
      <div class="meta-line"><span class="badge ${a.status === 'none' ? 'neutral' : a.status}" data-role="badge">${HY.statusLabel[a.status]}</span>
        ${item.own ? '<span class="badge own">Oma tieto</span>' : ''}${item.adult && a.focus === 'Pirkanmaa' ? '<span class="badge neutral">Pirkanmaa</span>' : ''}</div>
      <div class="controls">${variantSeg}${viewSeg}<select class="year" data-role="year" aria-label="Vuosi" ${hasRegions ? '' : 'hidden'}></select></div>
      <div class="chart" id="${chartId}" role="img" aria-label="${esc(item.title)}"></div>
      <p class="analysis" data-role="analysis">${a.html}</p>
      <div class="card-foot"><span class="src">Lähde: ${esc(item.source)}${item.updated ? ` · päivitetty ${new Date(item.updated).toLocaleDateString('fi-FI')}` : ''}${item.note ? ` · ${esc(item.note)}` : ''}</span>${dlButtons(chartId)}</div>
    </article>`;
  }

  function bindCard(el, item, store) {
    const { cfg } = store;
    const hasRegions = item.variants.some(v => v.series[cfg.home]) && cfg.municipalities.filter(m => item.variants.some(v => v.series[m])).length > 1;
    const st = { vi: Math.max(0, item.variants.findIndex(v => Object.keys(v.series).length)), view: hasRegions ? 'region' : 'trend', year: null };
    const sel = el.querySelector('[data-role="year"]');
    const chartEl = el.querySelector('.chart');
    const draw = () => {
      const v = item.variants[st.vi];
      const ys = HY.years(Object.fromEntries(cfg.municipalities.filter(m => v.series[m]).map(m => [m, v.series[m]])));
      if (hasRegions) {
        if (!ys.includes(st.year)) st.year = ys.at(-1);
        sel.innerHTML = ys.slice().reverse().map(y => `<option ${y === st.year ? 'selected' : ''}>${y}</option>`).join('');
        sel.hidden = st.view !== 'region';
      }
      const label = item.title + (v.label ? ` – ${v.label}` : '');
      const opt = st.view === 'region' && st.year ? HY.optRegionBar(item, v, st.year, cfg) : HY.optTrend(item, v, cfg);
      HY.mountChart(chartEl, opt, { title: label + (st.view === 'region' ? ` (${st.year})` : ''), filename: HY.slug(label).slice(0, 60), csv: () => HY.seriesCsv(item, v) });
      const a = HY.analyse(item, v, cfg);
      el.querySelector('[data-role="analysis"]').innerHTML = a.html;
      const b = el.querySelector('[data-role="badge"]'); b.className = 'badge ' + (a.status === 'none' ? 'neutral' : a.status); b.textContent = HY.statusLabel[a.status];
    };
    el.querySelectorAll('[data-role="variant"] button').forEach(b => b.addEventListener('click', () => {
      st.vi = +b.dataset.i; el.querySelectorAll('[data-role="variant"] button').forEach(x => x.setAttribute('aria-pressed', x === b)); draw();
    }));
    el.querySelectorAll('[data-role="view"] button').forEach(b => b.addEventListener('click', () => {
      st.view = b.dataset.v; el.querySelectorAll('[data-role="view"] button').forEach(x => x.setAttribute('aria-pressed', x === b)); draw();
    }));
    sel?.addEventListener('change', () => { st.year = +sel.value; draw(); });
    draw();
  }

  // ---------- Erityisosiot ----------
  function hyteKpis(items, store) {
    const { cfg } = store; const colors = ['var(--red)', 'var(--yellow)', 'var(--navy)', 'var(--orange)', 'var(--cyan)'];
    return `<div class="kpis five" style="margin-bottom:20px">${items.map((it, i) => {
      const s = it.variants[0].series[cfg.home] || {}; const ys = Object.keys(s).sort(); const y = ys.at(-1), p = ys.at(-2);
      const d = p ? s[y] - s[p] : null;
      return `<div class="kpi" style="--c:${colors[i % 5]}"><div class="label">${esc(it.title)}</div><div class="value">${HY.fmt(s[y], it)}</div>
        <div class="sub">${y}${d != null ? ` · <span class="${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '+' : '−'}${HY.fmt(Math.abs(d), it, { noUnit: true })}</span> vs. ${p}` : ''}</div></div>`;
    }).join('')}</div>`;
  }

  function processSection(items, store, host) {
    const { cfg } = store;
    const years = HY.years(Object.assign({}, ...items.map(it => ({ [it.id]: it.variants[0].series[cfg.home] || {} }))));
    // Oletusvuosi: viimeisin vuosi, jolta vähintään puolet indikaattoreista on julkaistu
    const covered = y => items.filter(it => it.variants[0].series[cfg.home]?.[y] != null).length;
    let year = years.slice().reverse().find(y => covered(y) >= items.length / 2) ?? years.at(-1);
    const avgHome = (y) => { const v = items.map(it => it.variants[0].series[cfg.home]?.[y]).filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
    host.innerHTML = `<div class="grid">
      <article class="card span-2"><h3>Prosessi-indikaattorit: Kangasala ja seudun kunnat</h3>
        <div class="controls"><select class="year" aria-label="Vuosi">${years.slice().reverse().map(y => `<option ${y === year ? 'selected' : ''}>${y}</option>`).join('')}</select></div>
        <div class="chart" id="chart-prosessi" style="height:${Math.max(480, items.length * 52)}px"></div>
        <p class="analysis" data-role="analysis"></p>
        <div class="card-foot"><span class="src">Lähde: Sotkanet / THL (TEAviisari). Pisteet 0–100.</span>${dlButtons('chart-prosessi')}</div></article>
      <figure class="photo-tile" style="align-self:start;aspect-ratio:3/4"><img src="assets/img/seminaari.jpg" alt="" loading="lazy"><figcaption>Prosessi-indikaattorit kuvaavat kunnan omaa hyvinvointityötä.</figcaption></figure>
      <article class="card span-all"><h3>Prosessi-indikaattorien pisteet kunnittain</h3><div class="table-wrap" data-role="table"></div>
        <div class="card-foot"><span class="src">Lähde: Sotkanet / THL. Järjestä taulukko napsauttamalla sarakeotsikkoa.</span></div></article></div>`;
    const draw = () => {
      HY.mountChart(host.querySelector('#chart-prosessi'), HY.optDotPlot(items, cfg, it => it.title.length > 58 ? it.title.slice(0, 56) + '…' : it.title, year),
        { title: `HYTE-kertoimen prosessi-indikaattorit ${year}`, filename: 'hyte-prosessi-indikaattorit', csv: () => processCsv(items, cfg) });
      const full = items.filter(it => it.variants[0].series[cfg.home]?.[year] === 100).length;
      const zero = items.filter(it => it.variants[0].series[cfg.home]?.[year] === 0).map(it => it.title);
      const avg = avgHome(year);
      host.querySelector('[data-role="analysis"]').innerHTML = `Vuonna ${year} Kangasala sai täydet 100 pistettä ${full} prosessi-indikaattorista (keskiarvo ${HY.fmt(avg)}).` +
        (zero.length ? ` Kehityskohteena: ${zero.map(esc).join('; ')} (0 pistettä).` : '');
      const th = `<tr><th>Prosessi-indikaattori</th>${cfg.municipalities.map(m => `<th class="${m === cfg.home ? 'home' : ''}">${m}</th>`).join('')}</tr>`;
      const tr = items.map(it => `<tr><td style="text-align:left">${esc(it.title)}</td>${cfg.municipalities.map(m => { const v = it.variants[0].series[m]?.[year]; return `<td data-v="${v ?? ''}" class="${m === cfg.home ? 'home' : ''} ${v === 0 ? 'neg' : ''}">${v ?? '–'}</td>`; }).join('')}</tr>`).join('');
      host.querySelector('[data-role="table"]').innerHTML = `<table class="data sortable" id="tbl-prosessi"><thead>${th}</thead><tbody>${tr}</tbody></table>`;
      bindTables(host);
    };
    host.querySelector('select').addEventListener('change', e => { year = +e.target.value; draw(); });
    draw();
  }
  const processCsv = (items, cfg) => {
    const ys = HY.years(Object.assign({}, ...items.map(it => ({ [it.id]: it.variants[0].series[cfg.home] || {} }))));
    const out = ['Indikaattori;Alue;' + ys.join(';')];
    for (const it of items) for (const m of cfg.municipalities) out.push([`"${it.title}"`, m, ...ys.map(y => it.variants[0].series[m]?.[y] ?? '')].join(';'));
    return out.join('\n');
  };

  function teaOverview(items, store, host) {
    const { cfg } = store;
    host.insertAdjacentHTML('beforeend', `<div class="grid" style="margin-bottom:20px"><article class="card span-2"><h3>TEAviisarin pisteet sektoreittain: Kangasala ja koko maa</h3>
      <div class="chart tall" id="chart-tea"></div><p class="analysis" id="tea-analysis"></p>
      <div class="card-foot"><span class="src">Lähde: Sotkanet / THL, TEAviisari. Kunkin sektorin viimeisin tiedonkeruuvuosi.</span>${dlButtons('chart-tea')}</div></article>
      <figure class="photo-tile"><img src="assets/img/teatteri.jpg" alt="" loading="lazy"><figcaption>Kulttuurin edistäminen on yksi TEAviisarin sektoreista.</figcaption></figure></div>`);
    HY.mountChart($('#chart-tea'), HY.optTea(items, cfg), { title: 'TEAviisarin pisteet sektoreittain', filename: 'teaviisari', csv: () => items.map(it => HY.seriesCsv(it, it.variants[0])).join('\n\n') });
    const better = [], worse = [];
    for (const it of items) { const s = it.variants[0].series; const y = Object.keys(s[cfg.home] || {}).sort().at(-1); const h = s[cfg.home]?.[y], n = s['Koko maa']?.[y]; if (h == null || n == null) continue; (h >= n ? better : worse).push(`${it.tea} (${h} / ${n})`); }
    $('#tea-analysis').innerHTML = `Koko maan tasoa parempi tai sama: <b>${better.map(esc).join(', ') || '–'}</b>. Koko maan tasoa heikompi: <b>${worse.map(esc).join(', ') || '–'}</b>. Suluissa Kangasala / koko maa.`;
  }

  // ---------- Kategoriasivu ----------
  function renderCategory(store, catId) {
    const { cfg, items } = store;
    const cat = cfg.categories.find(c => c.id === catId) || cfg.categories[0];
    document.title = `${cat.title} – Kangasalan hyvinvointityön indikaattorit`;
    renderChrome(store, cat.id);
    $('#page-head').innerHTML = `<div class="hero-img" style="background-image:url('assets/img/${cat.image}')"></div>
      <div class="wrap"><div class="eyebrow">Hyvinvointityön indikaattorit</div><h1>${esc(cat.title)}</h1><p>${esc(cat.intro)}</p></div>`;
    const root = $('#content'); root.innerHTML = '';
    HY.charts.forEach(r => r.chart.dispose()); HY.charts.clear();
    if (cat.id === 'vaestorakenne') { renderPopulation(store, root); return; }

    const catItems = items.filter(i => i.category === cat.id);
    const sum = HY.summarise(catItems.filter(i => !i.process), cfg);
    root.insertAdjacentHTML('beforeend', `<div class="summary"><h2>Yhteenveto: ${esc(cat.title)}</h2>
      <div class="chips"><span class="chip good"><span class="sym">▲</span> Parantunut ${sum.counts.good}</span><span class="chip bad"><span class="sym">▼</span> Heikentynyt ${sum.counts.bad}</span><span class="chip neutral"><span class="sym">●</span> Ennallaan / ei arvotusta ${sum.counts.neutral}</span></div>
      <p>${sum.goods.length ? `<b>Myönteistä kehitystä:</b> ${sum.goods.slice(0, 4).map(esc).join('; ')}${sum.goods.length > 4 ? ' ym.' : '.'} ` : ''}
      ${sum.bads.length ? `<b>Huomiota vaativat:</b> ${sum.bads.slice(0, 4).map(esc).join('; ')}${sum.bads.length > 4 ? ' ym.' : '.'}` : ''}
      ${!sum.goods.length && !sum.bads.length ? 'Indikaattoreista ei ole vielä vertailukelpoista aikasarjaa.' : ''}</p>
      <p class="notice">Vertailu tehdään Kangasalan viimeisimpään ja sitä edeltävään tietovuoteen. Vertailukunnat ovat Lempäälä, Nokia, Orivesi, Pirkkala, Tampere, Vesilahti ja Ylöjärvi.</p></div>`);

    if (cat.id === 'teaviisari') teaOverview(catItems, store, root);

    // Osiot säilyttävät järjestyksen: config ensin, sitten Excel
    const sections = [];
    for (const it of catItems) { let s = sections.find(x => x.name === it.section); if (!s) sections.push(s = { name: it.section, items: [] }); s.items.push(it); }
    const photos = [...cat.photos];
    sections.forEach((sec, si) => {
      const id = 'sec-' + HY.slug(sec.name);
      root.insertAdjacentHTML('beforeend', `<section class="section" id="${id}"><h2 class="section-title">${esc(sec.name)}<small>${sec.items.length} indikaattoria${sec.items.some(i => i.own) ? ' · kaupungin oma tieto' : ''}</small></h2><div class="host"></div></section>`);
      const host = $(`#${id} .host`);
      if (sec.items.every(i => i.process)) { processSection(sec.items, store, host); return; }
      let pre = '';
      if (sec.items.every(i => i.kpi)) pre = hyteKpis(sec.items, store);
      const cards = sec.items.map(it => cardHtml(it, store));
      // Valokuva korttien väliin, jotta sivu ei ole pelkkiä kaavioita
      if (photos.length && cards.length >= 2) {
        const p = photos.shift();
        cards.splice(Math.min(2, cards.length), 0, `<figure class="photo-tile"><img src="assets/img/${p}" alt="" loading="lazy"></figure>`);
      }
      host.innerHTML = pre + `<div class="grid">${cards.join('')}</div>`;
      sec.items.forEach(it => bindCard($(`#card-${it.id}`), it, store));
    });
    if (!catItems.length) root.insertAdjacentHTML('beforeend', '<p class="notice">Tähän yläluokkaan ei ole vielä lisätty indikaattoreita.</p>');
    if (store.ownError && catItems.some(i => i.own) === false && Object.values(cfg.excelCategories).includes(cat.id)) root.insertAdjacentHTML('beforeend', `<p class="notice">Omien tietojen Exceliä ei voitu lukea: ${esc(store.ownError)}</p>`);
  }

  // ---------- Etusivu ----------
  function renderHome(store) {
    const { cfg, items } = store;
    renderChrome(store, 'home');
    const count = (id) => id === 'vaestorakenne' ? 4 : items.filter(i => i.category === id).length;
    const all = HY.summarise(items.filter(i => !i.process && !i.kpi), cfg);
    $('#content').innerHTML = `
      <section class="section split">
        <div><h2 class="section-title">Hyvinvointityön seuranta</h2>
          <p class="lead">Raportti kokoaa yhteen Kangasalan hyvinvoinnin ja terveyden edistämisen keskeiset indikaattorit. Tiedot päivittyvät Sotkanetin ja Tilastokeskuksen rajapinnoista, ja kaupungin omat tiedot luetaan suoraan Excel-tiedostosta.</p>
          <p>Jokaisella indikaattorilla on seutuvertailu (Lempäälä, Nokia, Orivesi, Pirkkala, Tampere, Vesilahti, Ylöjärvi ja koko maa), kehitys vuosittain sekä lyhyt automaattinen analyysi.</p>
          <div class="chips" style="margin-top:12px"><span class="chip good"><span class="sym">▲</span> Parantunut ${all.counts.good}</span><span class="chip bad"><span class="sym">▼</span> Heikentynyt ${all.counts.bad}</span><span class="chip neutral"><span class="sym">●</span> Ennallaan / ei arvotusta ${all.counts.neutral}</span></div>
          <p class="notice">Kaikkien indikaattorien muutos edelliseen tietovuoteen.</p></div>
        <div><h2 class="section-title">Väestö ${store.vaesto.latestYear}<small>Tilastokeskus, 11re</small></h2>${populationKpis(store)}</div>
      </section>
      <section class="section"><h2 class="section-title">Indikaattorit</h2>
        <div class="cat-grid">${cfg.categories.map(c => `<a class="cat-card" href="indikaattorit.html#${c.id}"><img src="assets/img/${c.image}" alt="" loading="lazy">
          <span class="count">${count(c.id)} indikaattoria</span><div class="inner"><h3>${esc(c.title)}</h3><p>${esc(c.intro)}</p></div></a>`).join('')}</div></section>
      <section class="section split">
        <img src="assets/img/harjufest.jpg" alt="" loading="lazy" style="max-height:440px;object-fit:cover;width:100%">
        <div><h2 class="section-title">Lataa raportti</h2><p>Voit ladata koko raportin PowerPoint-esityksenä, jossa on kaaviot, analyysit ja yhteenvedot yläluokittain. Kaikki indikaattoritulokset saat myös Excel-tiedostona jatkokäsittelyä varten.</p>
          <div class="chips"><button class="btn btn-primary" data-export2="pptx">${icon('pptx')}Lataa PPTX</button><button class="btn btn-ghost" data-export2="xlsx">${icon('xlsx')}Lataa XLSX</button></div></div>
      </section>`;
    document.querySelectorAll('[data-export2]').forEach(b => b.addEventListener('click', () => document.querySelector(`[data-export="${b.dataset.export2}"]`).click()));
  }

  // Taulukoiden järjestäminen
  function bindTables(root) {
    root.querySelectorAll('table.sortable').forEach(t => {
      if (t.dataset.bound) return; t.dataset.bound = 1;
      t.querySelectorAll('th').forEach((th, ci) => th.addEventListener('click', () => {
        const asc = !th.classList.contains('sorted-asc');
        t.querySelectorAll('th').forEach(x => x.classList.remove('sorted-asc', 'sorted-desc')); th.classList.add(asc ? 'sorted-asc' : 'sorted-desc');
        const rows = [...t.tBodies[0].rows];
        const key = r => { const c = r.cells[ci]; const v = c.dataset.v; return v !== undefined && v !== '' && !isNaN(+v) ? +v : c.textContent.trim(); };
        rows.sort((a, b) => { const x = key(a), y = key(b); return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'fi')) * (asc ? 1 : -1); });
        rows.forEach(r => t.tBodies[0].appendChild(r));
      }));
    });
  }

  document.addEventListener('click', e => { const b = e.target.closest('[data-dl]'); if (b) HY.exportChart(b.dataset.dl, b.dataset.type); });

  HY.start = async function (page) {
    try {
      const store = await HY.load();
      if (page === 'home') renderHome(store);
      else {
        const go = () => { renderCategory(store, location.hash.slice(1) || store.cfg.categories[0].id); window.scrollTo({ top: 0 }); };
        window.addEventListener('hashchange', go); go();
      }
    } catch (e) {
      console.error(e);
      document.querySelector('#content').innerHTML = `<p class="loading">Tietojen lataus epäonnistui: ${esc(e.message)}</p>`;
    }
  };
})(window.HY);

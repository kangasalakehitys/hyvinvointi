/* Automaattinen lyhyt analyysi indikaattorille: muutos, suunta, sijoitus seudulla, ero koko maahan. */
(function (HY) {
  const near = (a, b) => Math.abs(a - b) < 1e-9;

  // Palauttaa { status: good|bad|neutral|none, text, html, latestYear, latest, prevYear, prev }
  HY.analyse = function (item, variant, cfg) {
    const focus = variant.series[cfg.home] ? cfg.home : (variant.series.Pirkanmaa ? 'Pirkanmaa' : null);
    if (!focus) return { status: 'none', text: 'Tietoa ei ole saatavilla.', html: 'Tietoa ei ole saatavilla.' };
    const s = variant.series[focus];
    const ys = Object.keys(s).map(Number).sort((a, b) => a - b);
    const yL = ys.at(-1), vL = s[yL];
    const yP = ys.length > 1 ? ys.at(-2) : null, vP = yP != null ? s[yP] : null;
    const f = v => HY.fmt(v, item);
    const who = focus === cfg.home ? cfg.home : 'Pirkanmaalla';
    const parts = [];
    const lead = focus === cfg.home ? (cfg.homeIn || cfg.home) : 'Pirkanmaalla';
    parts.push(`${lead} arvo oli <b>${f(vL)}</b> vuonna ${yL}${yP != null ? ` (${yP}: ${f(vP)})` : ''}.`);

    let status = 'neutral';
    if (vP != null) {
      const diff = vL - vP;
      const pctUnit = item.unit === '%';
      const amount = pctUnit ? `${HY.fmt(Math.abs(diff), null)} %-yks.` : (vP !== 0 ? `${HY.fmt(Math.abs(diff / vP * 100), null)} %` : HY.fmt(Math.abs(diff), item));
      if (near(diff, 0)) parts.push('Arvo pysyi ennallaan.');
      else if (item.better) {
        const improved = item.better === 'lower' ? diff < 0 : diff > 0;
        status = improved ? 'good' : 'bad';
        parts.push(`Tilanne on ${improved ? 'parantunut' : 'heikentynyt'} (${diff > 0 ? '+' : '−'}${amount}).`);
      } else parts.push(`Arvo on ${diff > 0 ? 'kasvanut' : 'laskenut'} ${amount}.`);
    } else status = 'neutral';

    // Sijoitus seudun kuntien joukossa samana vuonna
    if (focus === cfg.home && item.better) {
      const vals = cfg.municipalities.map(m => [m, variant.series[m]?.[yL]]).filter(([, v]) => v != null);
      if (vals.length >= 3) {
        vals.sort((a, b) => item.better === 'lower' ? a[1] - b[1] : b[1] - a[1]);
        const rank = vals.findIndex(([m]) => m === cfg.home) + 1;
        const rankText = rank === 1 ? 'seudun paras' : rank === vals.length ? 'seudun heikoin' : `${rank}. paras`;
        parts.push(`Seudun ${vals.length} kunnan vertailussa Kangasala on ${rankText}.`);
      }
    }
    const nat = variant.series['Koko maa']?.[yL];
    if (nat != null && focus === cfg.home) {
      const d = vL - nat;
      let cmp = near(d, 0) ? 'samalla tasolla kuin' : (d > 0 ? 'korkeampi kuin' : 'matalampi kuin');
      if (item.better && !near(d, 0)) {
        const better = item.better === 'lower' ? d < 0 : d > 0;
        cmp = better ? 'parempi kuin' : 'heikompi kuin';
      }
      parts.push(`Arvo on ${cmp} koko maassa (${f(nat)}${item.nationalComputed ? ', kuntien keskiarvo' : ''}).`);
    }
    if (focus !== cfg.home) parts.push('Kuntakohtaista tietoa ei ole saatavilla, joten näytetään Pirkanmaan taso.');
    const html = parts.join(' ');
    return { status, html, text: html.replace(/<[^>]+>/g, ''), latestYear: yL, latest: vL, prevYear: yP, prev: vP, focus, who };
  };

  HY.statusLabel = { good: 'Parantunut', bad: 'Heikentynyt', neutral: 'Ennallaan / ei arvotusta', none: 'Ei tietoa' };

  // Yläluokan yhteenveto
  HY.summarise = function (items, cfg) {
    const counts = { good: 0, bad: 0, neutral: 0 };
    const goods = [], bads = [];
    for (const it of items) {
      for (const v of it.variants) {
        const a = HY.analyse(it, v, cfg);
        if (a.status === 'none') continue;
        counts[a.status]++;
        const name = it.title.replace(/,? ?%$/, '') + (v.label ? ` (${v.label})` : '');
        if (a.status === 'good') goods.push(name); if (a.status === 'bad') bads.push(name);
      }
    }
    return { counts, goods, bads };
  };
})(window.HY);

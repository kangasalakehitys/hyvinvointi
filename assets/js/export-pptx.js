/* Koko raportti PowerPointiksi (PptxGenJS). Ulkoasu: pptx_template.md / brand_overview.md */
(function (HY) {
  const BG = 'assets/brand/pptx/';
  const SUB_BGS = ['head_blue_bg.jpg', 'head_cyan_bg.jpg', 'head_grey_bg.jpg', 'head_orange_bg.jpg', 'head_yellow_bg.jpg'];
  const END_BGS = ['head_pic_1_bg.jpg', 'head_pic_2_bg.jpg', 'head_pic_3_bg.jpg', 'head_pic_4_bg.jpg', 'head_pic_5_bg.jpg', 'head_pic_6_bg.jpg'];
  const FONT = 'Century Gothic';
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const strip = (h) => String(h).replace(/<[^>]+>/g, '');

  async function toDataUrl(url) {
    const blob = await (await fetch(url)).blob();
    return new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
  }

  HY.exportPptx = async function (store) {
    const { cfg, items, vaesto } = store;
    const bg = {};
    for (const f of ['front_bg_red.jpg', 'txt_bg_white.jpg', ...SUB_BGS, ...END_BGS]) bg[f] = await toDataUrl(BG + f);

    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 in
    pptx.title = 'Kangasalan hyvinvointityön indikaattorit';
    pptx.company = 'Kangasalan kaupunki';
    const W = 13.33;
    // Taustat diapohjiin, jolloin kukin kuva tallentuu tiedostoon vain kerran
    for (const f of Object.keys(bg)) pptx.defineSlideMaster({ title: f, background: { data: bg[f] } });
    const slideWith = (f) => pptx.addSlide({ masterName: f });
    const date = new Date().toLocaleDateString('fi-FI');

    const footer = (s, text) => s.addText(text, { x: 0.6, y: 6.95, w: 10.5, h: 0.35, fontFace: FONT, fontSize: 10, color: '6B6B75' });
    const contentSlide = (title) => {
      const s = slideWith('txt_bg_white.jpg');
      s.addText(title, { x: 0.6, y: 0.35, w: W - 1.6, h: 0.95, fontFace: FONT, fontSize: 28, bold: true, color: 'E01F27', fit: 'shrink', valign: 'top' });
      return s;
    };
    const subtitleSlide = (title, intro) => {
      const s = slideWith(pick(SUB_BGS));
      s.addText(title, { x: 0.8, y: 2.3, w: 8.8, h: 1.4, fontFace: FONT, fontSize: 40, bold: true, color: 'FFFFFF' });
      if (intro) s.addText(intro, { x: 0.8, y: 3.8, w: 8.4, h: 1.6, fontFace: FONT, fontSize: 18, color: 'FFFFFF', valign: 'top' });
      return s;
    };
    const chartImg = (opt, w = 960, h = 540) => HY.renderImage(opt, { type: 'jpg', width: w, height: h, bg: '#ffffff', pixelRatio: 1.6 });

    // 1. Kansi
    let s = slideWith('front_bg_red.jpg');
    s.addText('Hyvinvoinnin ja terveyden edistäminen', { x: 2.2, y: 2.3, w: 10.3, h: 1.7, fontFace: FONT, fontSize: 48, bold: true, color: 'FFFFFF' });
    s.addText('Kangasalan hyvinvointityön indikaattoriraportti', { x: 2.2, y: 4.0, w: 10, h: 0.6, fontFace: FONT, fontSize: 24, color: 'FFFFFF' });
    s.addText(`${date} · Hyvinvointikoordinaattori Marjut Hietaniemi`, { x: 2.2, y: 4.7, w: 10, h: 0.5, fontFace: FONT, fontSize: 16, color: 'FFFFFF' });

    // 2. Saate ja väestö
    const y = vaesto.latestYear, r = vaesto.values[cfg.home][y];
    s = contentSlide('Kangasala luo edellytyksiä aktiiviselle ja hyvinvoivalle elämälle');
    s.addText([
      { text: 'Kangasalan kaupunki luo edellytyksiä aktiiviselle ja hyvinvoivalle elämälle turvallisessa ja viihtyisässä elinympäristössä.', options: { breakLine: true } },
      { text: ' ', options: { breakLine: true } },
      { text: 'Tämä hyvinvointityön indikaattoriraportti kokoaa yhteen Kangasalan hyvinvoinnin ja terveyden edistämisen keskeiset indikaattorit ja niiden seurannan.' }
    ], { x: 0.6, y: 1.4, w: 5.6, h: 3.2, fontFace: FONT, fontSize: 16, color: '000000', valign: 'top' });
    const kp = vaesto.groups.map((g, i) => ({ g, v: r[g.id], c: ['DE232F', 'FCB316', '28336C', '00ADC5'][i] }));
    kp.forEach((k, i) => {
      const x = 6.6 + (i % 2) * 2.9, yy = 1.5 + Math.floor(i / 2) * 1.75;
      s.addShape(pptx.ShapeType.rect, { x, y: yy, w: 2.7, h: 1.55, fill: { color: 'FFFFFF' }, line: { color: 'E4E4E8' } });
      s.addShape(pptx.ShapeType.rect, { x, y: yy, w: 2.7, h: 0.09, fill: { color: k.c }, line: { color: k.c } });
      s.addText(k.g.label, { x: x + 0.15, y: yy + 0.15, w: 2.4, h: 0.35, fontFace: FONT, fontSize: 12, color: '5C5C66' });
      s.addText(k.v.toLocaleString('fi-FI'), { x: x + 0.15, y: yy + 0.5, w: 2.4, h: 0.55, fontFace: FONT, fontSize: 26, bold: true, color: '000000' });
      s.addText(k.g.id === 'yhteensa' ? `asukasta ${y}` : `${HY.fmt(k.v / r.yhteensa * 100, null, { minDec: 1 })} % väestöstä`, { x: x + 0.15, y: yy + 1.05, w: 2.4, h: 0.35, fontFace: FONT, fontSize: 12, color: '000000' });
    });
    s.addImage({ data: chartImg(HY.optAgeStructure(vaesto, cfg), 760, 312), x: 0.6, y: 4.6, w: 5.6, h: 2.3 });
    footer(s, `Lähde: ${vaesto.source}`);

    // 3. Yläluokat
    for (const cat of cfg.categories) {
      const catItems = items.filter(i => i.category === cat.id);
      subtitleSlide(cat.title, cat.intro);
      if (cat.id === 'vaestorakenne') {
        s = contentSlide(`Kangasalan väkiluku oli ${r.yhteensa.toLocaleString('fi-FI')} vuonna ${y}`);
        s.addImage({ data: chartImg(HY.optPopulation(vaesto, cfg), 740, 416), x: 0.6, y: 1.4, w: 7.4, h: 4.16 });
        s.addImage({ data: chartImg(HY.optAgeStructure(vaesto, cfg), 560, 470), x: 8.2, y: 1.4, w: 4.5, h: 3.8 });
        footer(s, `Lähde: ${vaesto.source}`);
        continue;
      }
      if (!catItems.length) continue;

      // Yhteenvetodia
      const sum = HY.summarise(catItems.filter(i => !i.process), cfg);
      s = contentSlide(`${cat.title}: yhteenveto`);
      const tiles = [['Parantunut', sum.counts.good, '009651'], ['Heikentynyt', sum.counts.bad, 'DE232F'], ['Ennallaan / ei arvotusta', sum.counts.neutral, '28336C']];
      tiles.forEach(([l, n, c], i) => {
        s.addShape(pptx.ShapeType.roundRect, { x: 0.6 + i * 3.1, y: 1.5, w: 2.9, h: 1.3, fill: { color: c }, line: { color: c }, rectRadius: 0.1 });
        s.addText([{ text: String(n), options: { fontSize: 32, bold: true, breakLine: true } }, { text: l, options: { fontSize: 13 } }], { x: 0.6 + i * 3.1, y: 1.5, w: 2.9, h: 1.3, fontFace: FONT, color: 'FFFFFF', align: 'center', valign: 'middle' });
      });
      const bullets = [];
      if (sum.goods.length) bullets.push({ text: 'Myönteistä kehitystä: ' + sum.goods.slice(0, 5).join('; '), options: { bullet: true, breakLine: true } });
      if (sum.bads.length) bullets.push({ text: 'Huomiota vaativat: ' + sum.bads.slice(0, 5).join('; '), options: { bullet: true, breakLine: true } });
      if (!bullets.length) bullets.push({ text: 'Indikaattoreista ei ole vielä vertailukelpoista aikasarjaa.', options: { bullet: true } });
      s.addText(bullets, { x: 0.6, y: 3.1, w: 9.2, h: 3.5, fontFace: FONT, fontSize: 16, color: '000000', valign: 'top', fit: 'shrink' });
      footer(s, 'Muutos Kangasalan viimeisimmästä ja sitä edeltävästä tietovuodesta.');

      if (cat.id === 'teaviisari') {
        s = contentSlide('TEAviisarin pisteet sektoreittain: Kangasala ja koko maa');
        s.addImage({ data: chartImg(HY.optTea(catItems, cfg), 860, 440), x: 0.6, y: 1.4, w: 10.4, h: 5.3 });
        footer(s, 'Lähde: Sotkanet / THL, TEAviisari');
      }

      // Prosessi-indikaattorit taulukkona
      const proc = catItems.filter(i => i.process);
      if (proc.length) {
        const yrs = HY.years(Object.assign({}, ...proc.map(it => ({ [it.id]: it.variants[0].series[cfg.home] || {} })))); const py = yrs.at(-1);
        s = contentSlide(`HYTE-kertoimen prosessi-indikaattorit ${py}`);
        const head = [{ text: 'Prosessi-indikaattori', options: { bold: true, color: 'FFFFFF', fill: { color: '28336C' } } },
          ...cfg.municipalities.map(m => ({ text: m, options: { bold: true, color: 'FFFFFF', fill: { color: '28336C' }, align: 'center' } }))];
        const body = proc.map(it => [{ text: it.title }, ...cfg.municipalities.map(m => { const v = it.variants[0].series[m]?.[py]; return { text: v == null ? '–' : String(v), options: { align: 'center', bold: m === cfg.home, color: v === 0 ? 'DE232F' : '000000' } }; })]);
        s.addTable([head, ...body], { x: 0.4, y: 1.3, w: 12.5, colW: [4.9, ...cfg.municipalities.map(() => 7.6 / cfg.municipalities.length)], fontFace: FONT, fontSize: 9, border: { type: 'solid', color: 'E4E4E8', pt: 0.5 }, autoPage: false });
        footer(s, 'Lähde: Sotkanet / THL. Pisteet 0–100.');
      }

      // Indikaattorikohtaiset diat
      for (const it of catItems.filter(i => !i.process)) {
        const v = it.variants.find(x => x.series[cfg.home]) || it.variants.find(x => Object.keys(x.series).length);
        if (!v) continue;
        const a = HY.analyse(it, v, cfg);
        const regional = cfg.municipalities.filter(m => v.series[m]).length > 1 && a.focus === cfg.home;
        const opt = regional ? HY.optRegionBar(it, v, a.latestYear, cfg) : HY.optTrend(it, v, cfg);
        s = contentSlide(it.title);
        s.addImage({ data: chartImg(opt, 680, 470), x: 0.6, y: 1.4, w: 7.4, h: 5.1 });
        const lines = [{ text: regional ? `Seutuvertailu ${a.latestYear}${v.label ? ', ' + v.label : ''}` : `Kehitys${v.label ? ', ' + v.label : ''}`, options: { bold: true, color: '28336C', breakLine: true } }];
        for (const vv of it.variants) {
          const aa = HY.analyse(it, vv, cfg);
          if (aa.status === 'none') continue;
          const mark = aa.status === 'good' ? '▲ ' : aa.status === 'bad' ? '▼ ' : '● ';
          lines.push({ text: (it.variants.length > 1 ? `${mark}${vv.label}: ` : mark) + strip(aa.html), options: { bullet: false, breakLine: true, paraSpaceBefore: 8 } });
        }
        s.addText(lines, { x: 8.3, y: 1.45, w: 4.5, h: 5.2, fontFace: FONT, fontSize: 14, color: '000000', valign: 'top', fit: 'shrink' });
        footer(s, `Lähde: ${it.source}${it.updated ? ', päivitetty ' + new Date(it.updated).toLocaleDateString('fi-FI') : ''}`);
      }
    }

    // Loppudia
    s = slideWith(pick(END_BGS));
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 5.2, w: W, h: 2.3, fill: { color: '000000', transparency: 45 }, line: { color: '000000', transparency: 100 } });
    s.addText('Kiitos!', { x: 0.8, y: 5.35, w: 8, h: 1.0, fontFace: FONT, fontSize: 48, bold: true, color: 'FFFFFF' });
    s.addText('Hyvinvointikoordinaattori Marjut Hietaniemi · kangasala.fi/koe-viihdy-ja-ela/hyvinvoinnin-ja-terveyden-edistaminen', { x: 0.8, y: 6.4, w: 11.5, h: 0.6, fontFace: FONT, fontSize: 16, color: 'FFFFFF' });

    await pptx.writeFile({ fileName: `kangasala-hyvinvointityon-indikaattorit-${new Date().toISOString().slice(0, 10)}.pptx` });
  };
})(window.HY);

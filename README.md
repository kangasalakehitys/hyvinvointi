# Kangasalan hyvinvointityön indikaattorit

Staattinen verkkosivusto (GitHub Pages), joka näyttää Kangasalan hyvinvoinnin ja terveyden edistämisen indikaattorit, vertaa niitä seudun kuntiin (Lempäälä, Nokia, Orivesi, Pirkkala, Tampere, Vesilahti, Ylöjärvi) sekä Pirkanmaahan ja koko maahan.

- `index.html` on etusivu. Siinä ovat saateteksti, väestön tunnusluvut ja yläluokat.
- `indikaattorit.html#<yläluokka>` näyttää yhden yläluokan kaikki indikaattorit, ja yläluokkavalikko pysyy näkyvissä.
- **Lataa PPTX** luo selaimessa brändätyn esityksen koko aineistosta.
- **Lataa XLSX** tallentaa kaikki tulokset, analyysit ja väestötiedot Excel-tiedostoon.
- Jokaisen kaavion voi ladata PNG-, JPG-, SVG- ja CSV-muodossa.

## Tietolähteet

| Lähde | Mitä | Tiedosto |
|---|---|---|
| Sotkanet (THL) REST API | HYTE-kerroin, kouluterveyskysely, TEAviisari, rikokset, tapaturmat, Terveytemme | `data/sotkanet.json` |
| Tilastokeskus 11re (maksuton) | Väestö ikäryhmittäin (0–14, 15–64, 65+) | `data/vaesto.json` |
| Kaupungin oma Excel | Tiedot, joita ei saa rajapinnasta | `data/hyte_data_kangasala.xlsx` |

## Päivitys

```bash
npm run update      # hakee Sotkanetin ja Tilastokeskuksen tiedot data/-kansioon
git add data && git commit -m "Tietojen päivitys" && git push
```

Komento ei tarvitse riippuvuuksia, Node 18+ riittää. Jos jokin lähde ei vastaa, sen vanha tiedosto jää ennalleen.

**Oma Excel** luetaan selaimessa suoraan repon `data/`-kansiosta. Kun Exceliä päivitetään, riittää commit ja push. Sarakkeiden merkitys:

- `Kunta`
- `Kategoria` (= osion otsikko)
- `Alakategoria` (= indikaattorin nimi)
- `Vuosi` (x-akseli)
- `Arvo` (y-akseli)

`Vastuutaho`-saraketta ei näytetä sivulla eikä latauksissa. Excelin voi lukea myös toisesta GitHub-osoitteesta: vaihda `config/indicators.json` → `ownData.url` (esim. `https://raw.githubusercontent.com/<org>/<repo>/main/data/hyte_data_kangasala.xlsx`).

## Uuden indikaattorin lisääminen

- **Sotkanet:** lisää rivi `config/indicators.json` → `indicators` ja aja `npm run update`. Määritä kentät:
  - `category`: yläluokan id
  - `section`: osion otsikko
  - `better`: `lower` tai `higher`
  - `variants`: `[{ "label": "8.–9. lk", "id": 1234 }]`
- **Oma tieto:** lisää rivit Exceliin. Uusi `Kategoria` liitetään yläluokkaan kartassa `excelCategories`.
- **Uusi tietolähde:** tee `scripts/fetch-<lähde>.mjs` ja lisää se `scripts/update.mjs`-tiedoston `SOURCES`-listaan.
- **Uusi yläluokka:** lisää se `categories`-listaan (id, otsikko, ikoni ja kuva kansiosta `assets/img/`).

## Huomioita tiedoista

- **Nukkuu arkisin vähintään 8 tuntia** lasketaan Sotkanetin indikaattorista "Nukkuu arkisin alle 8 tuntia" (100 − arvo). Vuosiraportin luvut (64 / 62 %) poikkeavat hieman, koska ne ovat Kouluterveyskyselyn omasta raportoinnista.
- **TEAviisarin kokonaispisteille** (kaikki sektorit) Sotkanet ei julkaise koko maan arvoa. Vertailuarvo on siksi kaikkien kuntien keskiarvo, ja se on merkitty sivulle.
- **Aikuisten Terveytemme-indikaattoreista** ei ole Kangasalan kuntatietoa, joten niistä näytetään Pirkanmaan kehitys.
- **Käyttää nikotiinipusseja nykyisin, %** ei ole Sotkanetissa, joten luvut ovat omassa Excelissä.

## Paikallinen esikatselu

```bash
python -m http.server 8000   # → http://localhost:8000
```

Century Gothic -fonttia ei julkaista (lisenssi). Sivusto käyttää Century Gothicia, jos se on asennettu käyttäjän koneelle, ja muuten Questrial-fonttia.

/* site.js — behaviour of the pages around the map: pictures, saved listings, menu, home search and the listing page. */
(function () {
  'use strict';
  const W = window, D = document, ROOT = D.documentElement.dataset.root || '', LANG = D.documentElement.lang.slice(0, 2);
  const $ = (s, el) => (el || D).querySelector(s), $$ = (s, el) => [...(el || D).querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const ICON = {
    heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z', check: 'M5 12.5l4.5 4.5L19 7.5', alert: 'M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16M12 8v4.5M12 15.5h.01',
    eye: 'M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12zM12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6', pin: 'M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11zM12 7.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5'
  };
  const ic = (d, s, fill) => '<svg class="ic" viewBox="0 0 24 24" width="' + (s || 16) + '" height="' + (s || 16) + '" fill="' + (fill || 'none') + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';

  /* ---------- saved listings: shared with the map (which keeps only Zürich) ---------- */
  const APP_KEY = 'lage-proto-v1', KEY = 'lage-saved-v1';
  const read = k => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch (e) { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } };
  function savedMap() {
    const own = read(KEY) || {}, app = read(APP_KEY);
    if (app && app.saved) for (const id in app.saved) if (!own[id]) own[id] = app.saved[id];
    return own;
  }
  function toggleSaved(id) {
    const s = savedMap(), on = !s[id];
    if (on) s[id] = Date.now(); else delete s[id];
    write(KEY, s);
    const app = read(APP_KEY);
    if (app && app.saved && !on && app.saved[id]) { delete app.saved[id]; write(APP_KEY, app); }
    if (app && on && !id.includes('-')) { app.saved = app.saved || {}; app.saved[id] = s[id]; write(APP_KEY, app); }
    paintSaved();
    return on;
  }
  function paintSaved() {
    const s = savedMap(), n = Object.keys(s).length;
    $$('[data-save]').forEach(b => { const on = !!s[b.dataset.save]; b.setAttribute('aria-pressed', String(on)); });
    $$('.saved-n').forEach(el => { el.textContent = n; });
  }
  D.addEventListener('click', e => {
    const b = e.target.closest('[data-save]');
    if (b) { e.preventDefault(); toggleSaved(b.dataset.save); return; }
    const m = e.target.closest('.menu-btn');
    if (m) { const hd = m.closest('.hd'), open = !hd.classList.contains('is-open'); hd.classList.toggle('is-open', open); m.setAttribute('aria-expanded', String(open)); }
  });

  /* ---------- pictures: drawn from the sample data when a card comes near ---------- */
  const find = id => W.CITIES ? W.CITIES.byId(id) : null;
  function hydrate(root) {
    if (!W.SCENE || !W.CITIES) return;
    const imgs = $$('img[data-l]:not([src])', root);
    const fill = img => { const l = find(img.dataset.l); if (l) img.src = W.SCENE.img(l, img.dataset.k); };
    if (!('IntersectionObserver' in W)) { imgs.forEach(fill); return; }
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { io.unobserve(en.target); fill(en.target); } }), {rootMargin: '700px 0px'});
    imgs.forEach(i => io.observe(i));
  }

  /* ---------- texts for the listing page and the saved list ---------- */
  const T = {
    de: {home: 'Lage', rent: 'Mieten', buy: 'Kaufen', perMonth: '/ Mt. inkl. NK', price: 'Kaufpreis', rooms: 'Zimmer', area: 'Fläche', floor: 'Etage', year: 'Baujahr', baths: 'Bäder', move: 'Einzug',
      ground: 'EG', checks: 'Das prüft Lage', fits: 'Passt zu diesen Suchen', know: 'Gut zu wissen', ask: 'Besichtigung anfragen', askBuy: 'Dokumentation anfragen', map: 'Auf der Karte ansehen', save: 'Merken', saved: 'Gemerkt',
      name: 'Name', mail: 'E-Mail', msg: 'Nachricht', send: 'Anfrage vorbereiten', sent: 'Prototyp: Die Anfrage ging nirgends hin, es wurde nichts verschickt oder gespeichert.', view: 'Aussicht', viewOf: 'von 10',
      night: 'Nachts an der Fassade', quiet: 'ruhig', loud: 'laut', sun: 'Sonne im Jahresmittel', h: 'Std. pro Tag', pt: 'Mit ÖV zum Bahnhof', min: 'Min.', notFound: 'Dieses Inserat gibt es nicht mehr.', back: 'Zur Startseite',
      lake: ['', 'See: ein Streifen', 'See breit im Blick', 'Seepanorama'], gal: {'view:day': 'Aussicht am Mittag', 'view:golden': 'Aussicht am Abend', 'view:night': 'Aussicht in der Nacht', 'room:wohnen': 'Wohnen', 'room:aussen': 'Aussenraum', 'room:kueche': 'Küche', 'room:bad': 'Bad', 'house:day': 'Das Haus'},
      empty: 'Noch nichts gemerkt. Tippe auf das Herz bei einem Inserat.', sample: 'Beispieldaten'},
    fr: {home: 'Lage', rent: 'Louer', buy: 'Acheter', perMonth: '/ mois charges comprises', price: 'Prix de vente', rooms: 'Pièces', area: 'Surface', floor: 'Étage', year: 'Construction', baths: 'Salles de bain', move: 'Disponible',
      ground: 'rez', checks: 'Ce que Lage vérifie', fits: 'Correspond à ces recherches', know: 'Bon à savoir', ask: 'Demander une visite', askBuy: 'Demander la documentation', map: 'Voir sur la carte', save: 'Sauvegarder', saved: 'Sauvegardé',
      name: 'Nom', mail: 'E-mail', msg: 'Message', send: 'Préparer la demande', sent: 'Prototype : la demande n’a été envoyée nulle part et rien n’a été enregistré.', view: 'Vue', viewOf: 'sur 10',
      night: 'La nuit en façade', quiet: 'calme', loud: 'bruyant', sun: 'Soleil en moyenne', h: 'h par jour', pt: 'En transports publics jusqu’à la gare', min: 'min', notFound: 'Cette annonce n’existe plus.', back: 'Accueil',
      lake: ['', 'Lac : une bande', 'Large vue sur le lac', 'Panorama sur le lac'], gal: {'view:day': 'Vue à midi', 'view:golden': 'Vue le soir', 'view:night': 'Vue la nuit', 'room:wohnen': 'Séjour', 'room:aussen': 'Extérieur', 'room:kueche': 'Cuisine', 'room:bad': 'Salle de bain', 'house:day': 'L’immeuble'},
      empty: 'Rien de sauvegardé pour l’instant.', sample: 'Données d’exemple'},
    en: {home: 'Lage', rent: 'Rent', buy: 'Buy', perMonth: '/ month incl. utilities', price: 'Price', rooms: 'Rooms', area: 'Area', floor: 'Floor', year: 'Built', baths: 'Bathrooms', move: 'Available',
      ground: 'GF', checks: 'What Lage checks', fits: 'Matches these searches', know: 'Good to know', ask: 'Request a viewing', askBuy: 'Request documents', map: 'Show on the map', save: 'Save', saved: 'Saved',
      name: 'Name', mail: 'Email', msg: 'Message', send: 'Prepare request', sent: 'Prototype: the request went nowhere; nothing was sent or stored.', view: 'View', viewOf: 'of 10',
      night: 'At night at the facade', quiet: 'quiet', loud: 'loud', sun: 'Sun, yearly average', h: 'h per day', pt: 'By public transport to the station', min: 'min', notFound: 'This listing is no longer available.', back: 'Home',
      lake: ['', 'Lake: a strip', 'Wide lake view', 'Lake panorama'], gal: {'view:day': 'View at noon', 'view:golden': 'View in the evening', 'view:night': 'View at night', 'room:wohnen': 'Living', 'room:aussen': 'Outdoor space', 'room:kueche': 'Kitchen', 'room:bad': 'Bathroom', 'house:day': 'The building'},
      empty: 'Nothing saved yet.', sample: 'Sample data'}
  };
  const FEAT = [
    [l => l.wm, 'Eigene Waschmaschine', 'Lave-linge privé', 'Own washing machine'], [l => l.garden, 'Eigener Garten', 'Jardin privatif', 'Private garden'],
    [l => l.gardenShared, 'Garten zum Mitbenutzen', 'Jardin commun', 'Shared garden'], [l => l.roofTerrace, 'Dachterrasse', 'Terrasse sur le toit', 'Roof terrace'],
    [l => l.baths >= 2, l => l.baths + ' Bäder', l => l.baths + ' salles de bain', l => l.baths + ' bathrooms'], [l => l.bathtub, 'Badewanne', 'Baignoire', 'Bathtub'],
    [l => l.dishwasher, 'Geschirrspüler', 'Lave-vaisselle', 'Dishwasher'], [l => l.lift, 'Lift', 'Ascenseur', 'Lift'], [l => l.pets, 'Haustiere erlaubt', 'Animaux admis', 'Pets allowed'],
    [l => l.parking, 'Parkplatz', 'Place de parc', 'Parking'], [l => l.evCharge, 'Ladestation', 'Borne de recharge', 'EV charger'], [l => l.fireplace, 'Cheminée', 'Cheminée', 'Fireplace'],
    [l => l.highCeil, 'Hohe Decken', 'Hauts plafonds', 'High ceilings'], [l => l.openKitchen, 'Offene Küche', 'Cuisine ouverte', 'Open kitchen'], [l => l.klima, 'Klimaanlage', 'Climatisation', 'Air conditioning'],
    [l => l.pool, 'Pool', 'Piscine', 'Pool'], [l => l.sauna, 'Sauna', 'Sauna', 'Sauna'], [l => l.fitness, 'Fitnessraum im Haus', 'Salle de sport', 'Gym in the building'],
    [l => l.concierge, 'Concierge', 'Conciergerie', 'Concierge'], [l => l.ownEntrance, 'Eigener Eingang', 'Entrée indépendante', 'Own entrance'], [l => l.atelier, 'Atelier oder Hobbyraum', 'Atelier', 'Studio or hobby room'],
    [l => l.wintergarten, 'Wintergarten', 'Jardin d’hiver', 'Conservatory'], [l => l.minergie, 'Minergie', 'Minergie', 'Minergie'], [l => l.fiber, 'Glasfaser', 'Fibre optique', 'Fibre'],
    [l => l.wheelchair, 'Rollstuhlgängig', 'Accessible en fauteuil roulant', 'Wheelchair accessible'], [l => l.atLake, 'Direkt am See', 'Au bord du lac', 'By the lake'],
    [l => l.lakeFront, l => 'Seeanstoss' + (l.boat ? ' mit Bootsplatz' : ''), 'Pieds dans l’eau', 'Lakefront'], [l => l.atRiver || l.riverView, 'Am Fluss', 'Près de la rivière', 'By the river'],
    [l => l.forestEdge, 'Am Waldrand', 'En lisière de forêt', 'Near the forest'], [l => l.einlieger, 'Mit Einliegerwohnung', 'Avec studio indépendant', 'With a granny flat'],
    [l => l.umschwung, 'Viel Umschwung', 'Grand terrain', 'Large plot'], [l => l.baurecht, 'Im Baurecht', 'En droit de superficie', 'Leasehold (Baurecht)']
  ];
  const lbl = (v, l) => typeof v === 'function' ? v(l) : v;
  const titleOf = (l, lang) => W.CITIES ? W.CITIES.title(l, lang) : l.title;
  const priceOf = (l, t) => '<b>' + esc(W.DATA.fmt.price(l)) + '</b>' + (l.deal === 'rent' ? ' <span class="per">' + t.perMonth + '</span>' : '');
  const floorOf = (l, t, lang) => l.floor === 0 ? t.ground : l.floor + ((lang || LANG) === 'de' ? '. OG' : (lang || LANG) === 'fr' ? 'e' : '');
  const cardKeys = l => ['view:day', l.eve ? 'view:golden' : 'view:night', 'room:wohnen', l.outdoor ? 'room:aussen' : 'house:day'];
  /* the same card as the generated pages, for lists drawn in the browser */
  function cardHtml(l, lang) {
    const t = T[lang], href = ROOT + 'inserat.html#' + (lang === 'de' ? '' : lang + '-') + l.id;
    return '<article class="card"><a class="card-photo" href="' + href + '" aria-label="' + esc(titleOf(l, lang)) + '">' + cardKeys(l).map(k => '<span class="mo-c"><img data-l="' + l.id + '" data-k="' + k + '" alt="" decoding="async"></span>').join('') +
      '<span class="photo-badge' + (l.view >= 8 ? ' is-top' : '') + '">' + ic(ICON.eye, 13) + l.view.toFixed(1) + '</span></a>' +
      '<button type="button" class="heart" data-save="' + l.id + '" aria-pressed="false" aria-label="' + t.save + '"><span>' + ic(ICON.heart, 18, 'currentColor') + '</span></button>' +
      '<a class="card-body" href="' + href + '"><span class="card-q trunc">' + esc(l.quarter) + '</span><span class="card-t">' + esc(titleOf(l, lang)) + '</span>' +
      '<span class="card-s">' + W.DATA.fmt.zi(l) + ' ' + t.rooms + ' · ' + l.m2 + ' m² · ' + floorOf(l, t, lang) + '</span><span class="card-p">' + priceOf(l, t) + '</span></a></article>';
  }

  /* ---------- the listing page ---------- */
  const PLACE_LANG = {geneve: 'fr', lausanne: 'fr', leman: 'fr'};
  function pagesFor(l) {
    const S = W.SEO, out = [];
    if (!S || !W.LAGE) return out;
    for (const p of S.pages) {
      if (p.deal !== l.deal || (p.place !== l.place && p.place !== 'schweiz')) continue;
      const test = W.LAGE.TESTS[p.test];
      if (test && test(l, l.deal)) out.push(p);
    }
    return out.slice(0, 8);
  }
  function renderListing(root) {
    const raw = decodeURIComponent((location.hash || '').slice(1)), m = /^(fr|en)-(.+)$/.exec(raw), lang = m ? m[1] : (PLACE_LANG[(find(raw) || {}).place] || 'de'), id = m ? m[2] : raw;
    const l = id && find(id), t = T[lang];
    D.documentElement.lang = lang === 'de' ? 'de-CH' : lang === 'fr' ? 'fr-CH' : 'en';
    if (!l) { root.innerHTML = '<div class="empty-note">' + t.notFound + ' <a href="' + ROOT + 'index.html">' + t.back + '</a></div>'; return; }
    const S = W.SEO || {}, rent = l.deal === 'rent', place = (S.places || {})[l.place] || {}, dealUrl = rent ? (lang === 'fr' ? 'louer.html' : 'mieten.html') : (lang === 'fr' ? 'acheter.html' : 'kaufen.html');
    const title = titleOf(l, lang), loc = W.CITIES.localize;
    D.title = title + ' – ' + l.quarter + ' | Lage';
    const keys = ['view:day', 'view:golden', 'view:night', 'room:wohnen'].concat(l.outdoor ? ['room:aussen'] : [], ['room:kueche', 'room:bad', 'house:day']);
    const checks = [];
    const river = l.riverView ? (lang === 'fr' ? 'Vue sur le ' : lang === 'en' ? 'View of the ' : 'Blick auf den ') + l.water : '';
    checks.push([true, t.view + ' ' + l.view.toFixed(1) + ' ' + t.viewOf, river || (l.vLake ? t.lake[l.vLake] : '')]);
    checks.push([l.noiseNight < 45, t.night + ' ' + l.noiseNight + ' dB', l.noiseNight < 45 ? t.quiet : t.loud]);
    checks.push([l.sun >= 5, t.sun + ' ' + l.sun.toFixed(1) + ' ' + t.h, '']);
    if (W.LAGE) checks.push([true, t.pt + ': ' + W.LAGE.station(l) + ' ' + t.min, '']);
    const feats = FEAT.filter(f => f[0](l)).map(f => lbl(f[lang === 'fr' ? 2 : lang === 'en' ? 3 : 1], l));
    const fits = pagesFor(l);
    root.innerHTML =
      '<nav class="bc" aria-label="Breadcrumb"><ol><li><a href="' + ROOT + 'index.html">' + t.home + '</a></li><li><a href="' + ROOT + dealUrl + '">' + (rent ? t.rent : t.buy) + '</a></li>' +
        (place[l.deal] ? '<li><a href="' + ROOT + place[l.deal] + '">' + esc(place.name || l.place) + '</a></li>' : '') + '<li aria-current="page">' + esc(title) + '</li></ol></nav>' +
      '<div class="dt"><div><div class="gal-main"><img id="galImg" alt=""><span class="gal-cap" id="galCap"></span></div>' +
        '<div class="thumbs" role="group" aria-label="Bilder">' + keys.map((k, i) => '<button type="button" data-g="' + i + '" aria-pressed="' + (i === 0) + '" aria-label="' + esc(t.gal[k]) + '"><img data-l="' + l.id + '" data-k="' + k + '" alt=""></button>').join('') + '</div>' +
        '<section class="sec"><h2>' + t.checks + '</h2><ul class="checks">' + checks.map(([ok, a, b]) => '<li' + (ok ? '' : ' class="is-warn"') + '>' + ic(ok ? ICON.check : ICON.alert, 16) + '<span>' + esc(a) + (b ? '<small>' + esc(b) + '</small>' : '') + '</span></li>').join('') +
          feats.map(f => '<li>' + ic(ICON.check, 16) + '<span>' + esc(f) + '</span></li>').join('') + '</ul></section>' +
        (lang === 'de' ? '<section class="sec"><h2>' + t.know + '</h2><p class="lead">' + esc(loc(l, l.ai)) + ' ' + esc(loc(l, l.caveat)) + '</p></section>' : '') +
        (fits.length ? '<section class="sec"><h2>' + t.fits + '</h2><ul class="pills">' + fits.map(p => '<li><a class="pill" href="' + ROOT + p.url + '">' + esc(p.label) + '</a></li>').join('') + '</ul></section>' : '') +
      '</div><aside class="dt-side"><div class="dt-card"><span class="dt-q">' + esc(l.quarter + ' · ' + (place.name || l.locality)) + '</span><h1>' + esc(title) + '</h1><p class="dt-addr">' + esc(l.street) + '</p>' +
          '<div class="dt-price">' + esc(W.DATA.fmt.price(l)) + ' <small>' + (rent ? t.perMonth : t.price) + '</small></div>' +
          '<ul class="facts"><li><b>' + W.DATA.fmt.zi(l) + '</b>' + t.rooms + '</li><li><b>' + l.m2 + ' m²</b>' + t.area + '</li><li><b>' + floorOf(l, t, lang) + '</b>' + t.floor + '</li><li><b>' + l.year + '</b>' + t.year + '</li><li><b>' + l.baths + '</b>' + t.baths + '</li><li><b>' + esc(W.DATA.availShort(l)) + '</b>' + t.move + '</li></ul>' +
          '<div class="cta-row"><a class="btn btn-pri" href="#anfrage">' + (rent ? t.ask : t.askBuy) + '</a><button type="button" class="btn btn-sec" data-save="' + l.id + '" aria-pressed="false">' + ic(ICON.heart, 16, 'currentColor') + t.save + '</button>' +
          '<a class="btn btn-sec" href="' + ROOT + 'suche.html#l-' + l.id + '">' + ic(ICON.pin, 16) + t.map + '</a></div></div>' +
        '<div class="dt-card" id="anfrage"><h2 style="margin:0 0 12px;font-size:18px">' + (rent ? t.ask : t.askBuy) + '</h2><form class="form" id="askForm" novalidate><label>' + t.name + '<input name="n" autocomplete="name" required></label><label>' + t.mail + '<input name="m" type="email" autocomplete="email" required></label><label>' + t.msg + '<textarea name="t"></textarea></label><button class="btn btn-pri" type="submit">' + t.send + '</button></form></div>' +
      '</aside></div>';
    let cur = 0;
    const show = i => { cur = i; const k = keys[i]; $('#galImg').src = W.SCENE.img(l, k); $('#galImg').alt = t.gal[k]; $('#galCap').textContent = t.gal[k] + ' · ' + t.sample; $$('.thumbs [data-g]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.g === i))); };
    show(0);
    root.addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (b) show(+b.dataset.g); });
    $('#askForm').addEventListener('submit', e => { e.preventDefault(); e.target.outerHTML = '<p class="form-ok">' + t.sent + '</p>'; });
    hydrate(root);
  }
  function renderSaved(root) {
    const s = savedMap(), ids = Object.keys(s).sort((a, b) => s[b] - s[a]), items = ids.map(find).filter(Boolean);
    root.innerHTML = items.length ? '<div class="cards">' + items.map(l => cardHtml(l, PLACE_LANG[l.place] || 'de')).join('') + '</div>' : '<p class="empty-note">' + T.de.empty + '</p>';
    hydrate(root);
  }

  /* ---------- home search: deal, place and an optional wish lead to the best page ---------- */
  function homeSearch(form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const S = W.SEO || {}, deal = form.deal.value, place = form.place.value, wish = form.wish.value;
      const exact = wish && (S.pages || []).find(p => p.cluster === wish && p.deal === deal && p.place === place);
      const placeHub = ((S.places || {})[place] || {})[deal];
      const url = exact ? exact.url : wish ? 'suche.html#' + deal + '-' + wish + '-in-' + place : placeHub || 'suche.html#' + deal + '-in-' + place;
      location.href = ROOT + url;
    });
  }

  const dt = $('#dt');
  if (dt) { renderListing(dt); W.addEventListener('hashchange', () => { renderListing(dt); paintSaved(); W.scrollTo(0, 0); }); }
  const sv = $('#savedList');
  if (sv) renderSaved(sv);
  const hs = $('#homeSearch');
  if (hs) homeSearch(hs);
  hydrate(D);
  paintSaved();
})();
